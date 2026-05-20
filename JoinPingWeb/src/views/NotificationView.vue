<template>
  <div class="notification-page">
    <!-- 顶部固定区域 - 红色背景 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <span class="back-icon">&lt;</span>
      </div>
      <div class="title">通知</div>
    </div>
    
    <!-- 通知分类选择区域 -->
    <div class="category-section">
      <div 
        class="category-item" 
        :class="{ active: activeCategory === 'system' }"
        @click="switchCategory('system')"
      >
        系统通知
      </div>
      <div 
        class="category-item" 
        :class="{ active: activeCategory === 'user' }"
        @click="switchCategory('user')"
      >
        用户通知
      </div>
    </div>
    
    <!-- 清空按钮区域 -->
    <div class="clear-section">
      <button 
        class="clear-button"
        @click="showClearConfirm"
        :disabled="notifications.length === 0"
      >
        清空
      </button>
    </div>
    
    <!-- 确认清空弹窗 -->
    <div v-if="showClearDialog" class="modal-overlay" @click="hideClearConfirm">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>确认清空</h3>
        </div>
        <div class="modal-body">
          <p>确认清空{{ activeCategory === 'system' ? '系统' : '用户' }}通知吗？</p>
        </div>
        <div class="modal-footer">
          <button class="modal-button cancel" @click="hideClearConfirm">取消</button>
          <button class="modal-button confirm" @click="confirmClear">确定</button>
        </div>
      </div>
    </div>

    <!-- 错误弹窗 -->
    <div v-if="errorDialogVisible" class="modal-overlay" @click="hideErrorDialog">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>提示</h3>
        </div>
        <div class="modal-body">
          <p>{{ errorMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="modal-button confirm" @click="hideErrorDialog">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 通知列表区域 - 固定高度，可滚动 -->
    <div class="notification-section">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="notifications.length === 0" class="empty-result">
        暂无通知
      </div>
      <div v-else class="notification-list">
        <div 
          v-for="(notification, index) in notifications" 
          :key="notification.id"
          class="notification-item"
          @click="handleNotificationClick(notification)"
        >
          <!-- 左上角时间 -->
          <div class="notification-time">
            {{ formatFullTime(notification.createTime) }}
          </div>
          <!-- 中间通知文本 -->
          <!-- 用户通知：分两行显示，第一行用户名蓝色，第二行固定文本 -->
          <!-- 系统通知：直接显示content字段，居中展示 -->
          <div class="notification-content" :class="{ 'system-notification': activeCategory === 'system', 'user-notification': activeCategory === 'user' }">
            <template v-if="activeCategory === 'user'">
              <div class="user-notification-line1">
                <span class="user-label">用户</span> <span class="username">{{ notification.fromUserName || '匿名用户' }}</span>
              </div>
              <div class="user-notification-line2">
                回复了您的评论
              </div>
            </template>
            <template v-else>
              {{ notification.content }}
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页器 - 固定在底部 -->
    <div class="pagination-section">
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :page-size="pageSize"
        :total-items="totalCount"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
    

  </div>
</template>

<script>
// NotificationView.vue - 通知页面组件
// 功能：显示通知列表，支持分页浏览
// 设计要点：
// 1. 顶部标题"通知"，带返回按钮
// 2. 通知列表在固定区域内滚动
// 3. 每个通知项显示时间和内容
// 4. 固定分页器在底部

import Pagination from '@/components/Pagination.vue'
import { homeApi, subjectApi, userTopicViewHistoryApi } from '../api/index.js'

export default {
  name: 'NotificationView',
  components: {
    Pagination
  },
  data() {
    return {
      notifications: [], // 通知列表
      loading: false, // 加载状态
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页显示数量
      totalCount: 0, // 总记录数
      totalPages: 0, // 总页数
      activeCategory: 'system', // 当前激活的分类：system-系统通知，user-用户通知
      showClearDialog: false, // 是否显示清空确认弹窗
      clearing: false, // 清空操作进行中状态
      errorDialogVisible: false, // 是否显示错误弹窗
      errorMessage: '' // 错误消息
    }
  },
  created() {
    // 组件创建时获取通知列表
    this.fetchNotifications()
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.back()
    },
    
    // 切换通知分类
    switchCategory(category) {
      if (this.activeCategory === category) return
      
      this.activeCategory = category
      this.currentPage = 1 // 切换分类时重置到第一页
      this.fetchNotifications()
    },
    
    // 获取通知列表
    // API: 根据分类调用不同的后端接口
    // - 系统通知：GET /notice/system
    // - 用户通知：GET /notice/reply
    async fetchNotifications() {
      this.loading = true
      try {
        // 根据当前分类选择不同的API
        let apiCall
        if (this.activeCategory === 'system') {
          // 获取系统通知分页列表
          apiCall = homeApi.getSystemNoticePage(this.currentPage, this.pageSize)
        } else {
          // 获取用户回复通知分页列表
          apiCall = homeApi.getUserReplyNoticePage(this.currentPage, this.pageSize)
        }
        
        // 调用后端API
        const response = await apiCall
        
        // 处理API返回数据
        if (response.code === 200 && response.hasSuccessed) {
          // 更新通知列表和分页信息
          // 确保数据类型正确，转换为Number类型避免Vue警告
          this.notifications = response.data.list || []
          this.totalCount = Number(response.data.total) || 0
          this.currentPage = Number(response.data.current) || 1
          this.pageSize = Number(response.data.size) || 10
          this.totalPages = Number(response.data.pages) || 0
        } else {
          // API调用失败，使用模拟数据
          console.warn('API调用失败，使用模拟数据')
          const mockData = this.generateMockNotifications()
          this.notifications = mockData.notifications
          this.totalCount = Number(mockData.totalCount) || 0
          this.totalPages = Math.ceil(this.totalCount / this.pageSize)
        }
      } catch (error) {
        console.error('获取通知列表失败:', error)
        // 发生错误时使用模拟数据
        const mockData = this.generateMockNotifications()
        this.notifications = mockData.notifications
        this.totalCount = Number(mockData.totalCount) || 0
        this.totalPages = Math.ceil(this.totalCount / this.pageSize)
      } finally {
        this.loading = false
      }
    },
    
    // 生成模拟通知数据
    generateMockNotifications() {
      // 模拟通知数据结构
      const mockNotifications = []
      const startIndex = (this.currentPage - 1) * this.pageSize
      
      // 根据分类生成不同类型的通知内容
      let notificationTypes = []
      let totalCount = 50
      
      if (this.activeCategory === 'system') {
        // 系统通知类型
        notificationTypes = [
          '系统更新：新功能已上线，快来体验吧！',
          '系统维护：今晚22:00-23:00系统将进行维护升级',
          '社区公告：社区规范更新，请查看最新条款',
          '安全提醒：请定期更新密码保护账户安全',
          '功能优化：搜索功能已优化，体验更佳',
          '版本更新：v2.1.0版本已发布',
          '数据备份：系统将在凌晨进行数据备份',
          '服务通知：服务器扩容完成，性能提升'
        ]
        totalCount = 35 // 系统通知总数
      } else {
        // 用户通知类型
        notificationTypes = [
          '用户"篮球迷"评论了你的话题',
          '用户"足球小将"点赞了你的回复',
          '用户"运动达人"关注了你',
          '你的话题"NBA季后赛预测"收到新回复',
          '用户"体育爱好者"回复了你的评论',
          '你的回复被用户"运动健将"点赞',
          '用户"体育迷"在话题中提到了你',
          '你的关注用户"体育专家"发布了新话题'
        ]
        totalCount = 25 // 用户通知总数
      }
      
      // 生成模拟通知数据
      for (let i = 0; i < this.pageSize; i++) {
        const index = startIndex + i
        if (index >= totalCount) break // 根据分类限制数据量
        
        const randomTypeIndex = index % notificationTypes.length
        
        // 生成随机时间，从最近到最远
        const hoursAgo = index * 2 + 1
        const createTime = new Date(Date.now() - 1000 * 60 * 60 * hoursAgo).toISOString()
        
        mockNotifications.push({
          id: `notification_${this.activeCategory}_${index}`,
          content: notificationTypes[randomTypeIndex],
          createTime: createTime,
          isRead: index % 3 !== 0, // 模拟部分已读状态
          type: this.activeCategory, // 添加分类类型
          objectId: `comment_${index}` // 添加objectId字段用于跳转测试
        })
      }
      
      return {
        notifications: mockNotifications,
        totalCount: totalCount // 根据分类设置总数据量
      }
    },
    
    // 处理页码变化
    handlePageChange(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      
      this.currentPage = page
      this.fetchNotifications()
    },
    
    // 处理每页显示条数变化
    handlePageSizeChange(pageSize, page) {
      this.pageSize = pageSize
      this.currentPage = page
      this.totalPages = Math.ceil(this.totalCount / this.pageSize)
      this.fetchNotifications()
    },
    
    // 格式化时间显示（简化版）
    formatTime(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now - date
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffHours / 24)
      
      // 如果是今天的通知，显示时间
      if (diffHours < 24) {
        const hours = date.getHours().toString().padStart(2, '0')
        const minutes = date.getMinutes().toString().padStart(2, '0')
        return `${hours}:${minutes}`
      } 
      // 如果是昨天的通知，显示"昨天"
      else if (diffDays === 1) {
        return '昨天'
      } 
      // 如果是更早的通知，显示月日
      else {
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        return `${month}-${day}`
      }
    },
    
    // 格式化完整时间显示：年-月-日 时:分:秒
    formatFullTime(dateString) {
      if (!dateString) return ''
      
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      const seconds = date.getSeconds().toString().padStart(2, '0')
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    
    /**
     * 显示清空确认弹窗
     */
    showClearConfirm() {
      this.showClearDialog = true
    },
    
    /**
     * 隐藏清空确认弹窗
     */
    hideClearConfirm() {
      this.showClearDialog = false
    },
    
    /**
     * 确认清空通知
     * 根据当前分类调用不同的后端清空接口
     */
    async confirmClear() {
      this.clearing = true
      
      try {
        // 根据当前分类选择不同的API
        const apiCall = this.activeCategory === 'system' 
          ? homeApi.deleteSystemNotice()
          : homeApi.deleteUserReplyNotice()
        
        // 调用后端API
        const response = await apiCall
        
        // 处理成功响应
        if (response.code === 200 && response.hasSuccessed) {
          // 清空成功后，清空当前通知列表并重置分页信息
          this.notifications = []
          this.totalCount = 0
          this.currentPage = 1
          this.totalPages = 0
          
          // 显示成功提示
          this.$toast && this.$toast(`清空${this.activeCategory === 'system' ? '系统' : '用户'}通知成功`)
        } else {
          // 如果API调用失败，显示错误提示
          this.$toast && this.$toast(`清空${this.activeCategory === 'system' ? '系统' : '用户'}通知失败：${response.message || '未知错误'}`)
        }
      } catch (error) {
        console.error('清空通知失败:', error)
        // 发生错误时显示错误提示
        this.$toast && this.$toast(`清空${this.activeCategory === 'system' ? '系统' : '用户'}通知失败：网络错误或服务器异常`)
      } finally {
        this.clearing = false
        this.hideClearConfirm()
      }
    },
    
    /**
     * 显示错误弹窗
     */
    showErrorDialog(message) {
      this.errorMessage = message
      this.errorDialogVisible = true
    },
    
    /**
     * 隐藏错误弹窗
     */
    hideErrorDialog() {
      this.errorDialogVisible = false
      this.errorMessage = ''
    },
    
    // 验证评论详情页访问权限
    // 功能：在跳转前验证评论详情页的两个API请求是否能够成功
    // 避免跳转后出现错误页面
    async validateCommentDetailAccess(commentId, commentData) {
      try {
        console.log('验证评论详情页访问权限，commentId:', commentId)
        
        // 模拟评论详情页的两个请求验证
        // 1. 验证一级评论详情接口
        const t1Response = await subjectApi.getT1CommentDetail(commentId)
        if (t1Response.code !== 200 || !t1Response.hasSuccessed) {
          console.error('一级评论详情接口验证失败:', t1Response)
          return false
        }
        
        // 2. 验证二级评论列表接口
        // 根据commentData获取thingId，用于二级评论查询
        const thingId = commentData.thingId || commentData.id
        if (!thingId) {
          console.error('无法获取thingId用于二级评论查询')
          return false
        }
        
        const t2Response = await subjectApi.getT2Comments(thingId, 1, 10)
        if (t2Response.code !== 200 || !t2Response.hasSuccessed) {
          console.error('二级评论列表接口验证失败:', t2Response)
          return false
        }
        
        console.log('评论详情页访问权限验证成功')
        return true
        
      } catch (error) {
        console.error('验证评论详情页访问权限失败:', error)
        return false
      }
    },
    
    // 处理通知点击事件
    // 功能：根据通知类型和分类，跳转到相应的详情页面
    // 用户通知：跳转到评论详情页面
    // 系统通知：显示通知内容或跳转到相关页面
    async handleNotificationClick(notification) {
      console.log('通知点击事件触发:', notification)
      console.log('当前分类:', this.activeCategory)
      
      // 根据当前分类处理不同类型的通知
      if (this.activeCategory === 'user') {
        // 用户通知：跳转到评论详情页面
        await this.handleUserNotificationClick(notification)
      } else {
        // 系统通知：显示通知内容或跳转到相关页面
        this.handleSystemNotificationClick(notification)
      }
    },
    
    // 处理用户通知点击事件
    // 功能：根据通知类型跳转到对应的评论详情页面
    async handleUserNotificationClick(notification) {
      console.log('用户通知点击:', notification)
      
      try {
        // 显示加载提示
        this.$toast && this.$toast('加载中...')
        
        // 调用后端API获取评论详情
        // 根据后端Notice实体类定义，objectId字段存储二级评论回复的通知对象ID
        // 应该使用notification.objectId作为参数传递给getT1CommentPageInfo接口
        const objectId = notification.objectId
        
        if (!objectId) {
          console.error('无法获取通知对象ID，通知数据:', notification)
          this.showErrorDialog('评论不存在或已被删除')
          return
        }
        
        console.log('正在获取评论详情，objectId:', objectId)
        
        // 调用后端API获取评论详情
        // API: GET /t2comment/index/{id} - 根据通知对象ID获取一级评论详情
        const response = await subjectApi.getT1CommentPageInfo(objectId)
        
        // 处理API响应
        if (response.code === 200 && response.hasSuccessed) {
          console.log('评论详情获取成功:', response.data)
          
          // 第一个请求成功，从响应数据中获取一级评论的id
          // 使用response.data.id作为跳转到评论详情页的参数
          const commentId = response.data.id
          
          if (!commentId) {
            console.error('无法从响应数据中获取评论ID，响应数据:', response.data)
            this.showErrorDialog('评论不存在或已被删除')
            return
          }
          
          console.log('使用响应数据中的评论ID进行跳转:', commentId)
          
          // 第一个请求成功，直接执行跳转
          // 评论详情页的额外请求在详情页内部处理
          // 从第一个请求的响应数据中获取index字段，用于定位二级评论位置
          const index = response.data.index || 1 // 默认定位到第一个评论
          this.navigateToCommentDetail(commentId, response.data, index)
          
          // 第一个请求成功，发送独立的请求给UserTopicViewHistoryController的insertOrUpdateByThingId方法
          // 参数取值于第一个请求的响应的thingId
          const thingId = response.data.thingId
          if (thingId) {
            console.log('发送浏览历史记录请求，thingId:', thingId)
            // 异步发送请求，不等待结果，避免影响页面跳转
            userTopicViewHistoryApi.insertOrUpdateByThingId(thingId)
              .then(historyResponse => {
                if (historyResponse.hasSuccessed) {
                  console.log('浏览历史记录成功')
                } else {
                  console.warn('浏览历史记录失败:', historyResponse.message)
                }
              })
              .catch(error => {
                console.error('浏览历史记录请求失败:', error)
              })
          } else {
            console.warn('无法从响应数据中获取thingId，跳过浏览历史记录')
          }
        } else {
          console.error('获取评论详情失败:', response)
          // 第一个请求失败，显示错误弹窗而不跳转页面
          this.showErrorDialog('评论不存在或已被删除')
        }
      } catch (error) {
        console.error('处理用户通知点击失败:', error)
        // 网络错误或其他异常，显示错误弹窗而不跳转页面
        this.showErrorDialog('评论不存在或已被删除')
      }
    },
    
    // 处理系统通知点击事件
    // 功能：显示系统通知内容或跳转到相关页面
    handleSystemNotificationClick(notification) {
      console.log('系统通知点击:', notification)
      
      // 系统通知通常不需要跳转，直接显示内容
      // 可以添加一些特殊处理，比如特定类型的系统通知跳转到特定页面
      this.$toast && this.$toast(`系统通知：${notification.content || '暂无内容'}`)
    },
    
    // 跳转到评论详情页面
    // 功能：根据评论ID和详情数据跳转到评论详情页面
    navigateToCommentDetail(commentId, commentData, index = 1) {
      console.log('跳转到评论详情页面，commentId:', commentId, 'commentData:', commentData, 'index:', index)
      
      // 构建跳转参数
      const queryParams = {
        thingId: commentData.thingId || commentData.subjectId || '',
        index: index // 传递index参数，用于定位二级评论位置
      }
      
      // 跳转到评论详情页面
      this.$router.push({
        path: `/comment/${commentId}`,
        query: queryParams
      })
    }
  }
}
</script>

<style scoped>
.notification-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
  color: #000000;
}

