<template>
  <div class="notification-container">
    <!-- 左侧通知内容区域 - 有通知时显示，没有时隐藏 -->
    <div class="notification-content" v-if="shouldShowNotification">
      <!-- 显示通知文本 -->
      <div class="notification-text" @click="goToNotificationPage">
        {{ displayNotificationText }}
      </div>
      <!-- 底部下划线 -->
      <div class="notification-line"></div>
    </div>
    
    <!-- 右侧常驻通知图标 - 始终显示 -->
    <div class="notification-icon" @click="goToNotificationPage">
      <div class="circle-icon">通知</div>
    </div>
  </div>
</template>

<script>
// NotificationBlock.vue - 通知块组件
// 功能：显示通知信息，包含可隐藏的通知内容和常驻的通知图标
// 设计要点：
// 1. 左侧通知内容区域根据是否有通知来显示/隐藏
// 2. 右侧常驻一个圆形"通知"图标
// 3. 有通知时左侧显示黄色文本并有底部灰色边框
// 4. 点击任意区域跳转到通知页面
// 5. 支持接收WebSocket消息并显示在通知栏中
import { homeApi } from '../api/index.js'
import wsManager from '../utils/websocket.js'

export default {
  name: 'NotificationBlock',
  data() {
    return {
      hasNotification: false, // 控制通知是否显示，默认为false，根据接口返回值确定
      notificationText: '您有未读消息', // 默认通知文本
      notificationData: null, // 存储通知数据
      wsNotificationText: null, // 存储WebSocket发送的通知文本
      hasWsNotification: false, // 是否有WebSocket通知
      apiResponseData: null // 存储API返回的原始数据，用于调试
    }
  },
  mounted() {
    // 组件挂载后获取通知数据，确保页面刷新时能获取最新状态
    this.fetchNotification()
    
    // 注册WebSocket消息监听器
    this.initWebSocketListener()
  },
  beforeDestroy() {
    // 组件销毁前移除WebSocket消息监听器
    this.removeWebSocketListener()
  },
  methods: {
    // 获取通知数据
    // API: GET /notice/status
    // 功能：从后端获取通知状态，0表示有未读消息，1表示没有未读消息
    fetchNotification() {
      // 页面刷新时重置WebSocket通知状态，确保优先显示接口返回的默认文本
      this.hasWsNotification = false
      this.wsNotificationText = null
      
      console.log('开始调用通知状态接口...')
      
      // 调用通知状态接口
      homeApi.getNoticeStatus()
        .then(response => {
          console.log('通知状态接口响应:', response)
          this.apiResponseData = response // 存储原始响应数据用于调试
          
          // 处理成功响应
          // 根据后端实际返回的数据结构：{code:200,message:"success",data:0,hasSuccessed:true}
          if (response && response.hasSuccessed) {
            console.log('接口调用成功，返回数据:', response.data)
            // 根据返回值设置通知状态
            // 0表示有未读消息，显示通知
            // 1表示没有未读消息，隐藏通知
            this.hasNotification = response.data === 0
            console.log('设置hasNotification为:', this.hasNotification)
            
            // 如果后端返回0，确保显示默认文本
            if (response.data === 0) {
              console.log('后端返回0，应该显示默认文本:', this.notificationText)
            }
          } else {
            console.log('接口调用失败或返回状态不正确')
            // 接口调用失败，默认不显示通知
            this.hasNotification = false
          }
        })
        .catch(error => {
          console.error('获取通知状态失败:', error)
          // 发生错误时默认不显示通知
          this.hasNotification = false
        })
    },
    
    // 初始化WebSocket监听器
    initWebSocketListener() {
      // 注册WebSocket消息处理器
      if (wsManager) {
        wsManager.on('message', this.handleWebSocketMessage)
        console.log('已注册WebSocket消息监听器')
      }
    },
    
    // 移除WebSocket监听器
    removeWebSocketListener() {
      if (wsManager) {
        wsManager.off('message', this.handleWebSocketMessage)
        console.log('已移除WebSocket消息监听器')
      }
    },
    
    // 处理WebSocket消息
    handleWebSocketMessage(data) {
      console.log('收到WebSocket消息:', data)
      
      // 检查是否是通知类型的消息
      // 假设后端发送的消息格式为 { type: 'notification', text: '通知内容' }
      // 或者直接是文本消息
      if (data) {
        let notificationText = null
        
        // 如果是对象类型，检查是否有text属性或content属性
        if (typeof data === 'object') {
          if (data.text) {
            notificationText = data.text
          } else if (data.content) {
            notificationText = data.content
          } else if (data.message) {
            notificationText = data.message
          }
        } 
        // 如果是字符串类型，直接作为通知文本
        else if (typeof data === 'string') {
          notificationText = data
        }
        
        // 如果获取到通知文本，则显示在通知栏
        if (notificationText) {
          this.wsNotificationText = notificationText
          this.hasWsNotification = true
          console.log('显示WebSocket通知:', notificationText)
        }
      }
    },
    
    // 跳转到通知页面
    goToNotificationPage() {
      // 使用Vue Router跳转到通知页面
      this.$router.push('/notifications')
    }
  },
  computed: {
    // 计算是否应该显示通知栏
    // 逻辑：1. 有WebSocket通知时显示 2. 或者接口返回有未读消息时显示
    shouldShowNotification() {
      const shouldShow = this.hasWsNotification || this.hasNotification
      console.log('shouldShowNotification计算属性:', {
        hasWsNotification: this.hasWsNotification,
        hasNotification: this.hasNotification,
        result: shouldShow
      })
      return shouldShow
    },
    
    // 计算显示的通知文本
    // 逻辑：1. 优先显示WebSocket通知文本 2. 有接口通知时显示默认文本 3. 都没有时不显示
    displayNotificationText() {
      let text = ''
      
      // 如果有WebSocket通知，优先显示WebSocket通知文本
      if (this.hasWsNotification && this.wsNotificationText) {
        text = this.wsNotificationText
      }
      // 如果没有WebSocket通知但有接口通知，显示默认通知文本
      else if (this.hasNotification) {
        text = this.notificationText
      }
      
      console.log('displayNotificationText计算属性:', {
        hasWsNotification: this.hasWsNotification,
        wsNotificationText: this.wsNotificationText,
        hasNotification: this.hasNotification,
        notificationText: this.notificationText,
        result: text
      })
      
      return text
    }
  }
}
</script>

