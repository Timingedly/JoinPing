<template>
  <div class="home-page">
    <!-- 顶部固定区域 - 红色背景 -->
    <div class="header-section">
      <div class="top-title">首页</div>
    </div>
    
    <!-- 通知块区域 -->
    <div class="notification-block-section">
      <NotificationBlock ref="notificationBlock" />
    </div>
    
    <!-- 搜索区域 -->
    <div class="search-section">
      <SearchBox />
    </div>
    
    <!-- 首页简单分类选择区域 - 两个块布局 -->
    <div class="home-category-section">
      <div class="category-buttons">
        <button 
          class="category-btn" 
          :class="{ active: currentRankKey === 'weekMostLike' }"
          @click="selectCategory('weekMostLike')"
        >
          近期最热
        </button>
        <button 
          class="category-btn" 
          :class="{ active: currentRankKey === 'weekMostFavorite' }"
          @click="selectCategory('weekMostFavorite')"
        >
          近期最受期待
        </button>
      </div>
    </div>
    
    <!-- 话题列表区域 - 上下滑动框 -->
    <div class="topic-section">
      <TopicList ref="topicList" :rankKey="currentRankKey" />
    </div>
    
    <!-- 底部导航栏 -->
    <TabBar />
  </div>
</template>

<script>
// Home.vue - 首页组件
// 功能：整合所有首页相关组件，提供完整的首页功能
// 设计要点：
// 1. 整合顶部通知栏、搜索框、分类滑动选择、话题列表和底部导航栏
// 2. 处理组件间的交互，如分类选择后更新话题列表
// 3. 确保页面布局正确，各组件之间协调工作

import NotificationBlock from '@/components/NotificationBlock.vue'
import SearchBox from '@/components/SearchBox.vue'
import TopicList from '@/components/TopicList.vue'
import TabBar from '@/components/TabBar.vue'

export default {
  name: 'Home',
  components: {
    NotificationBlock,
    SearchBox,
    TopicList,
    TabBar
  },
  data() {
    return {
      currentRankKey: 'weekMostLike' // 当前选中的分类key，默认为"近期最热"
    }
  },
  created() {
    // 页面加载时执行的初始化操作
  },
  activated() {
    // 页面激活时的操作（使用keep-alive时）
    // 当从其他页面返回到首页时，刷新通知状态
    // 通过$refs访问子组件的方法，刷新通知状态
    if (this.$refs.notificationBlock) {
      this.$refs.notificationBlock.fetchNotification()
    }
  },
  methods: {
    // 获取首页数据
    // API: GET /home/index
    // 功能：获取首页所需的所有数据，包括通知、分类、话题列表等
    fetchHomeData() {
      // 暂时注释掉API调用，避免可能的错误
      // homeApi.getHomeData()
      //   .then(response => {
      //     // 处理成功响应
      //     if (response.data && response.data.success) {
      //       const data = response.data.data
      //       // 更新通知数据
      //       if (data.notification) {
      //         this.notificationText = data.notification.text
      //         this.hasNotification = data.notification.hasNew
      //       }
      //       // 更新分类数据
      //       if (data.categories) {
      //         this.categories = data.categories
      //       }
      //       // 更新话题列表数据
      //       if (data.topics) {
      //         this.topics = data.topics.list
      //         this.totalPages = data.topics.pages
      //       }
      //     } else {
      //       // 使用默认数据
      //       this.setDefaultData()
      //     }
      //   })
      //   .catch(error => {
      //     console.error('获取首页数据失败:', error)
      //     // 发生错误时使用默认数据
      //     this.setDefaultData()
      //   })
      
      // 直接使用默认数据
      this.setDefaultData()
    },
    // 选择分类
    selectCategory(rankKey) {
      this.currentRankKey = rankKey
      // 通知话题列表组件更新数据
      if (this.$refs.topicList) {
        this.$refs.topicList.fetchTopics(rankKey)
      }
    }
  }
}
</script>

<style scoped>
.home-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff; /* 页面背景是白色 */
  overflow: hidden;
  color: #000000; /* 字体是黑色 */
}

/* 顶部固定区域 - 红色背景 */
.header-section {
  flex-shrink: 0;
  background-color: #FF0000; /* 首页顶部背景是红色的 */
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

/* 顶部标题 */
.top-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
}

/* 通知块区域 */
.notification-block-section {
  flex-shrink: 0;
  background-color: transparent; /* 移除灰色背景，与主体页面保持一致 */
  margin-top: 50px; /* 顶部导航栏的高度 */
  padding: 0; /* 移除额外的内边距 */
}

/* 搜索区域 */
.search-section {
  flex-shrink: 0;
}

/* 首页分类选择区域 - 两个块布局 */
.home-category-section {
  flex-shrink: 0;
  background-color: #ffffff;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.category-buttons {
  display: flex;
  gap: 12px;
}

.category-btn {
  flex: 1;
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #333333;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-btn.active {
  background-color: #FF0000;
  color: #ffffff;
  border-color: #FF0000;
}

.category-btn:hover {
  background-color: #f5f5f5;
}

.category-btn.active:hover {
  background-color: #e60000;
}

/* 话题列表区域 - 上下滑动框 */
.topic-section {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding-bottom: 60px; /* 为底部导航栏留出空间 */
}

/* 适配iPhone刘海屏 */
.home-page {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>