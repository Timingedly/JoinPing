import axios from 'axios'
import { validatePaginationConsistency } from './pagination-utils.js'

// 打印环境变量，便于调试
console.log('环境变量 VUE_APP_API_BASE_URL:', process.env.VUE_APP_API_BASE_URL)

// 创建axios实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080', // 后端API基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json'
  }
})

// 打印实际使用的baseURL
console.log('实际使用的baseURL:', service.defaults.baseURL)

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 打印请求信息，便于调试
    console.log('请求拦截器 - 请求URL:', config.url)
    console.log('请求拦截器 - 请求方法:', config.method)
    console.log('请求拦截器 - 完整URL:', service.defaults.baseURL + config.url)
    
    // 定义不需要token的白名单API
    const noTokenApis = [
      '/user/register', // 注册API - 创建新用户，不需要token
      '/user/login'     // 登录API - 获取用户认证，不需要token
    ]
    
    // 检查当前请求是否在白名单中
    const isNoTokenApi = noTokenApis.some(api => config.url.includes(api))
    
    if (isNoTokenApi) {
      console.log('请求拦截器 - 当前API不需要token，跳过添加')
    } else {
      // 从localStorage获取satoken
      const satoken = localStorage.getItem('satoken')
      console.log('请求拦截器 - satoken状态:', satoken ? '已获取' : '未获取', satoken ? satoken.substring(0, 10) + '...' : '')
      
      // 如果有satoken，添加到请求头
      if (satoken) {
        config.headers['satoken'] = satoken
        console.log('请求拦截器 - satoken已添加到请求头')
      }
    }
    
    // 处理GET请求参数
    if (config.method === 'get' && config.params) {
      // 对于GET请求，如果有参数且是对象，转换为URL参数
      if (typeof config.params === 'object' && !(config.params instanceof URLSearchParams)) {
        const params = new URLSearchParams()
        Object.keys(config.params).forEach(key => {
          if (config.params[key] !== undefined && config.params[key] !== null) {
            params.append(key, config.params[key])
          }
        })
        config.params = params
      }
    }
    
    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    // 打印响应信息，便于调试
    console.log('响应拦截器 - 响应状态:', response.status)
    console.log('响应拦截器 - 响应头:', response.headers)
    console.log('响应拦截器 - 完整响应数据:', response.data)
    
    // 尝试从响应中获取satoken
    let satoken = null
    
    // 1. 优先从响应头的set-cookie中获取Sa-Token
    if (response.headers['set-cookie']) {
      const cookies = response.headers['set-cookie']
      console.log('响应拦截器 - 检查set-cookie:', cookies)
      for (let cookie of cookies) {
        if (cookie.includes('satoken=')) {
          satoken = cookie.split(';')[0].replace('satoken=', '')
          console.log('响应拦截器 - 从set-cookie获取到satoken:', satoken)
          break
        }
      }
    }
    
    // 2. 如果从cookie中未获取到，尝试从响应数据中获取
    if (!satoken && response.data && response.data.data && response.data.data.token) {
      satoken = response.data.data.token
      console.log('响应拦截器 - 从响应数据获取到satoken:', satoken)
    }
    
    // 3. 如果仍未获取到，尝试从响应数据的satoken字段获取
    if (!satoken && response.data && response.data.data && response.data.data.satoken) {
      satoken = response.data.data.satoken
      console.log('响应拦截器 - 从响应数据satoken字段获取到satoken:', satoken)
    }
    
    // 4. 尝试直接从response.data获取token
    if (!satoken && response.data && response.data.token) {
      satoken = response.data.token
      console.log('响应拦截器 - 从response.data.token获取到satoken:', satoken)
    }
    
    // 5. 尝试直接从response.data获取satoken
    if (!satoken && response.data && response.data.satoken) {
      satoken = response.data.satoken
      console.log('响应拦截器 - 从response.data.satoken获取到satoken:', satoken)
    }
    
    // 6. 尝试从document.cookie中获取satoken（Sa-Token通常会自动设置到cookie中）
    if (!satoken) {
      const cookies = document.cookie.split(';')
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=')
        if (name === 'satoken') {
          satoken = value
          console.log('响应拦截器 - 从document.cookie获取到satoken:', satoken)
          break
        }
      }
    }
    
    // 保存satoken到localStorage
    if (satoken) {
      localStorage.setItem('satoken', satoken)
      console.log('响应拦截器 - satoken已保存到localStorage')
    } else {
      console.warn('响应拦截器 - 未能获取到satoken')
      // 对于登录请求，尝试延迟获取Sa-Token
      if (response.config.url.includes('/user/login') && response.data.code === 200) {
        console.log('登录请求成功，延迟100ms后再次尝试获取satoken')
        setTimeout(() => {
          // 再次尝试从document.cookie中获取satoken
          const cookies = document.cookie.split(';')
          let delayedSatoken = null
          for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=')
            if (name === 'satoken') {
              delayedSatoken = value
              break
            }
          }
          
          if (delayedSatoken) {
            localStorage.setItem('satoken', delayedSatoken)
            console.log('延迟获取satoken成功:', delayedSatoken)
          } else {
            console.warn('延迟获取satoken失败')
          }
        }, 100)
      }
    }
    
    // 分页数据验证：检测分页响应并添加验证逻辑
    if (response.data && response.data.data && response.data.data.list && Array.isArray(response.data.data.list)) {
      console.log('响应拦截器 - 检测到分页数据，进行分页数据验证')
      
      const paginationData = response.data.data
      
      // 使用pagination-utils.js提供的验证函数进行更全面的验证
      const validationResult = validatePaginationConsistency(
        paginationData, 
        { currentPage: paginationData.current, totalPages: paginationData.pages, totalItems: paginationData.total },
        'API-Response-Interceptor'
      )
      
      // 记录验证结果
      if (!validationResult.isValid) {
        console.warn('响应拦截器 - 分页数据验证发现问题：', validationResult)
      }
      
      // 基础结构验证 - 后端返回String类型，需要转换为Number进行验证
      const total = Number(paginationData.total) || 0
      const current = Number(paginationData.current) || 1
      const size = Number(paginationData.size) || 10
      const pages = Number(paginationData.pages) || 1
      
      if (isNaN(total) || isNaN(current) || isNaN(size) || isNaN(pages)) {
        console.warn('响应拦截器 - 分页数据结构不完整，缺少必要字段')
      }
      
      // 逻辑一致性验证
      if (current < 1) {
        console.warn('响应拦截器 - 分页数据异常：current值小于1', current)
      }
      
      if (size < 1) {
        console.warn('响应拦截器 - 分页数据异常：size值小于1', size)
      }
      
      if (pages < 0) {
        console.warn('响应拦截器 - 分页数据异常：pages值小于0', pages)
      }
      
      // 计算预期pages值进行验证 - 使用转换后的Number类型进行计算
      const expectedPages = size > 0 ? Math.ceil(total / size) : 0
      if (pages !== expectedPages) {
        console.warn('响应拦截器 - 分页数据异常：pages值计算不一致', {
          actual: pages,
          expected: expectedPages,
          total: total,
          size: size
        })
      }
      
      // 验证current值是否在合理范围内
      if (paginationData.current > paginationData.pages && paginationData.pages > 0) {
        console.warn('响应拦截器 - 分页数据异常：current值超出pages范围', {
          current: paginationData.current,
          pages: paginationData.pages
        })
      }
      
      // 添加分页数据验证标记和验证结果
      response.data.data._paginationValidated = true
      response.data.data._validationResult = validationResult
      console.log('响应拦截器 - 分页数据验证完成')
    }
    
    // 适配后端返回的数据结构：{code, message, data, hasSuccessed}
    // 直接返回response.data，让调用方处理
    return response.data
  },
  error => {
    console.error('请求错误:', error)
    
    // 处理HTTP错误状态码
    if (error.response) {
      const status = error.response.status
      console.error('HTTP错误状态码:', status)
      
      if (status === 401) {
        // 未授权，清除本地存储的用户信息和token
        localStorage.removeItem('userPhone')
        localStorage.removeItem('userId')
        localStorage.removeItem('satoken')
        
        // 断开WebSocket连接
        if (window.wsManager) {
          window.wsManager.disconnect()
        }
        
        // 跳转到登录页
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    
    return Promise.reject(error)
  }
)

export default service