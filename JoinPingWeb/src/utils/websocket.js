// WebSocket管理工具
// 功能：管理WebSocket连接，处理消息收发
// 说明：对接后端WebSocketServer，实现实时通信

class WebSocketManager {
  constructor() {
    this.ws = null
    this.userId = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 10000 // 修改为10秒，避免过于频繁的重连
    // 不需要主动发送心跳，后端会主动发送ping
    this.heartbeatInterval = 30000 // 与后端保持一致，30秒
    this.heartbeatTimer = null
    this.messageHandlers = new Map() // 消息处理器
    this.isConnected = false
    this.lastPingTime = 0 // 记录最后一次收到ping的时间
    this.pingTimeout = 65000 // 65秒无ping响应认为连接超时，大于后端的60秒，给网络延迟留出缓冲
    this.pingCheckTimer = null // ping超时检查定时器
    this.isConnecting = false // 防止重复连接的标志
    this.lastConnectAttempt = 0 // 记录最后一次连接尝试的时间
    this.minConnectInterval = 3000 // 最小连接间隔，防止频繁连接
  }

  // 连接WebSocket
  connect(userId) {
    console.log(`WebSocket connect方法被调用，用户ID：${userId}，当前连接状态：${this.isConnected}，WebSocket状态：${this.ws ? this.ws.readyState : 'null'}`)
    
    if (!userId) {
      console.error('WebSocket连接失败：用户ID不能为空')
      return false
    }

    // 检查连接间隔，防止频繁连接
    const now = Date.now()
    if (now - this.lastConnectAttempt < this.minConnectInterval) {
      console.log(`连接请求过于频繁，请稍后再试。距离上次连接尝试仅${(now - this.lastConnectAttempt)/1000}秒`)
      return false
    }
    this.lastConnectAttempt = now

    // 防止重复连接
    if (this.isConnected && this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('WebSocket已连接，无需重复连接')
      return true
    }
    
    // 如果正在连接中，不重复创建连接
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      console.log('WebSocket正在连接中，请稍候...')
      return false
    }

    // 如果已有连接但状态不是OPEN，先断开
    if (this.ws) {
      this.disconnect()
    }

    this.userId = userId
    this.isConnecting = true
    // 确保userId是字符串类型，因为URL路径参数需要是字符串
    const userIdStr = String(userId)
    
    // 获取Sa-Token
    const token = localStorage.getItem('satoken')
    
    // 构建WebSocket URL，连接到后端WebSocketServer
    // 后端WebSocketServer路径：/websocket/{userId}
    const wsUrl = `ws://localhost:8080/websocket/${userIdStr}`;
    
    console.log(`正在连接WebSocket，用户ID：${userIdStr}`)
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log(`WebSocket连接成功，用户ID：${userIdStr}`)
        this.isConnected = true
        this.isConnecting = false
        this.reconnectAttempts = 0
        // 连接成功后初始化lastPingTime，但不立即开始检查
        // 等待后端发送第一个ping后再开始检查
        this.lastPingTime = Date.now()
        
        // 不需要主动发送心跳，后端会主动发送ping
        // 延迟启动ping检查，给后端一些时间发送第一个ping
        // 修改延迟时间为5秒，更早开始检查
        setTimeout(() => {
          this.startPingCheck()
        }, 5000) // 5秒后开始检查ping响应，确保后端已发送第一个ping
        
