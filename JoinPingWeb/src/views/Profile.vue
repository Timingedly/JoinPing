<template>
  <div class="profile-page">
    <div class="header">
      <div class="title">我的</div>
    </div>
    
    <div class="content">
      <!-- 个人信息区域 -->
      <div class="user-info">
        <!-- 圆形头像 -->
        <div class="avatar-container">
          <div class="avatar-wrapper" :data-initials="getInitials">
            <img v-if="avatarUrl" :src="getAvatarUrl(avatarUrl)" alt="用户头像" class="avatar-image" @click="onAvatarClick">
          </div>
        </div>
        
        <!-- 昵称 -->
        <div class="nickname-container">
          <input 
            v-if="isEditing" 
            v-model="tempNickname" 
            class="nickname-input"
            placeholder="请输入昵称（10字以内）"
            maxlength="10"
          >
          <span v-else class="nickname">{{ nickname }}</span>
          <div v-if="isEditing" class="char-count">{{ tempNickname.length }}/10</div>
        </div>
        
        <!-- 修改头像和修改昵称按钮 -->
        <div class="action-buttons">
          <div v-if="!isEditing" class="edit-buttons-container">
            <button class="edit-avatar-button" @click="startAvatarEditing">修改头像</button>
            <button class="edit-nickname-button" @click="startNicknameEditing">修改昵称</button>
          </div>
          <div v-else class="edit-mode-buttons">
            <button class="cancel-button" @click="cancelEditing">取消</button>
            <button class="confirm-button" @click="confirmEditing">确定</button>
          </div>
        </div>
      </div>
      
      <!-- 新建话题按钮 -->
      <div class="create-topic-button-container">
        <div class="create-topic-button" @click="goToCreateTopic">
          <span class="plus-icon">+</span>
        </div>
        <div class="create-topic-text">创建话题</div>
      </div>
      
      <!-- 功能列表 -->
      <div class="function-list">
        <div class="function-item" @click="goToMyTopics">
          <span class="function-text">我的话题</span>
          <span class="function-arrow">></span>
        </div>
        
        <div class="function-item" @click="goToMyComments">
          <span class="function-text">我的评论</span>
          <span class="function-arrow">></span>
        </div>
        
        <div class="function-item" @click="goToFavorites">
          <span class="function-text">我的收藏</span>
          <span class="function-arrow">></span>
        </div>
        
        <div class="function-item" @click="goToHistory">
          <span class="function-text">浏览历史</span>
          <span class="function-arrow">></span>
        </div>
      </div>
    </div>
    
    <!-- 底部导航栏 -->
    <TabBar />
    
    <!-- 隐藏的文件输入用于上传头像 -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      style="display: none" 
      @change="handleAvatarUpload"
    >
    
    <!-- 成功提示弹窗 -->
    <div v-if="showSuccessDialog" class="dialog-overlay" @click="closeSuccessDialog">
      <div class="dialog-content" @click.stop>
        <div class="success-dialog-icon">✓</div>
        <div class="success-dialog-message">{{ successMessage }}</div>
        <button class="success-dialog-button" @click="closeSuccessDialog">确定</button>
      </div>
    </div>
    
    <!-- 错误提示弹窗 -->
    <div v-if="showErrorDialog" class="dialog-overlay" @click="closeErrorDialog">
      <div class="dialog-content" @click.stop>
        <div class="error-dialog-icon">!</div>
        <div class="error-dialog-message">{{ errorMessage }}</div>
        <button class="error-dialog-button" @click="closeErrorDialog">确定</button>
      </div>
    </div>
  </div>
</template>

<script>
// Profile.vue - 个人中心页面组件
// 功能：提供用户个人信息展示、编辑和相关功能入口
// 数据交互：需要通过API调用获取和更新用户信息

import TabBar from '@/components/TabBar.vue'
import { userApi, documentApi } from '@/api'
import wsManager from '@/utils/websocket'

