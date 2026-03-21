<template>
  <div class="tab-bar">
    <!-- 底部导航栏，包含"首页"、"分类"、"我的"三个标签页 -->
    <div 
      v-for="(item, index) in tabList" 
      :key="index"
      class="tab-item"
      :class="{ active: currentTab === item.name }"
      @click="switchTab(item)"
    >
      <!-- 图标 -->
      <div class="tab-icon">
        <div class="icon-placeholder">{{ item.icon }}</div>
      </div>
      <!-- 文字 -->
      <div class="tab-text">{{ item.title }}</div>
    </div>
  </div>
</template>

<script>
// TabBar.vue - 底部导航栏组件
// 功能：提供应用底部导航功能，包含"首页"、"分类"、"我的"三个标签页
// 设计要点：
// 1. 选中状态时图标和文字都是红色
// 2. 未选中状态时图标和文字是黑色
// 3. 点击标签页切换路由

export default {
  name: 'TabBar',
  data() {
    return {
      // 当前选中的标签页
      currentTab: 'home',
      // 标签页列表
      tabList: [
        {
          name: 'home',
          title: '首页',
          icon: '🏠', // 图标占位符
          path: '/home'
        },
        {
          name: 'category',
          title: '分类',
          icon: '📁', // 图标占位符
          path: '/category'
        },
        {
          name: 'profile',
          title: '我的',
          icon: '👤', // 图标占位符
          path: '/profile'
        }
      ]
    }
  },
  created() {
    // 根据当前路由设置选中的标签页
    this.setCurrentTabByRoute()
  },
  watch: {
    // 监听路由变化，更新选中的标签页
    '$route'(to) {
      this.setCurrentTabByRoute(to)
    }
  },
  methods: {
    // 根据路由设置当前选中的标签页
    setCurrentTabByRoute(route = this.$route) {
      const path = route.path
      if (path === '/home') {
        this.currentTab = 'home'
      } else if (path === '/category') {
        this.currentTab = 'category'
      } else if (path === '/profile') {
        this.currentTab = 'profile'
      }
    },
    
    // 切换标签页
    switchTab(item) {
      // 如果当前已经是该标签页，不执行任何操作
      if (this.currentTab === item.name) {
        return
      }
      
      // 更新当前选中的标签页
      this.currentTab = item.name
      
      // 跳转到对应的路由
      this.$router.push(item.path)
    }
  }
}
</script>

<style scoped>
/* 底部导航栏容器 */
.tab-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 50px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  z-index: 999;
}

/* 标签项 */
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;
}

/* 图标区域 */
.tab-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 图标占位符 */
.icon-placeholder {
  font-size: 20px;
}

/* 文字 */
.tab-text {
  font-size: 12px;
  color: #000000; /* 未选中时黑色字体 */
}

/* 底部三个导航选中时图标和字体都是红色的 */
.tab-item.active .icon-placeholder,
.tab-item.active .tab-text {
  color: #FF0000; /* 选中效果字体变红 */
}

/* 选中时加粗 */
.tab-item.active .tab-text {
  font-weight: bold;
}

/* 点击效果 */
.tab-item:active {
  background-color: #f5f5f5;
}

/* 适配iPhone底部安全区域 */
@supports (padding: env(safe-area-inset-bottom)) {
  .tab-bar {
    padding-bottom: env(safe-area-inset-bottom);
    height: calc(50px + env(safe-area-inset-bottom));
  }
}
</style>