        // 触发连接成功事件
        this.triggerHandler('open', { userId: userIdStr })
      }
      
      this.ws.onmessage = (event) => {
        try {
          // 尝试解析为JSON消息
          const data = JSON.parse(event.data)
          console.log('收到WebSocket消息:', data)
          
          // 处理ping消息，后端会发送{"type":"ping"}
          if (data.type === 'ping') {
            console.log('收到WebSocket ping消息，回复pong')
            // 更新最后收到ping的时间
            this.lastPingTime = Date.now()
            // 回复与后端格式一致的pong消息
            this.send(JSON.stringify({ type: 'pong' }))
            return
          }
          
          // 处理pong响应，虽然前端不主动发送ping，但可能收到其他情况的pong
          if (data.type === 'pong') {
            console.log('收到WebSocket pong响应')
            return
          }
          
          // 触发消息处理器
          this.triggerHandler('message', data)
        } catch (error) {
          // 处理纯文本的ping/pong消息
          if (event.data === 'ping') {
            console.log('收到WebSocket ping，回复pong')
            // 更新最后收到ping的时间
            this.lastPingTime = Date.now()
            this.send('pong')
            return
          }
          
          if (event.data === 'pong') {
            console.log('收到WebSocket pong响应')
            return
          }
          
          // 如果不是ping/pong，可能是其他纯文本消息
          console.log('收到WebSocket文本消息：', event.data)
          this.triggerHandler('message', { text: event.data })
        }
      }
      
      this.ws.onclose = (event) => {
        console.log(`WebSocket连接关闭，用户ID：${userIdStr}，代码：${event.code}`)
        this.isConnected = false
        this.isConnecting = false
        this.stopHeartbeat()
        this.stopPingCheck()
        
        // 触发关闭事件
        this.triggerHandler('close', { code: event.code, userId: userIdStr })
        
        // 只有在非正常关闭(代码不是1000)时才自动重连
        // 避免在页面切换或用户主动关闭时重连
        const isNormalClose = event.code === 1000
        if (!isNormalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          // 使用递增的重连延迟，避免频繁重连
          const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts - 1)
          console.log(`尝试重连WebSocket，第${this.reconnectAttempts}次，延迟${delay/1000}秒`)
          setTimeout(() => {
            // 再次检查用户ID，防止在重连延迟期间用户已登出
            const currentUserId = localStorage.getItem('userId')
            if (currentUserId === String(userId)) {
              this.connect(userId)
            } else {
              console.log('用户已变更，取消重连')
            }
          }, delay)
        } else if (isNormalClose) {
          console.log('WebSocket正常关闭，不进行重连')
        } else {
          console.error('WebSocket重连次数已达上限，停止重连')
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误：', error)
        this.isConnected = false
        this.isConnecting = false
        
        // 触发错误事件
        this.triggerHandler('error', error)
      }
      
      return true
    } catch (error) {
      console.error('创建WebSocket连接失败：', error)
      return false
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.stopHeartbeat()
      this.stopPingCheck()
      this.ws.close(1000, '用户主动断开连接')
      this.ws = null
    }
    this.isConnected = false
    this.isConnecting = false
    console.log('WebSocket连接已断开')
  }

  // 发送消息
  send(data) {
    if (!this.isConnected || !this.ws) {
      console.error('WebSocket未连接，无法发送消息')
      return false
    }
    
    try {
      let message
      // 如果是字符串，直接发送
      if (typeof data === 'string') {
        message = data
      } 
      // 如果是对象，转换为JSON字符串发送
      else if (typeof data === 'object' && data !== null) {
        message = JSON.stringify(data)
      }
      // 其他类型（数字、布尔值等）转换为字符串发送
      else {
        message = String(data)
      }
      
      this.ws.send(message)
      console.log('发送WebSocket消息：', message)
      return true
    } catch (error) {
      console.error('发送WebSocket消息失败：', error)
      return false
    }
  }

  // 开始心跳
  // 注意：前端不需要主动发送心跳，后端会主动发送ping
  // 这个方法保留但不使用，以防需要主动发送心跳的情况
  startHeartbeat() {
    this.stopHeartbeat()
    console.log('开始WebSocket心跳检测')
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected) {
        // 不主动发送ping，等待后端发送
        console.log('等待后端发送ping心跳')
      } else {
        console.warn('WebSocket连接状态异常，停止心跳')
        this.stopHeartbeat()
      }
    }, this.heartbeatInterval)
  }

  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  // 开始ping超时检查
  startPingCheck() {
    this.stopPingCheck()
    // 如果还没有收到过ping，初始化lastPingTime为当前时间
    if (this.lastPingTime === 0) {
      this.lastPingTime = Date.now()
    }
    
    this.pingCheckTimer = setInterval(() => {
      if (this.isConnected) {
        const timeSinceLastPing = Date.now() - this.lastPingTime
        if (timeSinceLastPing > this.pingTimeout) {
          console.warn(`WebSocket连接超时，已${Math.floor(timeSinceLastPing/1000)}秒未收到后端ping，可能连接已断开`)
          // 只是断开连接，不立即重连，让onclose事件处理重连逻辑
          this.disconnect()
        } else {
          // 每60秒打印一次正常日志，避免日志过多
          if (Math.floor(timeSinceLastPing / 1000) % 60 === 0 && timeSinceLastPing > 0) {
            console.log(`WebSocket连接正常，距离上次后端ping${Math.floor(timeSinceLastPing/1000)}秒`)
          }
        }
      }
    }, 15000) // 修改为每15秒检查一次，降低检查频率
  }

  // 停止ping超时检查
  stopPingCheck() {
    if (this.pingCheckTimer) {
      clearInterval(this.pingCheckTimer)
      this.pingCheckTimer = null
    }
  }

  // 注册消息处理器
  on(type, handler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    this.messageHandlers.get(type).push(handler)
  }

  // 移除消息处理器
  off(type, handler) {
    if (this.messageHandlers.has(type)) {
      const handlers = this.messageHandlers.get(type)
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  // 触发处理器
  triggerHandler(type, data) {
    if (this.messageHandlers.has(type)) {
      this.messageHandlers.get(type).forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`执行WebSocket消息处理器失败，类型：${type}`, error)
        }
      })
    }
  }

  // 获取连接状态
  getConnectionState() {
    if (!this.ws) return 'DISCONNECTED'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING'
      case WebSocket.OPEN: return 'OPEN'
      case WebSocket.CLOSING: return 'CLOSING'
      case WebSocket.CLOSED: return 'CLOSED'
      default: return 'UNKNOWN'
    }
  }
}

// 创建全局WebSocket管理器实例
const wsManager = new WebSocketManager()

// 将WebSocket管理器挂载到window对象，方便全局访问
if (typeof window !== 'undefined') {
  window.wsManager = wsManager
}

// 导出WebSocket管理器
export default wsManager