export default {
  name: 'Profile',
  components: {
    TabBar
  },
  data() {
    return {
      // 用户信息
      nickname: '有哈独爱红林', // 昵称
      avatarUrl: '', // 头像URL，为空时使用默认样式
      
      // 编辑状态
      isEditing: false, // 是否处于编辑状态
      tempNickname: '', // 临时存储编辑中的昵称
      
      // 弹窗状态
      showSuccessDialog: false,
      successMessage: '',
      showErrorDialog: false,
      errorMessage: '',
      
      // 默认头像样式（当没有头像URL时）
      defaultAvatarStyle: {
        backgroundColor: '#ff3b30',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold'
      }
    }
  },
  computed: {
    // 获取昵称的首字母作为默认头像显示
    getInitials() {
      if (!this.nickname) return ''
      return this.nickname.charAt(0).toUpperCase()
    }
  },
  methods: {
    // 获取用户信息
    async fetchUserInfo() {
      try {
        // 调用后端UserController的get方法获取用户信息
        const response = await userApi.getCurrentUserInfo();
        console.log('获取用户信息响应:', response);
        
        if (response.code === 200 && response.data) {
          // 将返回的name作为用户名，photoUrl作为头像路径
          this.nickname = response.data.name || '未设置昵称';
          this.avatarUrl = response.data.photoUrl || '';
          
          console.log('用户信息更新成功:', {
            nickname: this.nickname,
            avatarUrl: this.avatarUrl
          });
        } else {
          console.error('获取用户信息失败:', response.message);
        }
      } catch (error) {
        console.error('获取用户信息出错:', error);
      }
    },
    
    // 获取完整头像URL
    getAvatarUrl(avatarPath) {
      if (!avatarPath) return '';
      // 直接拼接固定IP+端口号，确保不会出现双斜杠
      // 如果avatarPath已经以/开头，则去掉开头的斜杠
      const cleanAvatarPath = avatarPath.startsWith('/') ? avatarPath.substring(1) : avatarPath;
      return `http://localhost:8080/${cleanAvatarPath}`;
    },
    
    // 开始修改头像 - 只触发头像选择，不进入编辑模式
    startAvatarEditing() {
      // 直接触发头像选择，不改变编辑状态
      this.$refs.fileInput.click()
    },
    
    // 开始修改昵称 - 只进入编辑模式，不触发头像选择
    startNicknameEditing() {
      this.isEditing = true
      this.tempNickname = this.nickname
    },
    
    // 取消编辑
    cancelEditing() {
      this.isEditing = false
      this.tempNickname = ''
    },
    
    // 确认编辑
    async confirmEditing() {
      // 验证昵称不为空
      if (!this.tempNickname.trim()) {
        this.showError('昵称不能为空')
        return
      }
      
      try {
        // 调用后端UserController的update方法更新用户名
        // API: POST /user?name={newName}
        const response = await userApi.updateUserName(this.tempNickname.trim())
        
        if (response.code === 200 && response.hasSuccessed) {
          // 更新成功，保存新昵称
          this.nickname = this.tempNickname
          this.isEditing = false
          console.log('用户名更新成功:', this.nickname)
          
          // 显示成功提示
          this.showSuccess('用户名修改成功')
        } else {
          // 更新失败，显示错误信息
          console.error('用户名更新失败:', response.message)
          this.showError('用户名修改失败: ' + response.message)
        }
      } catch (error) {
        console.error('用户名更新出错:', error)
        this.showError('用户名修改失败，请重试')
      }
    },
    
    // 点击头像
    onAvatarClick() {
      // 只有在编辑模式下才可以修改头像
      // 注意：修改昵称模式下(isEditing=true)点击头像也不应该有反应
      // 只有通过"修改头像"按钮才能触发头像选择
      console.log('头像被点击，当前编辑模式:', this.isEditing)
      // 这里保持为空，确保点击头像不会触发任何操作
    },
    
    // 处理头像上传
    async handleAvatarUpload(event) {
      const file = event.target.files[0]
      if (file) {
        try {
          // 调用后端DocumentController的uploadUserImage方法上传头像
          // API: PUT /document/user
          const response = await documentApi.uploadUserImage(file);
          console.log('头像上传响应:', response);
          
          if (response.code === 200 && response.hasSuccessed) {
            // 更新头像URL - 后端返回的data字段包含上传后的图片信息
            // 根据后端DocumentService.uploadImage方法，返回的是Document对象
            // Document对象包含url字段，即上传后的图片访问路径
            if (response.data && response.data.url) {
              this.avatarUrl = response.data.url;
              console.log('头像上传成功:', this.avatarUrl);
              
              // 显示成功提示
              this.showSuccess('头像修改成功');
            } else {
              console.error('头像上传失败: 返回数据格式不正确', response.data);
              this.showError('头像上传失败: 服务器返回数据格式不正确');
            }
          } else {
            console.error('头像上传失败:', response.message);
            this.showError('头像上传失败: ' + response.message);
          }
        } catch (error) {
          console.error('头像上传出错:', error);
          this.showError('头像上传失败，请重试');
        }
        
        // 清空文件输入，以便可以再次选择同一个文件
        event.target.value = ''
      }
    },
    
    // 跳转到我的收藏页面
    goToFavorites() {
      this.$router.push('/my-favorites')
    },
    
    // 跳转到浏览历史页面
    goToHistory() {
      this.$router.push('/view-history')
    },
    
    // 跳转到新建话题页面
    goToCreateTopic() {
      this.$router.push('/create-topic')
    },
    
    // 跳转到我的话题页面
    goToMyTopics() {
      this.$router.push('/my-topics')
    },
    
    // 跳转到我的评论页面
    goToMyComments() {
      this.$router.push('/my-comments')
    },
    
    // 弹窗控制方法
    showSuccess(message) {
      this.successMessage = message
      this.showSuccessDialog = true
    },
    
    closeSuccessDialog() {
      this.showSuccessDialog = false
      this.successMessage = ''
    },
    
    showError(message) {
      this.errorMessage = message
      this.showErrorDialog = true
    },
    
    closeErrorDialog() {
      this.showErrorDialog = false
      this.errorMessage = ''
    }

  },
  created() {
    // 每次进入"我的"页面时，调用API获取用户信息
    this.fetchUserInfo();
  }
}
</script>

