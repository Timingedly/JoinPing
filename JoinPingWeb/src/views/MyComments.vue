<template>
  <div class="my-comments-page">
    <!-- 顶部固定区域 - 红色背景 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <span class="back-icon">&lt;</span>
      </div>
      <div class="title">我的评论</div>
    </div>
    
    <!-- 评论分类选择区域 -->
    <div class="category-section">
      <div 
        class="category-item" 
        :class="{ active: activeCategory === 't1' }"
        @click="switchCategory('t1')"
      >
        我的主体评论
      </div>
      <div 
        class="category-item" 
        :class="{ active: activeCategory === 't2' }"
        @click="switchCategory('t2')"
      >
        我的回复评论
      </div>
    </div>
    
    <!-- 管理按钮区域 - 参考通知页的清空按钮样式 -->
    <div class="manage-section">
      <button 
        class="manage-button"
        @click="toggleManageMode"
        :disabled="comments.length === 0"
      >
        {{ isManageMode ? '完成' : '管理' }}
      </button>
    </div>
    
    <!-- 评论列表区域 - 固定高度，可滚动 -->
    <div class="comments-section">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="comments.length === 0" class="empty-result">
        暂无评论
      </div>
      <div v-else class="comments-list">
        <div 
          v-for="(comment, index) in comments" 
          :key="comment.id"
          class="comment-item"
          @click="handleCommentClick(comment)"
        >
          <!-- 删除按钮 - 右上角红色叉叉，参考修改话题页样式 -->
          <div 
            v-if="isManageMode" 
            class="delete-button" 
            @click.stop="showDeleteConfirmDialog(comment)"
          >
            ×
          </div>
          
          <!-- 左上角时间 -->
          <div class="comment-time">
            {{ formatFullTime(comment.createTime) }}
          </div>
          <!-- 中间评论文本 -->
          <div class="comment-content">
            <!-- 第一行：主体名称或回复前缀 -->
            <div class="comment-prefix-line">
              <!-- 主体评论：评论主体 x ： -->
              <div v-if="activeCategory === 't1'" class="thing-name-line">
                <span class="thing-label">评论主体</span> <span class="thing-name-blue">{{ comment.thingName || comment.thingTitle || `主体${comment.id}` }}</span><span class="thing-colon"> ：</span>
              </div>
              <!-- 回复评论：回复 x ： -->
              <div v-else-if="activeCategory === 't2'" class="reply-name-line">
                <span class="reply-label">回复</span> <span class="reply-user-name-blue">{{ comment.replyUserName || '用户' }}</span><span class="reply-colon"> ：</span>
              </div>
            </div>
            <!-- 第二行开始：评论内容 -->
            <div class="comment-text">
              {{ truncateContent(comment.content) }}
            </div>
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
    
    <!-- 删除确认弹窗 - 统一页内弹窗风格 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="hideDeleteConfirmDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">确认删除</div>
        <div class="delete-confirm-text">确认删除评论吗？</div>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="hideDeleteConfirmDialog">取消</button>
          <button class="confirm-delete-button" @click="confirmDeleteComment">确定</button>
        </div>
      </div>
    </div>
    
    <!-- 操作结果提示弹窗 -->
    <div v-if="showResultDialog" class="dialog-overlay" @click="hideResultDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title" :class="{ 'success-title': isSuccess, 'error-title': !isSuccess }">
          {{ isSuccess ? '操作成功' : '操作失败' }}
        </div>
        <div class="result-message">{{ resultMessage }}</div>
        <div class="dialog-buttons">
          <button class="confirm-button-single" @click="hideResultDialog">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// MyComments.vue - 我的评论页面组件
// 功能：显示我的评论列表，支持分页浏览
// 设计要点：
// 1. 顶部标题"我的评论"，带返回按钮
// 2. 评论分类选择：我的主体评论和我的回复评论
// 3. 评论列表在固定区域内滚动
// 4. 每个评论项显示时间和内容
// 5. 固定分页器在底部
// 6. 模仿通知页面的布局和样式

