<template>
  <div class="category-page">
    <!-- 顶部固定区域 - 红色背景 -->
    <div class="header">
      <div class="title">分类</div>
    </div>
    
    <!-- 排序按钮区域 -->
    <div class="sort-buttons">
      <button 
        class="sort-btn" 
        :class="{ active: sortType === 'hot' }"
        @click="setSortType('hot')"
      >
        最热
      </button>
      <button 
        class="sort-btn" 
        :class="{ active: sortType === 'newest' }"
        @click="setSortType('newest')"
      >
        最新
      </button>
    </div>
    
    <!-- 分类选择区域 -->
    <div class="category-section">
      <CategorySlider @category-selected="handleCategorySelected" />
    </div>
    
    <!-- 话题列表区域 -->
    <div class="topic-section">
      <div class="topic-list">
        <div 
          v-for="(topic, index) in topics" 
          :key="topic.id" 
          class="topic-item-wrapper"
        >
          <!-- 话题内容 -->
          <TopicItem 
            :topic="topic"
            :index="index"
            :show-manage-button="false"
            @click="goToTopicDetail(topic.id)"
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
        :total-items="totalItems"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
    
    <!-- 底部导航栏 -->
    <TabBar />
  </div>
</template>

<script>
/**
 * Category.vue - 分类页面组件
 * 功能：提供分类浏览功能，支持按最热/最新排序，分页查询话题
 * 设计要点：
 * 1. 顶部标题"分类"
 * 2. 最热/最新排序按钮
 * 3. 水平滚动的分类选择器
 * 4. 分页查询的话题列表，显示序号+话题组合
 */

import TabBar from '@/components/TabBar.vue';
import CategorySlider from '@/components/CategorySlider.vue';
import Pagination from '@/components/Pagination.vue';
import TopicItem from '@/components/TopicItem.vue';
import { categoryApi } from '../api/index.js'; // 使用分类页专用API，与首页API完全解耦

export default {
  name: 'Category',
  components: {
    TabBar,
    CategorySlider,
    Pagination,
    TopicItem
  },
  data() {
    return {
      sortType: 'hot',      // 默认按热度排序 'hot' | 'newest'
      currentCategoryId: 1, // 当前选中的分类ID，默认为音乐分类(1)
      topics: [],           // 话题列表
      pageSize: 10,         // 每页显示数量
      currentPage: 1,       // 当前页码
      totalPages: 10,       // 总页数，模拟数据
      totalItems: 100       // 总记录数，模拟数据
    };
  },
  watch: {
    // 监听排序类型变化，重新获取话题
    sortType: {
      handler() {
        this.fetchTopics();
      },
      immediate: false
    },
    // 监听分类ID变化，重新获取话题
    currentCategoryId: {
      handler() {
        this.fetchTopics();
      },
      immediate: true // 设置为true，组件创建时立即触发
    }
  },
  created() {
    // 组件创建时不立即获取话题列表，等待分类数据加载完成
    // 话题列表的获取将在分类选择事件触发后进行
  },
  methods: {
    /**
     * 设置排序类型
     * @param {string} type - 排序类型 'hot' | 'newest'
     */
    setSortType(type) {
      this.sortType = type;
    },
    
    /**
     * 处理分类选择
     * @param {number} categoryId - 选中的分类ID
     */
    handleCategorySelected(categoryId) {
      // 切换分类时重置分页器到第一页
      this.currentPage = 1;
      this.currentCategoryId = categoryId;
    },
    
    /**
     * 获取话题列表 - 分类页专用
     * API: GET /category/topics
     * 功能：根据分类ID和排序类型获取话题列表，分类页专用接口
     * 参数说明：
     * - categoryId: 分类ID
     * - pageNum: 页码
     * - pageSize: 每页大小
     * - sortType: 排序类型 'hot'（最热）或 'newest'（最新）
     */
    fetchTopics() {
      console.log('开始获取分类页话题列表:', { 
        categoryId: this.currentCategoryId, 
        pageNum: this.currentPage, 
        pageSize: this.pageSize, 
        sortType: this.sortType 
      });
      
      categoryApi.getCategoryTopics(this.currentCategoryId, this.currentPage, this.pageSize, this.sortType)
        .then(response => {
          console.log('分类页话题列表API响应:', response);
          
          // 处理成功响应
          if (response.hasSuccessed && response.data) {
            // 后端返回的分页数据结构
            const pageData = response.data;
            
            // 后端已经完成排序，直接使用返回的数据
          this.topics = pageData.list || [];
            
            // 更新分页信息 - 后端Long类型转为String，需要转换为Number类型
            // 修复Vue警告：Invalid prop: type check failed for prop "totalPages". Expected Number, got String
            this.totalItems = Number(pageData.total) || 0;
            this.totalPages = Number(pageData.pages) || 1;
            // 修复bug：前端应该保持自己的currentPage状态，不依赖后端返回的current字段
            // 因为后端可能返回错误的current值（如11），导致分页异常
            // this.currentPage = pageData.current || 1; // 注释掉这行，不更新currentPage
            console.log('API返回的current字段:', pageData.current, '前端保持的currentPage:', this.currentPage);
            
            console.log('成功获取话题列表，排序方式:', this.sortType, {
              topicsCount: this.topics.length,
              totalItems: this.totalItems,
              totalPages: this.totalPages,
              currentPage: this.currentPage
            });
          } else {
            console.error('获取话题列表失败，响应状态异常:', response);
            // 使用模拟数据作为备用
            this.generateMockTopics();
          }
        })
        .catch(error => {
          console.error('获取话题列表失败:', error);
          // 发生错误时使用模拟数据
          this.generateMockTopics();
        });
    },
    
    /**
     * 生成模拟话题数据（备用方案）
     * 数据结构与后端Topic实体类保持一致
     */
    generateMockTopics() {
      console.log('使用模拟话题数据作为备用');
      
      // 根据pageSize生成对应数量的话题
      const mockTopics = [];
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const now = new Date();
      
      for (let i = 0; i < this.pageSize; i++) {
        const topicId = startIndex + i + 1;
        // 根据排序类型设置不同的创建时间
        let hoursAgo;
        if (this.sortType === 'hot') {
          // 热门排序：随机时间，但更倾向于最近的时间
          hoursAgo = Math.floor(Math.random() * 24 * 7) + 1;
        } else {
          // 最新排序：按顺序递减，最新的话题最靠前
          hoursAgo = i * 2 + 1;
        }
        
        // 模拟数据字段与后端Topic实体类保持一致
        mockTopics.push({
          id: topicId,
          name: `${this.sortType === 'hot' ? '热门' : '最新'}话题 ${topicId}`,
          content: `这是一个${this.sortType === 'hot' ? '热门' : '最新'}话题，分类ID为${this.currentCategoryId}。这里是话题的详细描述内容，可以包含多个段落和相关信息。用户可以通过点击进入话题详情页查看更多内容。`,
          likeNum: Math.floor(Math.random() * 1000), // 点赞数
          favoriteNum: Math.floor(Math.random() * 500), // 收藏数
          areaId: this.currentCategoryId, // 分类ID
          photoUrl: `https://picsum.photos/300/200?random=${topicId}`, // 图片URL
          createTime: new Date(now.getTime() - 1000 * 60 * 60 * hoursAgo).toISOString()
        });
      }
      
      // 对模拟数据进行排序
      if (this.sortType === 'newest') {
        // 最新排序：按创建时间倒序（最新的在前）
        mockTopics.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
      } else {
        // 热门排序：按点赞数倒序（点赞多的在前）
        mockTopics.sort((a, b) => b.likeNum - a.likeNum);
      }
      
      // 直接替换话题列表
      this.topics = mockTopics;
      
      // 计算总页数（模拟数据固定为100条记录）
      this.totalItems = 100;
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      
      console.log('模拟话题数据生成完成，排序方式:', this.sortType, {
        topicsCount: this.topics.length,
        totalItems: this.totalItems,
        totalPages: this.totalPages
      });
    },
    
    /**
     * 处理页码变化
     * @param {number} page - 新的页码
     */
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchTopics();
    },
    
    /**
     * 处理每页显示条数变化
     * @param {number} pageSize - 新的每页显示条数
     * @param {number} page - 新的页码
     */
    handlePageSizeChange(pageSize, page) {
      this.pageSize = pageSize;
      this.currentPage = page;
      // 重新计算总页数
      this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      this.fetchTopics();
    },
    
    /**
     * 跳转到话题详情页
     * @param {number} topicId - 话题ID
     */
    goToTopicDetail(topicId) {
      this.$router.push(`/topic/${topicId}`);
    },
    
    /**
     * 格式化日期时间
     * @param {string} dateString - ISO格式的时间字符串
     * @returns {string} 格式化后的时间显示（年月日格式）
     */
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      // 统一返回年月日格式：2025-10-01
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
};
</script>

