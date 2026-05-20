<template>
  <div class="search-page">
    <!-- 顶部固定区域 - 红色背景 -->
    <div class="header-section">
      <div class="back-button" @click="goBack">
        <span class="back-icon">‹</span>
      </div>
      <div class="top-title">搜索结果</div>
    </div>
    
    <!-- 搜索框区域 -->
    <div class="search-box-section">
      <SearchBox 
        :isInSearchPage="true" 
        @search="handleSearchFromBox"
      />
    </div>
    
    <!-- 搜索结果统计和排序选项 -->
    <div class="search-info">
      <div class="result-count">
      共查询到相关话题 <span class="count-number">{{ formattedTotalCount }}</span> 个
    </div>
      <div class="sort-options">
        <div 
          class="sort-button" 
          :class="{ active: sortOrder === 'default' }"
          @click="changeSortOrder('default')"
        >
          默认
        </div>
        <div 
          class="sort-button" 
          :class="{ active: sortOrder === 'latest' }"
          @click="changeSortOrder('latest')"
        >
          最新
        </div>
      </div>
    </div>
    
    <!-- 话题列表区域 - 内嵌结构，参考分类页设计 -->
    <div class="topic-section">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        加载中...
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="!loading && topics.length === 0" class="empty">
        未找到相关话题
      </div>
      
      <!-- 话题列表 -->
      <div v-else class="topic-list">
        <div 
          v-for="(topic, index) in topics" 
          :key="topic.id" 
          class="topic-item-wrapper"
        >
          <TopicItem
            :topic="topic"
            :index="index"
            @click="handleTopicClick"
          />
        </div>
      </div>
    </div>
    
    <!-- 分页器 -->
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
// SearchView.vue - 搜索结果页面组件
// 功能：显示搜索结果，支持排序和分页
// 设计要点：
// 1. 上部分显示搜索结果统计和排序选项
// 2. 下部分显示分页查询的话题列表
// 3. 支持默认排序和最新排序
// 4. 支持分页浏览搜索结果

import TopicItem from '@/components/TopicItem.vue'
import Pagination from '@/components/Pagination.vue'
import SearchBox from '@/components/SearchBox.vue'
import { homeApi } from '../api/index.js'

