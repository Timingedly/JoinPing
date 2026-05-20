<template>
  <div class="register-container">
    <!-- 顶部导航栏 -->
    <div class="nav-bar">
      <button class="back-btn" @click="goBack">
        &lt;
      </button>
      <div class="nav-title">注册账号</div>
    </div>
    
    <!-- 注册表单 -->
    <div class="form-section">
      <div class="form-group">
        <input 
          type="tel" 
          v-model="registerForm.phone" 
          placeholder="请输入手机号" 
          class="form-input"
          maxlength="11"
        />
      </div>
      
      <div class="form-group">
        <div class="password-input-container">
          <input 
            :type="showPassword ? 'text' : 'password'" 
            v-model="registerForm.password" 
            placeholder="请设置密码" 
            class="form-input"
          />
          <button class="eye-btn" @click="togglePassword">
            <span class="eye-icon" :class="{ 'visible': showPassword }"></span>
          </button>
        </div>
      </div>
      
      <div class="form-group">
        <div class="password-input-container">
          <input 
            :type="showConfirmPassword ? 'text' : 'password'" 
            v-model="registerForm.confirmPassword" 
            placeholder="请确认密码" 
            class="form-input"
          />
          <button class="eye-btn" @click="toggleConfirmPassword">
            <span class="eye-icon" :class="{ 'visible': showConfirmPassword }"></span>
          </button>
        </div>
      </div>
      

      
      <button 
        class="register-btn" 
        :disabled="!canRegister || isLoading"
        @click.stop="handleRegister"
      >
        {{ isLoading ? '注册中...' : '注册' }}
      </button>
    </div>
  </div>
</template>

<script>
// 注册页面组件
// 功能：用户输入手机号、密码、昵称等信息进行注册
// 说明：对接后端注册API，实现用户注册

import { userApi } from '@/api'

export default {
  name: 'Register',
  data() {
    return {
      // 注册表单数据
      registerForm: {
        phone: '',           // 手机号
        password: '',        // 密码
        confirmPassword: '' // 确认密码
      },
      isLoading: false,  // 注册加载状态
      showPassword: false,        // 密码是否可见
      showConfirmPassword: false  // 确认密码是否可见
    }
  },
  computed: {
    // 检查是否可以注册（所有字段都不为空且密码一致）
    canRegister() {
      const result = (
        this.registerForm.phone.length === 11 && 
        this.registerForm.password.length >= 6 && 
        this.registerForm.password === this.registerForm.confirmPassword &&
        !this.isLoading
      );
      console.log('canRegister计算:', {
        phone: this.registerForm.phone,
        password: this.registerForm.password,
        confirmPassword: this.registerForm.confirmPassword,
        isLoading: this.isLoading,
        result: result
      });
      return result;
    }
  },
  methods: {
      // 返回上一页
      goBack() {
        this.$router.go(-1)
      },
      
      // 处理注册
      handleRegister() {
        console.log('注册按钮被点击');
        console.log('表单数据:', {
          phone: this.registerForm.phone,
          password: this.registerForm.password,
          confirmPassword: this.registerForm.confirmPassword
        });
        
        // 验证表单
        if (!this.validateForm()) {
          console.log('表单验证失败');
          return;
        }
        
        console.log('表单验证通过，开始调用注册API');
        
        // 显示加载状态
        this.isLoading = true;
        
        // 调用注册API
        userApi.register(
          this.registerForm.phone,
          this.registerForm.password,
          this.registerForm.confirmPassword
        ).then(response => {
          console.log('注册API响应:', response);
          this.isLoading = false;
          
          // 检查响应格式
          if (!response || typeof response !== 'object') {
            console.error('无效的响应格式:', response);
            this.$toast('服务器响应异常，请稍后重试');
            return;
          }
          
          // 检查响应状态
          if (response.code === 200 && response.hasSuccessed) {
            this.$toast('注册成功，请登录');
            // 跳转到登录页
            this.$router.push('/login');
          } else {
            // 显示错误信息
            const errorMsg = response.message || '注册失败，请稍后重试';
            console.error('注册失败:', errorMsg);
            this.$toast(errorMsg);
          }
        }).catch(error => {
          console.error('注册请求异常:', error);
          this.isLoading = false;
          // 判断是否是网络错误还是业务错误
          if (error.response) {
            // HTTP错误
            this.$toast('服务器错误，请稍后重试');
          } else if (error.request) {
            // 请求已发出但没有收到响应
            this.$toast('网络连接超时，请检查网络后重试');
          } else {
            // 其他错误
            this.$toast('网络异常，请检查网络连接后重试');
          }
        });
      },
      
      // 表单验证
      validateForm() {
        console.log('开始表单验证');
        
        // 验证手机号
        if (!this.registerForm.phone) {
          console.log('手机号为空');
          this.$toast('请输入手机号');
          return false;
        }
        
        // 只校验手机号是否为11位
        if (this.registerForm.phone.length !== 11) {
          console.log('手机号长度不正确');
          this.$toast('手机号必须为11位');
          return false;
        }
        
        // 验证密码
        if (!this.registerForm.password) {
          console.log('密码为空');
          this.$toast('请输入密码');
          return false;
        }
        
        // 后端验证：密码长度不超过20位
        if (this.registerForm.password.length > 20) {
          console.log('密码长度超过20位');
          this.$toast('密码长度不能超过20位');
          return false;
        }
        
        if (this.registerForm.password.length < 6) {
          console.log('密码长度少于6位');
          this.$toast('密码长度不能少于6位');
          return false;
        }
        
        // 验证确认密码
        if (!this.registerForm.confirmPassword) {
          console.log('确认密码为空');
          this.$toast('请确认密码');
          return false;
        }
        
        if (this.registerForm.password !== this.registerForm.confirmPassword) {
          console.log('两次输入的密码不一致');
          this.$toast('两次输入的密码不一致');
          return false;
        }
        
        console.log('表单验证通过');
        return true;
      },
      
      // 切换密码可见性
      togglePassword() {
        this.showPassword = !this.showPassword
      },
      
      // 切换确认密码可见性
      toggleConfirmPassword() {
        this.showConfirmPassword = !this.showConfirmPassword
      }
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
  padding: 0 16px;
  box-sizing: border-box;
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  height: 50px;
  margin-top: 12px;
  position: relative;
}

.back-btn {
  width: 30px;
  height: 30px;
  background: none;
  border: none;
  font-size: 24px;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 0;
}

.nav-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  font-weight: 500;
  color: #333;
}

/* 表单区域 */
.form-section {
  margin-top: 60px;
}

.form-group {
  margin-bottom: 16px;
}

.form-input {
  width: 100%;
  height: 50px;
  padding: 0 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
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
  display: flex;
  align-items: center;
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

.register-btn {
  width: 120px;
  height: 50px;
  background-color: #ff4757; /* 红色背景 */
  color: white; /* 白色文字 */
  border: none;
  border-radius: 6px;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin: var(--spacing-xl) auto 0;
  display: block;
  z-index: 1;
  position: relative;
  pointer-events: auto;
  
  &:active {
    transform: scale(0.98);
    background-color: #ff3838; /* 点击时稍微深一点的红色 */
  }
  
  &:disabled {
    background-color: #ff4757; /* 保持红色背景 */
    color: white; /* 保持白色文字 */
    opacity: 0.7; /* 降低透明度表示禁用状态 */
    cursor: not-allowed;
  }
}
</style>