<style scoped>
.profile-page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.header {
  height: 44px;
  background-color: #ff3b30; /* 红色背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  /* 适配iPhone刘海屏顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff; /* 白色文字 */
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 个人信息区域 */
.user-info {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 头像样式 */
.avatar-container {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}

.avatar-wrapper {
  width: 100px;
  height: 100px; /* 固定高度，确保容器大小一致 */
  border-radius: 50%;
  border: 2px solid #ff3b30;
  overflow: hidden; /* 确保超出部分被裁剪 */
  background-color: #ff3b30;
  position: relative;
  cursor: pointer;
}

.avatar-image {
  width: 100%;
  height: 100%; /* 填充整个容器 */
  object-fit: cover; /* 保持宽高比，裁剪超出部分 */
  object-position: center; /* 居中显示 */
}

/* 当没有头像时的默认文本 */
.avatar-wrapper::before {
  content: attr(data-initials);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 24px;
  font-weight: bold;
  opacity: 0;
  pointer-events: none;
}

.avatar-wrapper:empty::before,
.avatar-wrapper img[src=""]::before {
  opacity: 1;
}

/* 昵称样式 */
.nickname-container {
  margin-bottom: 16px;
}

.nickname {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.nickname-input {
  width: 200px;
  height: 36px;
  border: 1px solid #ff3b30;
  border-radius: 18px;
  padding: 0 16px;
  font-size: 16px;
  text-align: center;
  outline: none;
}

/* 按钮样式 */
.action-buttons {
  display: flex;
  justify-content: center;
}

/* 两个并列按钮的容器 */
.edit-buttons-container {
  display: flex;
  gap: 16px;
  justify-content: center;
}

/* 修改头像按钮 */
.edit-avatar-button {
  padding: 8px 20px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  min-width: 100px;
  transition: background-color 0.3s ease;
}

.edit-avatar-button:hover {
  background-color: #e62e24;
}

.edit-avatar-button:active {
  background-color: #cc1f16;
}

/* 修改昵称按钮 */
.edit-nickname-button {
  padding: 8px 20px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  min-width: 100px;
  transition: background-color 0.3s ease;
}

.edit-nickname-button:hover {
  background-color: #e62e24;
}

.edit-nickname-button:active {
  background-color: #cc1f16;
}

.edit-mode-buttons {
  display: flex;
  gap: 16px;
}

.cancel-button,
.confirm-button {
  padding: 8px 20px;
  border: none;
  border-radius: 20px;
  font-size: 16px;
  cursor: pointer;
}

.cancel-button {
  background-color: #e0e0e0;
  color: #666666;
}

.confirm-button {
  background-color: #ff3b30;
  color: #ffffff;
}

/* 新建话题按钮样式 */
.create-topic-button-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
}

.create-topic-text {
  margin-top: 8px;
  font-size: 16px;
  font-weight: bold;
  color: #007aff;
}

.create-topic-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #007aff;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  font-weight: 300;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}

.create-topic-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);
}

.plus-icon {
  line-height: 1;
}

/* 功能列表样式 */
.function-list {
  background-color: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.function-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
}

.function-item:last-child {
  border-bottom: none;
}

.function-text {
  font-size: 16px;
  color: #333333;
}

.function-arrow {
  font-size: 18px;
  color: #999999;
}



/* 字数统计样式 */
.char-count {
  font-size: 12px;
  color: #999999;
  text-align: center;
  margin-top: 4px;
  height: 16px;
}

/* 适配iPhone 12 Pro竖屏 */
@media screen and (min-width: 390px) and (max-width: 428px) and (max-height: 926px) {
  .user-info {
    padding: 40px 20px;
  }
  
  .avatar {
    width: 120px;
    height: 120px;
  }
}

/* 弹窗样式 - 与其他页面保持一致 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 30px 20px;
  width: 85%;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  animation: fadeInScale 0.3s ease-out;
}

@keyframes fadeInScale {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

.success-dialog-icon {
  width: 60px;
  height: 60px;
  background-color: #34c759;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
  margin: 0 auto 20px;
}

.error-dialog-icon {
  width: 60px;
  height: 60px;
  background-color: #ff3b30;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
  margin: 0 auto 20px;
}

.success-dialog-message,
.error-dialog-message {
  font-size: 16px;
  color: #333333;
  margin-bottom: 25px;
  line-height: 1.5;
  font-weight: 500;
}

.success-dialog-button,
.error-dialog-button {
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  width: auto;
  margin: 0 auto;
  display: block;
}

.success-dialog-button:hover,
.error-dialog-button:hover {
  background-color: #e62e24;
}

.success-dialog-button:active,
.error-dialog-button:active {
  background-color: #cc1f16;
}
</style>