export default {
  name: 'SearchView',
  components: {
    TopicItem,
    Pagination,
    SearchBox
  },
  data() {
    return {
      searchKeyword: '', // 搜索关键词
      topics: [], // 搜索结果列表
      loading: false, // 加载状态
      currentPage: 1, // 当前页码
      pageSize: 10, // 每页显示数量
      totalCount: 0, // 总结果数
      totalPages: 0, // 总页数
      sortOrder: 'default' // 排序方式：default-默认（正序），latest-最新（倒序）
    }
  },
  computed: {
    // 格式化话题数量显示
    // 如果查询结果>=10000，就除以10000，保留一位小数（不四舍五入）加个w
    // 小于10000个话题都正常显示数字
    formattedTotalCount() {
      if (this.totalCount >= 10000) {
        // 除以10000，保留一位小数（不四舍五入）
        const countInW = this.totalCount / 10000;
        // 取整数部分和小数部分
        const integerPart = Math.floor(countInW);
        const decimalPart = Math.floor((countInW - integerPart) * 10);
        
        // 如果小数部分为0，则只显示整数部分加w
        if (decimalPart === 0) {
          return `${integerPart}w`;
        } else {
          return `${integerPart}.${decimalPart}w`;
        }
      } else {
        // 小于10000，直接显示数字
        return this.totalCount.toString();
      }
    }
  },
  created() {
    // 初始化时获取搜索关键词并重置状态
    this.initializeSearch()
  },
  
  // 监听路由变化，确保每次进入搜索结果页都重置状态
  watch: {
    '$route.query.keyword': {
      handler(newKeyword) {
        if (newKeyword) {
          this.initializeSearch()
        }
      },
      immediate: true
    }
  },
  methods: {
    // 初始化搜索状态
    initializeSearch() {
      // 重置所有搜索状态
      this.searchKeyword = this.$route.query.keyword || ''
      this.currentPage = 1 // 重置到第一页
      this.sortOrder = 'default' // 重置为默认排序
      
      // 如果有搜索关键词，则获取搜索结果
      if (this.searchKeyword) {
        this.fetchSearchResults()
      }
    },
    
    // 返回上一页
    goBack() {
      this.$router.back()
    },
    
    // 获取搜索结果
    // API: GET /index/search
    // 功能：根据关键词搜索话题，支持分页和排序
    // 对接后端IndexController的search方法（GET方法，参数使用@RequestBody注解）
    async fetchSearchResults() {
      this.loading = true
      try {
        // 构建搜索参数，对应后端Search实体类
        // 首页搜索默认按默认排序（正序），搜索结果页顶部按钮默认也是默认排序
        const searchParams = {
          text: this.searchKeyword,
          pageNum: this.currentPage,
          pageSize: this.pageSize,
          orderByCreateTimeDesc: this.sortOrder === 'latest' // default-默认（正序），latest-最新（倒序）
        }
        
        // 调用后端搜索API
        const response = await homeApi.searchTopics(searchParams)
        
        // 处理成功响应
        if (response.hasSuccessed && response.data) {
          // 根据后端IndexServiceImpl实现，search方法返回PageResult<Topic>
          const searchResult = response.data
          
          // 更新数据
          this.topics = searchResult.list || []
          this.totalCount = Number(searchResult.total) || 0
          this.totalPages = Number(searchResult.pages) || 0
          this.currentPage = Number(searchResult.current) || 1
        } else {
          console.error('搜索失败，响应状态异常:', response)
          // API调用失败时使用模拟数据
          const mockData = this.generateMockData()
          this.topics = mockData.topics
          this.totalCount = Number(mockData.totalCount) || 0
          this.totalPages = Math.ceil(this.totalCount / this.pageSize)
        }
      } catch (error) {
        console.error('获取搜索结果失败:', error)
        // 发生错误时使用模拟数据
        const mockData = this.generateMockData()
        this.topics = mockData.topics
        this.totalCount = Number(mockData.totalCount) || 0
        this.totalPages = Math.ceil(this.totalCount / this.pageSize)
      } finally {
        this.loading = false
      }
    },
    
    // 生成模拟数据
    generateMockData() {
      // 模拟搜索结果数据结构
      const mockTopics = []
      const startIndex = (this.currentPage - 1) * this.pageSize
      
      // 根据搜索关键词生成模拟数据
      for (let i = 0; i < this.pageSize; i++) {
        const index = startIndex + i
        if (index >= 30) break // 最多生成30条模拟数据
        
        mockTopics.push({
          id: `search_${index}`,
          title: `${this.searchKeyword}相关话题${index + 1}`,
          description: `这是关于${this.searchKeyword}的详细描述。包含了很多相关信息和内容，可以帮助用户更好地了解这个话题。这里有丰富的内容等待您的探索和发现。`,
          imageUrl: `https://picsum.photos/seed/${this.searchKeyword}_${index}/200/150.jpg`,
          createTime: new Date(Date.now() - index * 86400000).toISOString(),
          subjectCount: Math.floor(Math.random() * 50) + 10,
          commentCount: Math.floor(Math.random() * 100) + 20,
          likeCount: Math.floor(Math.random() * 200) + 50
        })
      }
      
      return {
        topics: mockTopics,
        totalCount: 30 // 模拟总数据量
      }
    },
    
    // 切换排序方式
    changeSortOrder(order) {
      if (this.sortOrder === order) return
      
      this.sortOrder = order
      this.currentPage = 1 // 重置页码
      this.fetchSearchResults()
    },
    
    // 处理页码变化
    handlePageChange(page) {
      if (page < 1 || page > this.totalPages || page === this.currentPage) return
      
      this.currentPage = page
      this.fetchSearchResults()
    },
    
    // 处理每页显示条数变化
    handlePageSizeChange(pageSize, page) {
      this.pageSize = pageSize
      this.currentPage = page
      this.totalPages = Math.ceil(this.totalCount / this.pageSize)
      this.fetchSearchResults()
    },
    
    // 处理话题点击
    handleTopicClick(topic) {
      this.$router.push(`/topic/${topic.id}`)
    },
    
    // 处理搜索框的搜索事件
    handleSearchFromBox(keyword) {
      // 重置所有搜索状态
      this.searchKeyword = keyword
      this.currentPage = 1 // 重置到第一页
      this.sortOrder = 'default' // 重置为默认排序
      
      // 更新URL参数，确保浏览器地址栏同步
      this.$router.replace({
        path: '/search',
        query: { keyword: keyword }
      })
      
      // 重新获取搜索结果
      this.fetchSearchResults()
    }
  }
}
</script>

