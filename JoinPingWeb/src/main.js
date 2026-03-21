import Vue from 'vue'
import App from './App.vue'
import router from './router'

// 引入Vant UI组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 引入全局样式
import './assets/css/global.css'

// 引入Toast插件
import Toast from './utils/toast'

// 引入WebSocket插件
import './utils/websocket-plugin'

// 使用Vant
Vue.use(Vant)

// 使用Toast插件
Vue.use(Toast)

// 关闭生产提示
Vue.config.productionTip = false

// 创建Vue实例
new Vue({
  router,
  render: h => h(App)
}).$mount('#app')