<template>
  <div class="ranking-slider-container">
    <!-- 水平滑动的热榜容器 -->
    <div class="ranking-slider">
      <div 
        class="ranking-item active"
      >
        近期最热
      </div>
    </div>
  </div>
</template>

<script>
// RankingSlider.vue - 热榜滑动组件
// 功能：提供水平滑动的热榜选择功能
// 设计要点：
// 1. 水平滑动框，只包含一项："近期最热"
// 2. 数据来源是IndexController的rankingList方法
// 3. 请求的key为：KEY_WEEK_MOST_LIKE
// 4. 选中效果字体变红
// 5. 选中后通知父组件更新话题列表

export default {
  name: 'RankingSlider',
  data() {
    return {
      currentRanking: 'KEY_WEEK_MOST_LIKE' // 当前选中的热榜类型，固定为"近期最热"
    }
  },
  created() {
    // 通知父组件默认选中的热榜类型
    this.$emit('ranking-selected', this.currentRanking)
  }
}
</script>

<style scoped>
/* 热榜滑动容器 */
.ranking-slider-container {
  background-color: #ffffff;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

/* 水平滑动的热榜列表 */
.ranking-slider {
  display: flex;
  overflow-x: auto;
  white-space: nowrap;
  padding: 0 16px;
  /* 隐藏滚动条但保留滚动功能 */
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* 隐藏WebKit浏览器的滚动条 */
.ranking-slider::-webkit-scrollbar {
  display: none;
}

/* 热榜项 - 单个选项占据整个宽度 */
.ranking-item {
  display: block;
  padding: 8px 20px;
  margin-right: 0; /* 移除间距 */
  font-size: 14px;
  color: #000000; /* 黑色字体 */
  cursor: pointer;
  border-radius: 0; /* 移除圆角，改为方块 */
  transition: all 0.2s ease;
  border: 1px solid #e0e0e0; /* 添加边线区分 */
  text-align: center; /* 文字居中 */
  width: 100%; /* 占据整个宽度 */
  box-sizing: border-box; /* 包含边框在内的宽度计算 */
}

/* 选中效果字体变红，边框也变红 */
.ranking-item.active {
  color: #FF0000; /* 红色字体 */
  border-color: #FF0000; /* 选中时边框变红色 */
  font-weight: bold;
  position: relative;
  z-index: 1; /* 确保选中的边框在上面 */
}
</style>