<style scoped>
.search-page {
  width: 100%;
  height: calc(100vh + 88px); /* 页面总高度 = 屏幕高度 + 搜索框总高度(64px内容 + 24pxpadding = 88px) */
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow-y: auto; /* 允许页面滚动 */
  color: #000000;
}

/* 顶部固定区域 - 红色背景 */
.header-section {
  flex-shrink: 0;
  background-color: #FF0000;
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
.top-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
}

/* 搜索框区域 */
.search-box-section {
  flex-shrink: 0;
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 16px;
  margin-top: 50px; /* 顶部导航栏高度 */
}

/* 搜索结果统计和排序选项 */
.search-info {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
}

/* 结果统计 */
.result-count {
  font-size: 16px;
  font-weight: bold;
  color: #000000;
}

/* 数字显示样式 */
.count-number {
  color: #FF0000;
  margin: 0 4px;
}

/* 排序选项 */
.sort-options {
  display: flex;
  gap: 8px;
}

/* 排序按钮 */
.sort-button {
  padding: 6px 12px;
  font-size: 14px;
  color: #666666;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 排序按钮激活状态 */
.sort-button.active {
  color: #FF0000;
  border-color: #FF0000;
  background-color: rgba(255, 0, 0, 0.1);
}

/* 排序按钮点击效果 */
.sort-button:active {
  background-color: #f0f0f0;
}

/* 话题列表区域 - 内嵌结构，参考分类页设计 */
.topic-section {
  height: calc(100vh - 50px - 48px - 80px - 50px); /* 精确计算：屏幕高度 - header(50px) - search-info(48px) - pagination(80px) - TabBar(50px) = 844px - 228px = 616px */
  overflow-y: auto; /* 允许内部滚动 */
  padding: 8px 0;
  /* 添加边框和背景色，形成明确的内嵌区块 */
  border: 2px solid #f0f0f0; /* 添加粗边框，与分类页保持一致 */
  border-radius: 8px; /* 圆角边框 */
  background-color: #ffffff; /* 白色背景 */
  margin: 12px 16px; /* 添加外边距，与页面边缘保持距离 */
}



/* 话题列表容器 */
.topic-list {
  width: 100%;
  padding: 0 16px; /* 添加内边距，确保内容不贴边 */
  margin-bottom: 20px;
}

/* 话题项包装器 - 增加话题块之间的间距 */
.topic-item-wrapper {
  position: relative;
  margin-top: 20px !important; /* 大幅增加话题块之间的间距 */
  margin-bottom: 16px !important; /* 大幅增加底部间距 */
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 32px 16px;
  color: #999999;
  font-size: 14px;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 32px 16px;
  color: #999999;
  font-size: 14px;
}

/* 分页器区域 - 减少底部空白区域 */
.pagination-section {
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding: 10px 0 5px; /* 减少垂直padding，特别是底部padding */
}

/* 适配iPhone刘海屏 */
.search-page {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>