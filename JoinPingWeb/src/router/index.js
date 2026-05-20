import Vue from 'vue'
import VueRouter from 'vue-router'

// 引入页面组件
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import ForgotPassword from '../views/ForgotPassword.vue'
import Home from '../views/Home.vue'
import Category from '../views/Category.vue'
import Profile from '../views/Profile.vue'
import NotificationView from '../views/NotificationView.vue'
import TopicDetail from '../views/TopicDetail.vue'
import SubjectDetail from '../views/SubjectDetail.vue'
import CommentDetail from '../views/CommentDetail.vue'
import CreateTopic from '../views/CreateTopic.vue'
import MyTopics from '../views/MyTopics.vue'
import MyFavorites from '../views/MyFavorites.vue'
import MyComments from '../views/MyComments.vue'
import EditTopic from '../views/EditTopic.vue'
import SearchView from '../views/SearchView.vue'
import ViewHistory from '../views/ViewHistory.vue'

// 使用路由
Vue.use(VueRouter)

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: {
      title: '注册'
    }
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      title: '密码重置'
    }
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: {
      title: '首页',
      keepAlive: true, // 首页需要缓存，保持滚动位置
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/category',
    name: 'Category',
    component: Category,
    meta: {
      title: '分类',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: '我的',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/notifications',
    name: 'Notifications',
    component: NotificationView,
    meta: {
      title: '通知',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/topic/:id',
    name: 'TopicDetail',
    component: TopicDetail,
    meta: {
      title: '话题详情',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/subject/:id',
    name: 'SubjectDetail',
    component: SubjectDetail,
    meta: {
      title: '主体详情',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/comment/:id',
    name: 'CommentDetail',
    component: CommentDetail,
    meta: {
      title: '评论详情',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/create-topic',
    name: 'CreateTopic',
    component: CreateTopic,
    meta: {
      title: '创建话题',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/my-topics',
    name: 'MyTopics',
    component: MyTopics,
    meta: {
      title: '我的话题',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/my-favorites',
    name: 'MyFavorites',
    component: MyFavorites,
    meta: {
      title: '我的收藏',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/my-comments',
    name: 'MyComments',
    component: MyComments,
    meta: {
      title: '我的评论',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/edit-topic/:id',
    name: 'EditTopic',
    component: EditTopic,
    meta: {
      title: '修改话题',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/search',
    name: 'SearchView',
    component: SearchView,
    meta: {
      title: '搜索结果',
      requiresAuth: true // 需要登录验证
    }
  },
  {
    path: '/view-history',
    name: 'ViewHistory',
    component: ViewHistory,
    meta: {
      title: '浏览历史',
      requiresAuth: true // 需要登录验证
    }
  }
]

// 创建路由实例
const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

// 路由守卫 - 设置页面标题和登录验证
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - JoinPing` : 'JoinPing'
  
  // 检查是否需要登录验证
  const token = localStorage.getItem('satoken') // 检查satoken
  const userId = localStorage.getItem('userId') // 同时检查userId
  const requireAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // 添加调试信息
  console.log('路由守卫检查:', {
    path: to.path,
    from: from.path,
    requiresAuth: requireAuth,
    hasToken: !!token,
    hasUserId: !!userId,
    tokenPreview: token ? token.substring(0, 10) + '...' : 'none',
    userId: userId,
    allLocalStorage: {
      userPhone: localStorage.getItem('userPhone'),
      userId: localStorage.getItem('userId'),
      satoken: localStorage.getItem('satoken')
    }
  })
  
  // 如果是登录页面，直接放行
  if (to.path === '/login' || to.path === '/register') {
    console.log('访问登录/注册页面，直接放行')
    next()
    return
  }
  
  // 如果需要登录验证但没有token或userId，则重定向到登录页
  // 检查satoken和userId，确保认证完整性
  if (requireAuth && (!token || !userId)) {
    console.log('需要登录但缺少token或userId，重定向到登录页')
    next('/login')
  } else {
    console.log('路由守卫通过，继续导航')
    next()
  }
})

export default router