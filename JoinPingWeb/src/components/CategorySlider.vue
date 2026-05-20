<template>
  <div class="category-slider-container">
    <!-- 水平滑动的分类容器 -->
    <div class="category-slider" :class="{ 'single-item': categories.length === 1, 'double-items': categories.length === 2 }">
      <div 
        v-for="(category, index) in categories" 
        :key="index"
        class="category-item"
        :style="getItemStyle()"
        :class="{ active: currentCategory === category.key }"
        @click="selectCategory(category)"
      >
        {{ category.name }}
      </div>
    </div>
  </div>
</template>

<script>
// CategorySlider.vue - 分类滑动组件
// 功能：提供水平滑动的分类选择功能
// 设计要点：
// 1. 水平滑动框
// 2. 每个滑动块点击后请求不同的API数据
// 3. 选中效果字体变红
// 4. 根据分类数量动态调整宽度
// 5. 根据当前页面使用不同的分类数据：分类页使用分类页专用API，首页使用首页API

import { categoryApi, homeApi } from '../api/index.js';

export default {
  name: 'CategorySlider',
  data() {
    return {
      categories: [], // 分类列表，根据页面动态加载
      currentCategory: '', // 当前选中的分类key
      screenWidth: window.innerWidth // 屏幕宽度
    }
  },
  mounted() {
    // 监听窗口大小变化，更新屏幕宽度
    window.addEventListener('resize', this.updateScreenWidth)
  },
  beforeDestroy() {
    // 移除事件监听
    window.removeEventListener('resize', this.updateScreenWidth)
  },
  created() {
    // 组件创建时加载分类数据
    this.loadCategories();
  },
  methods: {
    // 加载分类数据
    loadCategories() {
      const currentRoute = this.$route?.path || '';
      
      if (currentRoute.includes('/category')) {
        // 分类页：使用分类页专用API获取分类列表
        console.log('分类页：使用分类页专用API获取分类列表');
        categoryApi.getCategoryList()
          .then(response => {
            if (response.hasSuccessed && response.data) {
              // 转换数据格式：从[{id: 1, name: "音乐"}]转换为[{key: 'category_1', name: "音乐", id: 1}]
              this.categories = response.data.map(category => ({
                key: `category_${category.id}`,
                name: category.name,
                id: category.id
              }));
              
              // 默认选中第一个分类
              if (this.categories.length > 0) {
                this.currentCategory = this.categories[0].key;
                this.$emit('category-selected', this.categories[0].id);
              }
            } else {
              // 使用备用分类数据
              this.useFallbackCategories();
            }
          })
          .catch(error => {
            console.error('获取分类页分类列表失败:', error);
            this.useFallbackCategories();
          });
      } else {
        // 首页：使用首页分类数据
        console.log('首页：使用首页分类数据');
        this.categories = [
          { key: 'weekMostLike', name: '近期最热', id: 1 },
          { key: 'weekMostFavorite', name: '近期最受期待', id: 2 }
        ];
        
        // 默认选中第一个分类
        if (this.categories.length > 0) {
          this.currentCategory = this.categories[0].key;
          this.$emit('category-selected', this.categories[0].key);
        }
      }
    },
    
    // 使用备用分类数据
    useFallbackCategories() {
      console.log('使用备用分类数据');
      this.categories = [
        { key: 'category_1', name: '音乐', id: 1 },
        { key: 'category_2', name: '游戏', id: 2 },
        { key: 'category_3', name: '电影', id: 3 },
        { key: 'category_4', name: '体育', id: 4 }
      ];
      
      // 默认选中第一个分类
      if (this.categories.length > 0) {
        this.currentCategory = this.categories[0].key;
        this.$emit('category-selected', this.categories[0].id);
      }
    },
    
    // 更新屏幕宽度
    updateScreenWidth() {
      this.screenWidth = window.innerWidth
    },
    
    // 获取分类项的动态样式
    getItemStyle() {
      // 根据分类数量动态计算宽度
      if (this.categories.length === 1) {
        // 只有一个块时，使用内容实际宽度
        return { width: 'auto' }
      } else if (this.categories.length === 2) {
        // 两个块时，平分屏幕宽度（减去padding和边框）
        const width = (this.screenWidth - 32 - 2) / 2 // 32px padding左右各16px，2px 边框
        return { width: `${width}px` }
      } else {
        // 超过三个块时，按屏幕宽度/3固定宽度
        const width = this.screenWidth / 3
        return { width: `${width}px` }
      }
    },
    
    // 选择分类
    selectCategory(category) {
      this.currentCategory = category.key
      // 发送事件通知父组件，选中了新的分类
      // 根据当前路由判断是首页还是分类页，传递不同的参数
      const currentRoute = this.$route?.path || ''
      if (currentRoute.includes('/category')) {
        // 分类页：传递categoryId（数字类型）
        this.$emit('category-selected', category.id || 1)
      } else {
        // 首页：传递rankKey（字符串类型）
        this.$emit('category-selected', category.key)
      }
    }
  }
}
</script>

<style scoped>
/* 分类滑动容器 */
.category-slider-container {
  background-color: #ffffff;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

/* 水平滑动的分类列表 */
.category-slider {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 16px;
  /* 隐藏滚动条但保留滚动功能 */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 单个项目时居中显示 */
.category-slider.single-item {
  justify-content: center;
}

/* 两个项目时调整样式 */
.category-slider.double-items {
  overflow-x: visible;
}

/* 隐藏WebKit浏览器的滚动条 */
.category-slider::-webkit-scrollbar {
  display: none;
}

/* 分类项 - 紧密无间的方块 */
.category-item {
  display: inline-block;
  padding: 8px 20px;
  margin-right: 0; /* 移除间距，使方块紧密无间 */
  font-size: 14px;
  color: #000000; /* 黑色字体 */
  cursor: pointer;
  border-radius: 0; /* 移除圆角，改为方块 */
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0; /* 添加边线区分 */
  /* 移除相邻元素间的间距 */
  margin-left: -1px;
  text-align: center; /* 文字居中 */
  flex-shrink: 0; /* 防止被压缩 */
}

/* 第一个分类项特殊处理，避免左边框重复 */
.category-item:first-child {
  margin-left: 0;
}

/* 选中效果字体变红，边框也变红 */
.category-item.active {
  color: #FF0000; /* 红色字体 */
  border-color: #FF0000; /* 选中时边框变红色 */
  font-weight: bold;
  position: relative;
  z-index: 1; /* 确保选中的边框在上面 */
}
</style>