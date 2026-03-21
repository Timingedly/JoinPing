<template>
  <div class="my-favorites-container">
    <!-- 页面头部 - 固定在顶部 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <span class="back-arrow">&lt;</span>
      </div>
      <div class="title">我的收藏</div>
      <div class="action-button">
        <!-- 占位保持布局 -->
      </div>
    </div>

    <!-- 话题列表区域 -->
    <div class="content">
      <!-- 话题列表 -->
      <div class="topic-list">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-icon">⏳</div>
          <p class="loading-text">加载中...</p>
        </div>
        
        <!-- 话题列表内容 -->
        <div v-else>
          <div 
            v-for="topic in topicList" 
            :key="topic.id" 
            class="topic-item-wrapper"
          >
            <!-- 话题内容 -->
            <TopicItem 
              :topic="topic" 
              @click="goToTopicDetail(topic.id)"
            />
          </div>

          <!-- 空状态 -->
          <div v-if="topicList.length === 0" class="empty-state">
            <div class="empty-icon">📚</div>
            <p class="empty-text">暂无收藏的话题</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页器 - 固定在底部 -->
    <div class="pagination-section" v-if="topicList.length > 0">
      <Pagination 
        :current-page="Number(pagination.current)"
        :total-pages="Number(pagination.pages)"
        :page-size="Number(pagination.size)"
        :total-items="Number(pagination.total)"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script>
import Pagination from '@/components/Pagination.vue'
import TopicItem from '@/components/TopicItem.vue'
import { topicApi } from '@/api/index'

export default {
  name: 'MyFavorites',
  components: {
    Pagination,
    TopicItem
  },
  data() {
    return {
      // 话题列表数据
      topicList: [],
      
      // 加载状态
      loading: false,
      
      // 分页参数
      pagination: {
        current: 1,
        size: 10,
        total: 0,
        pages: 0
      }
      // 删除管理模式相关数据
    }
  },
  // 删除管理模式相关的计算属性
  mounted() {
    // 页面加载时获取收藏列表
    this.fetchMyFavorites()
  },
  methods: {
    // 获取我的收藏列表
    async fetchMyFavorites() {
      try {
        // 显示加载状态
        this.loading = true
        
        // 调用收藏列表API
        const response = await topicApi.getMyFavorites(
          this.pagination.current,
          this.pagination.size
        )
        
        console.log('收藏列表API响应:', response)
        
        if (response && response.hasSuccessed) {
          const data = response.data
          
          // 处理话题列表数据
          this.topicList = data.list.map(topic => ({
            id: topic.id,
            title: topic.name, // 后端返回name字段，映射为title
            description: topic.content, // 后端返回的是content字段，与我的话题页面保持一致
            imageUrl: topic.photoUrl, // 后端返回的是photoUrl字段，与我的话题页面保持一致
            createTime: topic.createTime,
            updateTime: topic.updateTime,
            // 收藏页面不需要显示收藏状态，因为都是已收藏的
            isCollected: true
          }))
          
          // 更新分页信息
          // 修复bug：前端应该保持自己的current状态，不依赖后端返回的current字段
          // 因为后端可能返回错误的current值（如11），导致分页异常
          console.log('API返回的current字段:', data.current, '前端保持的current:', this.pagination.current);
          this.pagination = {
            current: this.pagination.current, // 保持前端当前页码，不更新为后端返回的current
            size: data.size || 10,
            total: data.total || 0,
            pages: data.pages || 0
          }
        } else {
          this.$toast('获取收藏列表失败')
        }
      } catch (error) {
        console.error('获取收藏列表失败:', error)
        this.$toast('网络错误，请重试')
      } finally {
        this.loading = false
      }
    },
    
    // 分页变化处理
    handlePageChange(page) {
      this.pagination.current = page
      this.fetchMyFavorites()
    },
    
    // 每页数量变化处理
    handlePageSizeChange(size) {
      this.pagination.size = size
      this.pagination.current = 1 // 重置到第一页
      this.fetchMyFavorites()
    },
    
    // 返回上一页
    goBack() {
      this.$router.go(-1)
    },
    
    // 跳转到话题详情
    goToTopicDetail(topicId) {
      // 删除管理模式判断
      this.$router.push(`/topic/${topicId}`)
    }
    // 删除所有管理模式相关的方法
  }
}
</script>

<style scoped>
/* 我的收藏页面样式 - 采用flex布局确保固定头部和底部 */
.my-favorites-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  /* 适配iPhone刘海屏 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 头部样式 - 固定在顶部 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 15px;
  flex-shrink: 0; /* 防止头部被压缩 */
  z-index: 100;
}

.back-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-arrow {
  font-size: 28px;
  color: #000000;
  font-weight: bold;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
}

.action-button {
  width: 40px;
  text-align: center;
}

/* 话题列表区域 - 内嵌滑动框样式，参考主体页实现 */
.content {
  flex: 1; /* 使用flex布局填充剩余空间，替代固定高度 */
  overflow-y: auto; /* 垂直滚动 */
  padding: 8px 0;
  /* 添加边框和背景色，形成明确的内嵌区块 */
  border: 2px solid #f0f0f0; /* 添加粗边框，与主体页保持一致 */
  border-radius: 8px; /* 圆角边框 */
  background-color: #ffffff; /* 白色背景 */
  margin: 12px 16px; /* 添加外边距，与页面边缘保持距离 */
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* Webkit浏览器滚动条样式 */
.content::-webkit-scrollbar {
  width: 6px;
}

.content::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 删除管理模式面板样式 */

/* 话题列表 */
.topic-list {
  width: 100%;
  padding: 0 16px; /* 添加内边距，确保内容不贴边，与浏览历史页保持一致 */
  margin-bottom: 20px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.loading-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  margin: 0;
}

.topic-item-wrapper {
  position: relative;
  margin-top: 20px !important; /* 大幅增加话题块之间的间距 */
  margin-bottom: 16px !important; /* 大幅增加底部间距 */
}

/* 删除选择框样式 */

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  margin: 0;
}

/* 删除删除确认弹窗样式 */

/* 响应式设计 */
@media (max-width: 375px) {
  .content {
    padding: 12px;
  }
}

/* 分页器区域 - 固定在底部 */
.pagination-section {
  flex-shrink: 0; /* 防止分页器被压缩 */
  padding: 16px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
}

/* 滚动条美化 */
.topic-list::-webkit-scrollbar {
  width: 4px;
}

.topic-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.topic-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 2px;
}

.topic-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>