/* 顶部固定区域 - 红色背景 */
.header {
  height: 50px;
  background-color: #FF0000;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* 返回按钮 */
.back-button {
  position: absolute;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.back-icon {
  font-size: 24px;
  color: #ffffff;
  font-weight: bold;
}

/* 顶部标题 */
.title {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff;
}

/* 通知分类选择区域 */
.category-section {
  display: flex;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  margin-top: 50px; /* 顶部导航栏的高度 */
}

/* 清空按钮区域样式 */
.clear-section {
  display: flex;
  justify-content: flex-end;
  padding: 10px 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.clear-button {
  padding: 6px 12px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.clear-button:hover:not(:disabled) {
  background-color: #e62e2e;
}

.clear-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: #ffffff;
  border-radius: 8px;
  width: 280px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 20px 10px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333333;
  text-align: center;
}

.modal-body {
  padding: 20px;
  text-align: center;
}

.modal-body p {
  margin: 0;
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  padding: 10px 20px 20px;
  gap: 10px;
}

.modal-button {
  flex: 1;
  padding: 10px 0;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.modal-button.cancel {
  background-color: #f5f5f5;
  color: #666666;
}

.modal-button.cancel:hover {
  background-color: #e0e0e0;
}

.modal-button.confirm {
  background-color: #ff3b30;
  color: #ffffff;
}

.modal-button.confirm:hover {
  background-color: #e62e2e;
}

.category-item {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid transparent;
}

.category-item.active {
  color: #FF0000;
  font-weight: bold;
  border-bottom-color: #FF0000;
}

.category-item:hover {
  background-color: #f8f8f8;
}

/* 通知列表区域 - 固定高度，可滚动 */
.notification-section {
  flex: 1;
  overflow-y: auto;
  background-color: #f8f8f8;
  padding: 12px 16px 28px; /* 增加底部padding来弥补分页器取消padding后的空间 */
  -ms-overflow-style: none;
  scrollbar-width: thin;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 32px 16px;
  color: #999999;
  font-size: 14px;
}

/* 空状态 */
.empty-result {
  text-align: center;
  padding: 32px 16px;
  color: #999999;
  font-size: 14px;
}

/* 通知列表 */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 通知项 - 正方形块 */
.notification-item {
  position: relative;
  width: 100%;
  height: 100px; /* 正方形高度 */
  background-color: #ffffff;
  border-radius: 12px; /* 半圆角 */
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

/* 左上角时间 */
.notification-time {
  color: #999999; /* 灰色时间 */
  font-size: 12px;
  margin-bottom: 8px;
}

/* 中间通知文本 - 长条半圆 */
.notification-content {
  flex: 1;
  color: #333333;
  font-size: 14px;
  line-height: 1.4;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 20px; /* 半圆角 */
}

/* 系统通知样式 - 文本居中展示 */
.notification-content.system-notification {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 40px;
}

/* 用户通知样式 - 两行布局 */
.notification-content.user-notification {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 40px;
}

/* 用户通知第一行 - 用户名蓝色 */
.user-notification-line1 {
  font-size: 14px;
  line-height: 1.2;
  margin-bottom: 2px;
}

/* 用户标签黑色样式 */
.user-label {
  color: #000000; /* 黑色字体 */
}

/* 用户名蓝色样式 */
.username {
  color: #007bff; /* 蓝色字体 */
  font-weight: bold;
}

/* 用户通知第二行 */
.user-notification-line2 {
  font-size: 14px;
  color: #666666;
  line-height: 1.4;
}

/* 分页器区域 - 固定在底部 */
.pagination-section {
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding: 0; /* 取消上下padding */
}

/* 适配iPhone刘海屏 */
.notification-page {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>