<style scoped>
.category-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  overflow: hidden;
}

.header {
  height: 50px;
  background-color: #FF0000; /* 红色背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.title {
  font-size: 18px;
  font-weight: bold;
  color: #ffffff; /* 白色文字 */
}

/* 排序按钮区域 */
.sort-buttons {
  display: flex;
  margin-top: 50px; /* 顶部导航栏的高度 */
  background-color: #ffffff;
  padding: 12px 16px;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.sort-btn {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #333333;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sort-btn.active {
  background-color: #FF0000;
  color: #ffffff;
  border-color: #FF0000;
}

/* 分类选择区域 */
.category-section {
  flex-shrink: 0;
  background-color: #ffffff;
}

/* 话题列表区域 - 内嵌滑动框样式，与我的收藏页保持一致 */
.topic-section {
  flex: 1; /* 使用flex布局填充剩余空间，替代固定高度 */
  overflow-y: auto; /* 垂直滚动 */
  padding: 8px 0;
  /* 添加边框和背景色，形成明确的内嵌区块 */
  border: 2px solid #f0f0f0; /* 添加粗边框，与我的收藏页保持一致 */
  border-radius: 8px; /* 圆角边框 */
  background-color: #ffffff; /* 白色背景 */
  margin: 12px 16px; /* 添加外边距，与页面边缘保持距离 */
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* Webkit浏览器滚动条样式 */
.topic-section::-webkit-scrollbar {
  width: 6px;
}

.topic-section::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.topic-section::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.topic-section::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 话题列表容器 - 添加内边距控制话题块宽度，与我的收藏页保持一致 */
.topic-list {
  width: 100%;
  padding: 0 16px; /* 添加内边距，确保内容不贴边，与我的收藏页保持一致 */
  margin-bottom: 20px;
}

/* 话题项包装器 - 与我的收藏页保持一致 */
.topic-item-wrapper {
  position: relative;
  margin-top: 20px !important; /* 大幅增加话题块之间的间距 */
  margin-bottom: 16px !important; /* 大幅增加底部间距 */
}

/* 分页器区域 */
.pagination-section {
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding-bottom: 60px; /* 为底部导航栏留出空间 */
}

/* 移除重复的话题项样式，现在由TopicItem组件处理 */


/* 适配iPhone刘海屏 */
.category-page {
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}
</style>