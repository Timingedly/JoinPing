<template>
  <div class="login-container">
    <!-- 顶部Logo区域 -->
    <div class="logo-section">
      <div class="logo">Join 评</div>
      <div class="subtitle">发现精彩，分享观点</div>
    </div>
    
    <!-- 登录表单 -->
    <div class="form-section">
      <div class="form-group">
        <input 
          type="tel" 
          v-model="loginForm.phone" 
          placeholder="请输入手机号" 
          class="form-input"
          maxlength="11"
        />
      </div>
      
      <div class="form-group">
        <div class="password-input-container">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="loginForm.password" 
            placeholder="请输入密码" 
            class="form-input"
          />
          <button class="eye-btn" @click="togglePassword">
            <span class="eye-icon" :class="{ 'visible': showPassword }"></span>
          </button>
        </div>
      </div>
      
      <div class="register-row">
        <button class="forgot-password-btn" @click="goToForgotPassword">忘记密码？</button>
        <button class="register-btn" @click="goToRegister">注册账号</button>
      </div>
      
      <button 
        class="login-btn" 
        @click="handleLogin"
      >{{ isLoading ? '登录中...' : '登录' }}</button>
    </div>
  </div>
</template>

<script>
// 登录页面组件
// 功能：用户输入手机号和密码进行登录
// 说明：对接后端登录API，实现用户认证

import { userApi } from '@/api'
import wsManager from '@/utils/websocket'

export default {
  name: 'Login',
  data() {
    return {
      // 登录表单数据
      loginForm: {
        phone: '',    // 手机号
        password: ''  // 密码
      },
      isLoading: false,  // 登录加载状态
      showPassword: false  // 密码是否可见
    }
  },
  computed: {
    // 检查是否可以登录（手机号和密码都不为空）
    canLogin() {
      return this.loginForm.phone.length === 11 && this.loginForm.password.length > 0 && !this.isLoading
    }
  },
  methods: {
    // 处理登录
    async handleLogin() {
      // 验证手机号是否为11位
      if (!this.loginForm.phone) {
        this.$toast('请输入手机号')
        return
      }
      
      if (this.loginForm.phone.length !== 11) {
        this.$toast('手机号必须为11位')
        return
      }
      
      if (!this.loginForm.password) {
        this.$toast('请输入密码')
        return
      }
      
      this.isLoading = true
      
      try {
        // 调用登录API
        // API: GET /user/login
        // 功能：用户登录验证，返回用户ID和Sa-Token
        // 后端返回格式：{code: 200, message: "success", data: userId, hasSuccessed: true}
        // Sa-Token通常通过Cookie的方式返回，由响应拦截器处理
        console.log('开始登录，手机号:', this.loginForm.phone)
        const response = await userApi.login(this.loginForm.phone, this.loginForm.password)
        console.log('登录API响应:', response)
        
        // 适配后端返回的数据结构：{code, message, data, hasSuccessed}
        if (response.code === 200 && response.hasSuccessed) {
          console.log('登录成功，保存用户信息');
          console.log('登录响应数据:', response.data);
          
          // 从响应数据中获取用户ID
          const userId = response.data;
          
          // 使用Promise确保satoken保存完成后再执行后续逻辑
          this.saveTokenAndUserInfo(userId, this.loginForm.phone)
            .then(() => {
              console.log('用户信息和token保存完成');
              
              // WebSocket连接由插件自动处理，不需要手动连接
              // 插件会在路由变化时自动检测并连接
              console.log('WebSocket将由插件自动处理');
              
              // 跳转到首页
              console.log('准备跳转到首页...');
              this.$router.replace('/home').catch(err => {
                console.error('路由跳转失败:', err);
                
                // 如果路由跳转失败，尝试使用window.location
                console.log('尝试使用window.location跳转...');
                window.location.href = '/home';
              });
            })
            .catch(error => {
              console.error('保存用户信息失败:', error);
              this.$toast('登录信息保存失败，请重试');
            });
        } else {
          console.error('登录失败，响应:', response);
          this.$toast(response.message || '登录失败');
        }
      } catch (error) {
        console.error('登录失败:', error)
        this.$toast('登录失败，请稍后重试')
      } finally {
        this.isLoading = false
      }
    },
    
    // 保存用户信息和token的方法
    // 使用Promise确保保存完成后再执行后续逻辑
    saveTokenAndUserInfo(userId, userPhone) {
      return new Promise((resolve, reject) => {
        try {
          // 保存用户信息到localStorage
          localStorage.setItem('userPhone', userPhone);
          localStorage.setItem('userId', userId);
          
          // Sa-Token由响应拦截器从Cookie中获取并保存到localStorage
          // 检查satoken是否已保存
          const checkToken = () => {
            const satoken = localStorage.getItem('satoken');
            console.log('检查localStorage中的satoken:', satoken);
            
            if (satoken) {
              console.log('satoken已保存');
              resolve();
            } else {
              // 如果satoken还未保存，等待一段时间后再次检查
              // 最多重试10次，总等待时间不超过1秒
              setTimeout(checkToken, 100);
            }
          };
          
          // 开始检查satoken
          checkToken();
        } catch (error) {
          console.error('保存用户信息时出错:', error);
          reject(error);
        }
      });
    },
    
    // 跳转到注册页
    goToRegister() {
      this.$router.push('/register')
    },
    
    // 跳转到忘记密码页
    goToForgotPassword() {
      this.$router.push('/forgot-password')
    },
    
    // 切换密码可见性
    togglePassword() {
      this.showPassword = !this.showPassword
    }
  }
}
</script>