import Pagination from '@/components/Pagination.vue'
import { subjectApi, userTopicViewHistoryApi } from '@/api/index.js'

export default {
  name: 'MyComments',
  components: {
    Pagination
  },
  data() {
    return {
      comments: [], // 评论列表
      loading: false, // 加载状态
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页显示数量
      totalCount: 0, // 总记录数
      totalPages: 0, // 总页数
      activeCategory: 't1', // 当前激活的分类：t1-我的主体评论，t2-我的回复评论
      isManageMode: false, // 管理模式状态
      showDeleteDialog: false, // 是否显示删除确认弹窗
      commentToDelete: null, // 待删除的评论
      showResultDialog: false, // 是否显示结果提示弹窗
      isSuccess: false, // 操作是否成功
      resultMessage: '' // 结果消息
    }
  },
  created() {
    // 组件创建时获取评论列表
    this.fetchComments()
  },
  methods: {
    // 返回上一页
    goBack() {
      this.$router.back()
    },
    
    // 切换评论分类
    switchCategory(category) {
      if (this.activeCategory === category) return
      
      this.activeCategory = category
      this.currentPage = 1 // 切换分类时重置到第一页
      this.isManageMode = false // 切换分类时自动关闭管理模式
      this.fetchComments()
    },
    
    // 切换管理模式
    toggleManageMode() {
      this.isManageMode = !this.isManageMode
    },
    
    // 显示删除确认弹窗
    showDeleteConfirmDialog(comment) {
      this.commentToDelete = comment
      this.showDeleteDialog = true
    },
    
    // 隐藏删除确认弹窗
    hideDeleteConfirmDialog() {
      this.showDeleteDialog = false
      this.commentToDelete = null
    },
    
    // 显示结果提示弹窗
    showResultDialogFunc(success, message) {
      this.isSuccess = success
      this.resultMessage = message
      this.showResultDialog = true
    },
    
    // 隐藏结果提示弹窗
    hideResultDialog() {
      this.showResultDialog = false
      this.isSuccess = false
      this.resultMessage = ''
    },
    
    // 确认删除评论
    async confirmDeleteComment() {
      if (!this.commentToDelete) return
      
      try {
        // 根据当前分类选择不同的删除接口
        let apiCall
        if (this.activeCategory === 't1') {
          // 删除一级评论，对接后端T1CommentController的delete方法
          // API: DELETE /t1comment/{id}
          apiCall = subjectApi.deleteT1Comment(this.commentToDelete.id)
        } else {
          // 删除二级评论，对接后端T2CommentController的delete方法
          // API: DELETE /t2comment/{id}
          apiCall = subjectApi.deleteT2Comment(this.commentToDelete.id)
        }
        
        // 调用后端删除接口
        const response = await apiCall
        
        if (response.hasSuccessed) {
          // 删除成功，从列表中移除
          this.comments = this.comments.filter(comment => comment.id !== this.commentToDelete.id)
          this.totalCount = Math.max(0, this.totalCount - 1)
          
          // 如果删除后列表为空，退出管理模式
          if (this.comments.length === 0) {
            this.isManageMode = false
          }
          
          // 关闭弹窗
          this.hideDeleteConfirmDialog()
          
          // 显示成功提示（使用页内弹窗）
          this.showResultDialogFunc(true, '评论删除成功')
        } else {
          // 删除失败，显示错误信息（使用页内弹窗）
          this.showResultDialogFunc(false, '删除失败：' + response.message)
        }
        
      } catch (error) {
        console.error('删除评论失败:', error)
        this.showResultDialogFunc(false, '网络错误，请重试')
      }
    },
    
    // 显示成功消息
    showSuccessMessage(message) {
      // 这里可以添加成功提示的实现
      // 暂时使用alert代替
      alert(message)
    },
    
    // 获取评论列表
    // API: 根据分类调用不同的后端接口
    // - 我的主体评论：GET /t1comment/my (T1CommentController的selectT1CommentPage方法)
    // - 我的回复评论：GET /t2comment/my (T2CommentController的selectT2CommentPage方法)
    async fetchComments() {
      this.loading = true
      try {
        // 根据当前分类选择不同的API
        let apiCall
        if (this.activeCategory === 't1') {
          // 获取我的一级评论分页列表
          // 对接后端T1CommentController的selectT1CommentPage方法
          apiCall = subjectApi.getMyT1Comments(this.currentPage, this.pageSize)
        } else {
          // 获取我的二级评论分页列表
          // 对接后端T2CommentController的selectT2CommentPage方法
          apiCall = subjectApi.getMyT2Comments(this.currentPage, this.pageSize)
        }
        
        // 调用后端API
        const response = await apiCall
        
        // 处理API返回数据
        if (response.code === 200 && response.hasSuccessed) {
          // 更新评论列表和分页信息
          // 确保数据类型正确，转换为Number类型避免Vue警告
          this.comments = response.data.list || []
          this.totalCount = Number(response.data.total) || 0
          this.currentPage = Number(response.data.current) || 1
          this.pageSize = Number(response.data.size) || 10
          this.totalPages = Number(response.data.pages) || 0
        } else {
          // API调用失败，使用模拟数据
          console.warn('API调用失败，使用模拟数据')
          const mockData = this.generateMockComments()
          this.comments = mockData.comments
          this.totalCount = Number(mockData.totalCount) || 0
          this.totalPages = Math.ceil(this.totalCount / this.pageSize)
        }
      } catch (error) {
        console.error('获取评论列表失败:', error)
        // 发生错误时使用模拟数据
        const mockData = this.generateMockComments()
        this.comments = mockData.comments
        this.totalCount = Number(mockData.totalCount) || 0
        this.totalPages = Math.ceil(this.totalCount / this.pageSize)
      } finally {
        this.loading = false
      }
    },
    
    // 生成模拟评论数据
    // 功能：在API不可用时提供模拟数据用于开发和测试
    generateMockComments() {
      const mockComments = []
      const totalCount = 15
      
      for (let i = 1; i <= totalCount; i++) {
        const comment = {
          id: i,
          content: `这是第${i}条评论的内容，这是一段比较长的评论内容，用于测试截断显示功能。评论内容可能会很长，需要做截断处理。`,
          createTime: new Date(Date.now() - i * 3600000).toISOString(),
          // 根据分类添加不同的字段
          ...(this.activeCategory === 't1' ? {
            thingId: 1000 + i,
            thingName: `主体${i}`
          } : {
            t1commentId: 2000 + i,
            replyUserName: `用户${i}`
          })
        }
        mockComments.push(comment)
      }
      
      return {
        comments: mockComments,
        totalCount: totalCount
      }
    },
    
    // 处理页码变化
    handlePageChange(page) {
      console.log('页码变化，新页码:', page)
      this.currentPage = page
      this.fetchComments()
    },
    
    // 处理每页显示条数变化
    handlePageSizeChange(pageSize, page) {
      console.log('每页条数变化，新条数:', pageSize, '新页码:', page)
      this.pageSize = pageSize
      this.currentPage = page
      this.fetchComments()
    },
    
    // 格式化完整时间
    // 功能：将ISO时间格式转换为具体时间格式"2025-11-07 15:31:20"
    formatFullTime(isoTime) {
      if (!isoTime) return ''
      
      const date = new Date(isoTime)
      
      // 提取年月日时分秒
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      const seconds = String(date.getSeconds()).padStart(2, '0')
      
      // 返回格式："2025-11-07 15:31:20"
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    },
    
    // 截断评论内容
    // 功能：对过长的评论内容进行截断处理，超出字数显示省略号
    truncateContent(content) {
      if (!content) return ''
      
      const maxLength = 50 // 最大显示字数
      if (content.length <= maxLength) {
        return content
      }
      
      return content.substring(0, maxLength) + '...'
    },
    
    // 处理评论点击事件
    // 功能：点击评论项时的处理逻辑
    // 步骤：1.发请求给getThingPageInfo 2.拿着步骤1的响应数据进行页面跳转
    async handleCommentClick(comment) {
      console.log('评论点击:', comment)
      
      // 根据评论类型处理不同的跳转逻辑
      if (this.activeCategory === 't1') {
        // 一级评论：先请求T1CommentController的getThingPageInfo方法
        try {
          console.log('发起getThingPageInfo请求，评论ID:', comment.id)
          const response = await subjectApi.getThingPageInfo(comment.id)
          
          // 处理API返回数据
          if (response.code === 200 && response.hasSuccessed) {
            const pageInfo = response.data
            console.log('获取到主体分页信息:', pageInfo)
            
            // 第一个请求成功，发送独立的请求给UserTopicViewHistoryController的insertOrUpdateByThingId方法
            // 参数取值于第一个请求的响应的thingId
            const thingId = pageInfo.thingId || comment.thingId
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
            
            // 步骤2：根据响应数据进行页面跳转
            // 携带thingId、pageNum、pageSize参数跳转到主体详情页
            // 注意：index参数需要传递给主体详情页，主体详情页内部会调用locateCommentByIndex方法进行真正的DOM滚动定位
            this.$router.push({
              path: `/subject/${pageInfo.thingId || comment.thingId}`,
              query: {
                pageNum: pageInfo.pageNum || 1,
                pageSize: pageInfo.pageSize || 10,
                index: pageInfo.index || 1 // 用于滚动定位的索引（从1开始）
              }
            })
          } else {
            // API调用失败，使用默认跳转方式
            console.warn('getThingPageInfo API调用失败，使用默认跳转')
            this.$router.push({
              path: `/subject/${comment.thingId}`
            })
          }
        } catch (error) {
          console.error('获取主体分页信息失败:', error)
          // 发生错误时使用默认跳转方式
          this.$router.push({
            path: `/subject/${comment.thingId}`
          })
        }
      } else {
        // 二级评论：与通知页用户通知点击功能完全一致
        // 步骤：1.发请求给getT1CommentPageInfo 2.拿着步骤1的响应数据进行页面跳转
        try {
          console.log('发起getT1CommentPageInfo请求，评论ID:', comment.id)
          
          // 显示加载提示
          this.$toast && this.$toast('加载中...')
          
          // 调用后端API获取评论详情
          // API: GET /t2comment/index/{id} - 根据二级评论ID获取一级评论详情
          const response = await subjectApi.getT1CommentPageInfo(comment.id)
          
          // 处理API响应
          if (response.code === 200 && response.hasSuccessed) {
            console.log('评论详情获取成功:', response.data)
            
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
          } else {
            console.error('获取评论详情失败:', response)
            // 第一个请求失败，显示错误弹窗而不跳转页面
            this.showErrorDialog('评论不存在或已被删除')
          }
        } catch (error) {
          console.error('处理二级评论点击失败:', error)
          // 网络错误或其他异常，显示错误弹窗而不跳转页面
          this.showErrorDialog('评论不存在或已被删除')
        }
      }
    },
    
    // 跳转到评论详情页面
    // 功能：根据评论ID和详情数据跳转到评论详情页面
    // 与通知页的navigateToCommentDetail方法完全一致
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
    },
    
    // 显示错误弹窗
    // 功能：显示错误消息弹窗
    showErrorDialog(message) {
      // 这里可以添加错误弹窗的实现
      // 暂时使用alert代替
      alert(message)
    }
  }
}
</script>