<style scoped>
/* 通知容器 - 采用flex布局，确保左右两部分正确排列 */
.notification-container {
  display: flex;
  justify-content: flex-end; /* 改为右对齐，确保通知图标始终在右侧 */
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background-color: transparent;
  position: relative;
}

/* 左侧通知内容区域 - 有通知时显示，没有时隐藏 */
.notification-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-right: 12px;
  min-height: 20px; /* 确保有最小高度 */
  visibility: visible; /* 确保可见性 */
  opacity: 1; /* 确保不透明度 */
}

/* 通知文本 - 黄色字体，居中显示 */
.notification-text {
  color: #FFD700; /* 通知词是黄色的 */
  font-size: 14px;
  margin-bottom: 4px;
  cursor: pointer;
  text-align: center; /* 文本居中显示 */
  font-weight: bold; /* 加粗字体 */
  line-height: 1.4; /* 设置行高 */
}

/* 底部下划线 - 有通知时显示 */
.notification-line {
  height: 1px;
  background-color: #808080; /* 灰色下划线 */
  width: 100%;
}

/* 右侧常驻通知图标 */
.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  margin-left: auto; /* 添加自动左边距，确保图标始终在最右侧 */
}

/* 圆形通知图标 - 不是灰色的 */
.circle-icon {
  width: 36px;
  height: 36px;
  border-radius: 50%; /* 圆形 */
  background-color: #0000FF; /* 蓝色背景 - 替代灰色 */
  color: #FFFFFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 点击效果 */
.circle-icon:active {
  background-color: #606060;
}

.notification-text:active {
  opacity: 0.8;
}
</style>
