<template>
  <div class="notification-bar">
    <!-- 顶部标题栏 - 固定不变 -->
    <div class="header">
      <div class="title">首页</div>
    </div>
    
    <!-- 通知区域 - 根据API返回的数据动态显示/隐藏 -->
    <div v-if="notification && notification.content" class="notification-area">
      <!-- 通知框 - 灰色背景，只显示底边框 -->
      <div class="notification-box">
        <!-- 通知内容 - 黄色文字 -->
        <div class="notification-content">{{ notification.content }}</div>
      </div>
      
      <!-- 通知按钮 - 圆形，可点击跳转到通知页面 -->
      <div class="notification-btn" @click="goToNotifications">
        <img src="@/assets/images/notification.png" alt="通知" />
      </div>
    </div>
  </div>
</template>

<script>
// NotificationBar.vue - 顶部通知栏组件
// 功能：显示首页标题和通知信息
// 设计要点：
// 1. 顶部"首页"标题固定不变，红色背景
// 2. 通知框根据API返回的数据动态显示/隐藏
// 3. 通知框为灰色背景，黄色文字，只显示底边框
// 4. 通知按钮为圆形，可点击跳转到通知页面
// 5. 每次刷新首页时发送请求获取通知信息

import { homeApi } from '@/api/index'

export default {
  name: 'NotificationBar',
  data() {
    return {
      // 通知信息
      notification: null,
      // 加载状态
      loading: false
    }
  },
  created() {
    // 组件创建时获取通知信息
    this.fetchNotification()
  },
  methods: {
    // 获取通知信息
    // 方案1：每次组件创建时自动获取（当前采用）
    // 方案2：由父组件调用方法获取
    // 方案3：通过Vuex全局状态管理
    // 疑惑点：是否需要缓存通知信息？考虑到通知可能实时更新，暂不缓存
    async fetchNotification() {
      try {
        this.loading = true
        // 调用API获取通知信息
        const response = await homeApi.getNotification()
        
        // 处理API返回数据
        // TODO: 根据实际API返回结构调整数据获取方式
        if (response && response.data) {
          this.notification = response.data
        } else {
          this.notification = null
        }
      } catch (error) {
        console.error('获取通知信息失败:', error)
        this.notification = null
      } finally {
        this.loading = false
      }
    },
    
    // 跳转到通知页面
    goToNotifications() {
      // 跳转到通知页面
      this.$router.push('/notifications')
    }
  }
}
</script>

<style scoped>
.notification-bar {
  width: 100%;
  background-color: #ffffff;
}

.header {
  height: 44px;
  background-color: #ff3b30; /* 红色背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  /* 适配iPhone刘海屏顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff; /* 白色文字 */
}

.notification-area {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  position: relative;
}

.notification-box {
  flex: 1;
  background-color: #f5f5f5; /* 灰色背景 */
  border-radius: 4px;
  padding: 8px 12px;
  margin-right: 12px;
  position: relative;
  /* 只显示底边框 */
  border-bottom: 1px solid #e5e5ea;
}

.notification-content {
  font-size: 14px;
  color: #ffcc00; /* 黄色文字 */
  line-height: 1.4;
  /* 文字超出显示省略号 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%; /* 圆形 */
  background-color: #f5f5f5; /* 灰色背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.notification-btn:active {
  background-color: #e5e5ea;
}

.notification-btn img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
</style>