<style scoped>
.my-comments-page {
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
  background-color: #ff3b30;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
  /* 适配iPhone刘海屏顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.back-button {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-icon {
  color: #ffffff;
  font-size: 20px;
  font-weight: bold;
}

.title {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
}

/* 评论分类选择区域 */
.category-section {
  display: flex;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
}

/* 管理按钮区域样式 - 参考通知页的清空按钮样式 */
.manage-section {
  display: flex;
  justify-content: flex-end;
  padding: 10px 15px;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
}

.manage-button {
  padding: 6px 12px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.manage-button:hover:not(:disabled) {
  background-color: #e62e2e;
}

.manage-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.category-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666666;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.category-item.active {
  color: #ff3b30;
  font-weight: bold;
}

.category-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 3px;
  background-color: #ff3b30;
  border-radius: 1.5px;
}

/* 评论列表区域 - 固定高度，可滚动 */
.comments-section {
  flex: 1;
  overflow-y: auto;
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

/* 评论列表 */
.comments-list {
  display: flex;
  flex-direction: column;
  gap: 20px; /* 增加评论块之间的间隔 */
}

/* 评论项 - 正方形块 */
.comment-item {
  position: relative;
  width: 100%;
  height: 100px; /* 正方形高度 */
  background-color: #ffffff;
  border-radius: 12px; /* 半圆角 */
  padding: 12px;
  border: 1px solid #e0e0e0; /* 添加边框 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 增强阴影效果 */
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 删除按钮 - 右上角红色叉叉，参考修改话题页样式 */
.delete-button {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 59, 48, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s ease;
}

.delete-button:hover {
  background-color: rgba(255, 59, 48, 1);
}

.comment-item:hover {
  border-color: #c0c0c0; /* 悬停时边框变深 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

/* 左上角时间 */
.comment-time {
  color: #999999; /* 灰色时间 */
  font-size: 12px;
  margin-bottom: 8px;
}

/* 中间评论文本 - 长条半圆 */
.comment-content {
  flex: 1;
  color: #333333;
  font-size: 14px;
  line-height: 1.4;
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 20px; /* 半圆角 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: left;
  min-height: 40px;
}

/* 主体名称行 */
.thing-name-line {
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.2;
}

/* 评论主体标签黑色字体 */
.thing-label {
  color: #000000; /* 黑色字体 */
}

/* 主体名称蓝色字体 */
.thing-name-blue {
  color: #007AFF; /* 蓝色字体 */
  font-weight: 500;
}

/* 冒号黑色字体 */
.thing-colon {
  color: #000000; /* 黑色字体 */
}

/* 回复名称行 */
.reply-name-line {
  font-size: 14px;
  margin-bottom: 4px;
  line-height: 1.2;
}

/* 回复标签黑色字体 */
.reply-label {
  color: #000000; /* 黑色字体 */
}

/* 回复用户名蓝色字体 */
.reply-user-name-blue {
  color: #007AFF; /* 蓝色字体 */
  font-weight: 500;
}

/* 回复冒号黑色字体 */
.reply-colon {
  color: #000000; /* 黑色字体 */
}

/* 删除确认弹窗样式 - 统一页内弹窗风格 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 300px;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
}

.delete-confirm-text {
  font-size: 14px;
  color: #333333;
  line-height: 1.5;
  margin-bottom: 20px;
  text-align: center;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
}

.cancel-button {
  flex: 1;
  height: 40px;
  border: 1px solid #dddddd;
  background-color: #ffffff;
  color: #333333;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.confirm-delete-button {
  flex: 1;
  height: 40px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

/* 操作结果提示弹窗样式 */
.success-title {
  color: #34c759 !important; /* 成功标题绿色 */
}

.error-title {
  color: #ff3b30 !important; /* 错误标题红色 */
}

.result-message {
  font-size: 14px;
  color: #333333;
  line-height: 1.5;
  margin-bottom: 20px;
  text-align: center;
}

.confirm-button-single {
  width: 50%;
  height: 40px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  margin: 0 auto;
  display: block;
}

/* 评论文本 - 限制4行，超出部分用省略号截断 */
.comment-text {
  font-size: 14px;
  line-height: 1.4;
  color: #333333;
  /* 限制显示4行，超出部分用省略号 */
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 确保文本适应块大小 */
  word-break: break-word;
  white-space: normal;
  /* 兼容现代浏览器 */
  line-clamp: 4;
  /* 防止最后一行出现不完整字符 */
  -webkit-hyphens: none;
  hyphens: none;
}

/* 分页器区域 */
.pagination-section {
  flex-shrink: 0;
  background-color: #ffffff;
  border-top: 1px solid #e5e5e5;
  padding: 8px 16px;
}

/* 滚动条样式 */
.comments-section::-webkit-scrollbar {
  width: 4px;
}

.comments-section::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 2px;
}

.comments-section::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.comments-section::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>