<template>
  <div id="app">
    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<script>
// App.vue - 应用根组件
// 作为整个应用的容器，负责渲染路由视图
export default {
  name: 'App'
}
</script>

<style>
/* 全局样式已在index.html中定义 */
#app {
  min-height: 100%;
  width: 100%;
  position: relative;
}

/* 回复用户名蓝色样式 - 全局样式确保v-html内容也能应用样式 */
.reply-user-name-blue {
  color: #0066CC !important;
  font-weight: normal !important;
}
</style>