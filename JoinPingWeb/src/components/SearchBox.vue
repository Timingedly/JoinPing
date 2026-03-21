<template>
  <div class="search-container">
    <div class="search-box">
      <!-- 搜索框输入区域 -->
      <input 
        type="text" 
        class="search-input"
        placeholder="搜索话题、帖子"
        v-model="searchKeyword"
        @keyup.enter="handleSearch"
      />
      <!-- 右侧搜索按钮 -->
      <div class="search-btn" @click="handleSearch">
        搜索
      </div>
    </div>
  </div>
</template>

<script>
// SearchBox.vue - 搜索框组件
// 功能：提供搜索功能，支持输入关键词并点击搜索按钮
// 设计要点：
// 1. 蓝色边框，白色填充
// 2. 左右半圆，中部正方形的形状
// 3. 搜索框内最右边安置一个"搜索"触发按钮
// 4. 点击搜索按钮跳转到新页面
import { homeApi } from '../api/index.js'

export default {
  name: 'SearchBox',
  props: {
    // 是否在搜索结果页面中使用，如果是则直接更新当前页面结果
    isInSearchPage: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      searchKeyword: '' // 搜索关键词
    }
  },
  methods: {
    // 处理搜索操作
    // 功能：根据关键词搜索话题，根据使用场景决定跳转或更新当前页面
    // 参数说明：搜索参数在搜索结果页面中统一处理
    handleSearch() {
      if (!this.searchKeyword.trim()) {
        // 如果搜索关键词为空，给出提示或不执行操作
        alert('请输入搜索关键词')
        return
      }
      
      console.log('开始搜索，关键词:', this.searchKeyword);
      
      if (this.isInSearchPage) {
        // 在搜索结果页面中，直接触发搜索事件更新当前页面结果
        this.$emit('search', this.searchKeyword)
      } else {
        // 在其他页面中，跳转到搜索结果页面
        this.$router.push({
          path: '/search',
          query: { 
            keyword: this.searchKeyword
          }
        })
      }
    }
  }
}
</script>

<style scoped>
/* 搜索容器 */
.search-container {
  padding: 12px 16px;
  background-color: #ffffff;
}

/* 搜索框主体 - 左右半圆，中部正方形的形状 */
.search-box {
  display: flex;
  align-items: center;
  border: 1px solid #0000FF; /* 蓝色边框 */
  border-radius: 20px; /* 左右半圆，中部正方形的形状 */
  background-color: #ffffff; /* 白色填充 */
  overflow: hidden;
  height: 40px;
}

/* 搜索输入框 */
.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0 16px;
  font-size: 14px;
  color: #000000; /* 黑色字体 */
  background-color: transparent;
}

/* 搜索输入框的占位符样式 */
.search-input::placeholder {
  color: #999999;
}

/* 搜索按钮 */
.search-btn {
  padding: 0 16px;
  color: #000000; /* 黑色字体 */
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* 搜索按钮左边的蓝色竖边封边 */
.search-btn::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 1px;
  height: 20px; /* 竖线高度，可以根据需要调整 */
  background-color: #0000FF; /* 蓝色竖线 */
}

/* 搜索按钮点击效果 */
.search-btn:active {
  color: #FF0000; /* 选中效果字体变红 */
  background-color: #f0f0f0;
}
</style>