<style scoped>
.login-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-white);
  padding: 0 var(--spacing-lg);
  box-sizing: border-box;
}

/* 顶部Logo区域 */
.logo-section {
  margin-top: 80px;
  text-align: center;
}

.logo {
  font-size: 36px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
}

.subtitle {
  font-size: 16px;
  color: var(--text-secondary);
}

/* 表单区域 */
.form-section {
  margin-top: 60px;
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.register-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.form-input {
  width: 100%;
  height: 50px;
  padding: 0 var(--spacing-md);
  border: 1px solid var(--gray-border);
  border-radius: var(--border-radius-md);
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
}

.form-input:focus {
  border-color: var(--primary-color);
}

/* 密码输入框容器 */
.password-input-container {
  position: relative;
  width: 100%;
}

.eye-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 眼睛图标样式 */
.eye-icon {
  position: relative;
  display: inline-block;
  width: 18px;
  height: 12px;
  font-size: 0;
  line-height: 0;
  box-sizing: border-box;
  border: 2px solid #666;
  border-radius: 50%;
}

/* 眼睛的瞳孔 */
.eye-icon::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 4px;
  height: 4px;
  background-color: #666;
  border-radius: 50%;
}

/* 禁止观看的斜杠 */
.eye-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  width: 24px;
  height: 2px;
  background-color: #666;
  transition: opacity 0.2s;
}

/* 可见状态 - 隐藏斜杠 */
.eye-icon.visible::after {
  opacity: 0;
}

.login-btn {
  width: 120px;
  height: 50px;
  background-color: var(--primary-color);
  color: var(--text-white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 18px;
  font-weight: 500;
  margin: var(--spacing-xl) auto 0;
  display: block;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.login-btn:active {
  background-color: var(--primary-dark);
}

/* 忘记密码按钮样式 */
.forgot-password-btn {
  background: none;
  border: none;
  color: #007bff; /* 蓝色 */
  font-size: 14px;
  padding: 0;
  cursor: pointer;
}

.forgot-password-btn:active {
  opacity: 0.7;
}

/* 注册按钮样式 */
.register-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 14px;
  padding: 0;
  cursor: pointer;
}

.register-btn:active {
  opacity: 0.7;
}
</style>