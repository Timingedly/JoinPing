// WebSocket初始化插件
// 功能：在Vue应用启动时初始化WebSocket连接
// 说明：确保用户刷新页面后也能自动连接WebSocket

import Vue from 'vue'
import wsManager from '@/utils/websocket'
import router from '@/router'

// 全局标志，防止重复初始化
let isWebSocketInitialized = false

// WebSocket初始化方法
function initWebSocket() {
  // 防止重复初始化
  if (isWebSocketInitialized) {
    console.log('WebSocket已初始化，跳过重复初始化')
    return
  }
  
  // 检查是否有Sa-Token，有token才连接WebSocket
  const token = localStorage.getItem('satoken')
  if (!token) {
    console.log('未检测到Sa-Token，跳过WebSocket连接')
    return
  }
  
  // 从localStorage获取用户ID
  const userId = localStorage.getItem('userId')
  if (!userId) {
    console.log('未找到用户ID，跳过WebSocket连接')
    return
  }
  
  // 连接WebSocket
  const wsConnected = wsManager.connect(userId)
  if (wsConnected) {
    console.log('WebSocket连接已初始化')
    isWebSocketInitialized = true
  } else {
    console.error('WebSocket连接初始化失败')
  }
}

// 重置WebSocket初始化状态（用于登出后重新登录）
function resetWebSocketInit() {
  isWebSocketInitialized = false
}

// 注册WebSocket初始化插件
Vue.use({
  install(Vue) {
    // 添加全局方法
    Vue.prototype.$ws = wsManager
    
    // 使用路由守卫来初始化WebSocket，而不是在每个组件创建时
    router.afterEach((to) => {
      // 只在需要认证的页面初始化WebSocket
      if (to.matched.some(record => record.meta.requiresAuth)) {
        initWebSocket()
      }
    })
  }
})

// 导出初始化方法，供其他地方使用
export { initWebSocket, resetWebSocketInit }