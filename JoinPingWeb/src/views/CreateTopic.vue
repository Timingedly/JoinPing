<template>
  <div class="create-topic-page">
    <!-- 页面头部 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <span class="back-arrow">&lt;</span>
      </div>
      <div class="title">创建话题</div>
      <div class="placeholder"></div> <!-- 为了标题居中 -->
    </div>

    <!-- 内容区域 -->
    <div class="content">
      <!-- 图片上传区域 -->
      <div class="image-upload-section">
        <div class="image-upload-container" @click="triggerFileUpload">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="话题图片预览" class="image-preview">
          <div v-else class="upload-placeholder">
            <div class="upload-icon">+</div>
            <div class="upload-text">上传话题图片</div>
          </div>
          <!-- 图片删除按钮 -->
          <div v-if="imagePreviewUrl" class="delete-image-button" @click.stop="removeImage">
            <span class="delete-icon">—</span>
          </div>
        </div>
        <div class="upload-tips">图片建议尺寸比例 3:2，大小不超过3MB</div>
      </div>

      <!-- 表单区域 -->
      <div class="form-section">
        <!-- 话题类别选择器 -->
        <div class="form-item">
          <label class="form-label">话题类别为：</label>
          <div class="custom-select-wrapper">
            <div 
              class="custom-select-trigger" 
              @click="toggleSelect"
              :class="{ 'active': isSelectOpen }"
            >
              <span class="select-text">{{ selectedAreaText || '请选择话题类别' }}</span>
              <span class="select-arrow">▼</span>
            </div>
            <div 
              class="custom-options" 
              v-show="isSelectOpen"
              @click.stop
            >
              <div 
                v-for="area in areaList" 
                :key="area.id"
                class="custom-option"
                :class="{ 'selected': formData.areaId === area.id }"
                @click="selectArea(area)"
              >
                {{ area.description }}
              </div>
            </div>
          </div>
          <!-- 调试信息 -->
          <div v-if="areaList.length === 0" style="color: red; font-size: 12px; margin-top: 5px;">
            正在加载话题类别...
          </div>
          <div v-else style="color: green; font-size: 12px; margin-top: 5px;">
            已加载 {{ areaList.length }} 个话题类别，当前选择: {{ formData.areaId }}
          </div>
        </div>
        
        <!-- 话题名称输入 -->
        <div class="form-item">
          <label class="form-label">话题名称</label>
          <input 
            v-model="formData.title" 
            type="text" 
            class="form-input" 
            placeholder="请输入话题名称（20字以内）"
            maxlength="20"
          >
          <div class="char-count" :class="{ 'error': formData.title.length === 0 && isSubmitted }">
            {{ formData.title.length }}/20
          </div>
        </div>

        <!-- 话题简介输入 -->
        <div class="form-item">
          <label class="form-label">话题简介</label>
          <textarea 
            v-model="formData.description" 
            class="form-textarea" 
            placeholder="请输入话题简介（200字以内）"
            maxlength="200"
            rows="4"
          ></textarea>
          <div class="char-count" :class="{ 'error': formData.description.length === 0 && isSubmitted }">
            {{ formData.description.length }}/200
          </div>
        </div>
      </div>
    </div>

    <!-- 底部提交按钮 -->
    <div class="bottom-actions">
      <button 
        class="submit-button" 
        @click="submitTopic"
        :disabled="isLoading"
      >
        <span v-if="!isLoading">创建话题</span>
        <span v-else class="loading"></span>
      </button>
    </div>

    <!-- 隐藏的文件输入 -->
    <input 
      ref="fileInput" 
      type="file" 
      accept="image/*" 
      style="display: none" 
      @change="handleFileUpload"
    >
    
    <!-- 错误提示弹窗 -->
    <div v-if="showErrorDialog" class="error-dialog-overlay" @click="closeErrorDialog">
      <div class="error-dialog-content" @click.stop>
        <div class="error-dialog-title">错误提示</div>
        <div class="error-dialog-message">{{ errorMessage }}</div>
        <div class="error-dialog-button" @click="closeErrorDialog">确定</div>
      </div>
    </div>
    
    <!-- 提交成功弹窗 -->
    <div v-if="showSuccessDialogVisible" class="success-dialog-overlay" @click="closeSuccessDialog">
      <div class="success-dialog-content" @click.stop>
        <div class="success-dialog-icon">✓</div>
        <div class="success-dialog-message">提交成功，正在审核中...</div>
        <div class="success-dialog-button" @click="closeSuccessDialog">确定</div>
      </div>
    </div>
    
    <!-- 图片大小超限弹窗 -->
    <div v-if="showImageSizeErrorDialog" class="image-size-error-dialog-overlay" @click="closeImageSizeErrorDialog">
      <div class="image-size-error-dialog-content" @click.stop>
        <div class="image-size-error-dialog-message">图片超过规定大小</div>
        <div class="image-size-error-dialog-button" @click="closeImageSizeErrorDialog">确定</div>
      </div>
    </div>
  </div>
</template>

<script>
// CreateTopic.vue - 创建话题页面组件
// 功能：允许用户上传图片、输入话题名称和简介，并发布新话题
// 数据交互：需要通过API调用上传图片和创建话题

import { documentApi, topicApi } from '../api/index.js';

export default {
  name: 'CreateTopic',
  data() {
    return {
      // 表单数据
      formData: {
        title: '', // 话题名称
        description: '', // 话题简介
        imageFile: null, // 图片文件
        imageId: null, // 图片ID（从上传接口返回）
        imageUrl: '', // 图片URL（从上传接口返回）
        areaId: '' // 话题类别ID，默认为空（不选择任何选项）
      },
      imagePreviewUrl: '', // 图片预览URL
      isSubmitted: false, // 是否已提交过表单
      isLoading: false, // 是否正在提交
      areaList: [], // 话题类别列表
      showErrorDialog: false, // 是否显示错误弹窗
      errorMessage: '', // 错误信息
      showSuccessDialogVisible: false, // 是否显示提交成功弹窗
      isSelectOpen: false, // 下拉菜单是否展开
      selectedAreaText: '', // 当前选中的类别文本
      showImageSizeErrorDialog: false // 是否显示图片大小超限弹窗
    }
  },
  created() {
    // 页面加载时获取话题类别列表
    this.fetchAreaList();
  },
  methods: {
    // 切换下拉菜单显示状态
    toggleSelect() {
      this.isSelectOpen = !this.isSelectOpen;
      // 如果打开下拉菜单，添加点击外部关闭的监听器
      if (this.isSelectOpen) {
        setTimeout(() => {
          document.addEventListener('click', this.closeSelect);
        }, 10);
      } else {
        document.removeEventListener('click', this.closeSelect);
      }
    },
    
    // 关闭下拉菜单
    closeSelect(event) {
      // 避免点击下拉菜单内部时关闭
      if (!event.target.closest('.custom-select-wrapper')) {
        this.isSelectOpen = false;
        document.removeEventListener('click', this.closeSelect);
      }
    },
    
    // 选择话题类别
    selectArea(area) {
      this.formData.areaId = area.id;
      this.selectedAreaText = area.description;
      this.isSelectOpen = false;
      document.removeEventListener('click', this.closeSelect);
    },
    
    // 获取话题类别列表
    async fetchAreaList() {
      try {
        // 调用获取话题类别API
        // API: GET /topic/area
        // 功能：获取话题类别列表
        const response = await topicApi.getAreaList();
        
        console.log('话题类别API响应:', response);
        
        if (response.hasSuccessed && response.data) {
          this.areaList = response.data;
          console.log('话题类别列表:', this.areaList);
          // 不设置默认值，让用户手动选择
        } else {
          throw new Error(response.message || '获取话题类别失败');
        }
      } catch (error) {
        console.error('获取话题类别失败:', error);
        this.showError('获取话题类别失败，请刷新页面重试');
      }
    },
    
    // 显示错误信息
    showError(message) {
      this.errorMessage = message;
      this.showErrorDialog = true;
    },
    
    // 关闭错误弹窗
    closeErrorDialog() {
      this.showErrorDialog = false;
      this.errorMessage = '';
    },
    
    // 返回上一页
    async goBack() {
      // 如果用户已上传图片但未完成创建就返回，自动删除已上传的图片
      if (this.formData.imageId) {
        try {
          console.log('用户返回上一页，删除已上传的图片，ID:', this.formData.imageId);
          // 调用删除图片API
          // API: DELETE /document/{id}
          // 功能：删除指定ID的图片
          const response = await documentApi.deleteById(this.formData.imageId);
          console.log('删除图片响应:', response);
          
          if (!response.hasSuccessed) {
            throw new Error(response.message || '删除图片失败');
          }
        } catch (error) {
          console.error('删除图片失败:', error);
          // 即使删除失败，也继续返回上一页，不显示错误提示
          // 因为用户可能只是想返回，不关心图片是否删除成功
        }
      }
      
      // 返回上一页
      this.$router.back()
    },
    
    // 触发文件选择
    triggerFileUpload() {
      this.$refs.fileInput.click()
    },
    
    // 删除图片
    async removeImage() {
      // 如果有图片ID，先调用后端API删除图片
      if (this.formData.imageId) {
        try {
          console.log('删除图片，ID:', this.formData.imageId);
          // 调用删除图片API
          // API: DELETE /document/{id}
          // 功能：删除指定ID的图片
          const response = await documentApi.deleteById(this.formData.imageId);
          console.log('删除图片响应:', response);
          
          if (!response.hasSuccessed) {
            throw new Error(response.message || '删除图片失败');
          }
        } catch (error) {
          console.error('删除图片失败:', error);
          this.showError('删除图片失败，请重试');
          return; // 如果删除失败，不继续清除本地数据
        }
      }
      
      // 清除本地图片数据
      this.imagePreviewUrl = '';
      this.formData.imageFile = null;
      this.formData.imageId = null;
      this.formData.imageUrl = ''; // 清除图片URL
      // 清空文件输入，允许重新选择同一文件
      this.$refs.fileInput.value = '';
    },
    
    // 处理文件上传
    handleFileUpload(event) {
      const file = event.target.files[0]
      if (file) {
        // 验证文件大小
        if (file.size > 3 * 1024 * 1024) {
          this.openImageSizeErrorDialog();
          return
        }
        
        // 验证文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
          this.showError('请上传JPG、PNG、GIF或WebP格式的图片');
          return
        }
        
        // 保存文件并生成预览
        this.formData.imageFile = file
        const reader = new FileReader()
        reader.onload = (e) => {
          this.imagePreviewUrl = e.target.result
        }
        reader.readAsDataURL(file)
        
        // 自动上传图片
        this.uploadImage(file)
      }
    },
    
    // 上传图片
    async uploadImage(file) {
      try {
        this.isLoading = true
        // 调用上传图片API
        // API: POST /document/upload/topic
        // 功能：上传话题图片到服务器，返回图片信息
        console.log('开始上传话题图片，文件大小:', file.size, '字节');
        
        const response = await documentApi.uploadTopicImage(file);
        console.log('话题图片上传响应:', response);
        
        if (response.hasSuccessed && response.data) {
          // 保存图片ID，用于后续创建话题
          this.formData.imageId = response.data.id;
          // 保存图片URL，用于提交话题时传递
          this.formData.imageUrl = response.data.url || '';
          console.log('话题图片上传成功，ID:', response.data.id, 'URL:', this.formData.imageUrl);
        } else {
          throw new Error(response.message || '话题图片上传失败');
        }
      } catch (error) {
        console.error('话题图片上传失败:', error);
        // 显示错误弹窗并删除当前上传的图片
        this.showError(error.message || '话题图片上传失败，请重试');
        this.removeImage();
      } finally {
        this.isLoading = false;
      }
    },
    
    // 验证表单
    validateForm() {
      let isValid = true
      
      // 验证话题名称
      if (!this.formData.title.trim()) {
        isValid = false
      }
      
      // 验证话题简介
      if (!this.formData.description.trim()) {
        isValid = false
      }
      
      // 验证话题类别
      if (!this.formData.areaId) {
        isValid = false
      }
      
      // 验证图片（必填）
      if (!this.formData.imageFile || !this.formData.imageId) {
        isValid = false
      }
      
      return isValid
    },
    
    // 提交话题
    async submitTopic() {
      this.isSubmitted = true
      
      // 验证表单
      if (!this.validateForm()) {
        // 显示具体的错误提示
        if (!this.formData.title.trim()) {
          this.showError('请输入话题名称');
          return
        }
        if (!this.formData.description.trim()) {
          this.showError('请输入话题简介');
          return
        }
        if (!this.formData.areaId) {
          this.showError('请选择话题类别');
          return
        }
        if (!this.formData.imageFile) {
          this.showError('请上传话题图片');
          return
        }
        if (!this.formData.imageId) {
          this.showError('图片正在上传中，请稍候或重新上传');
          return
        }
        return
      }
      
      this.isLoading = true
      
      try {
        // 构造话题数据，匹配后端BufferTopic结构
        const topicData = {
          name: this.formData.title.trim(),
          content: this.formData.description.trim(),
          photoId: this.formData.imageId,
          photoUrl: this.formData.imageUrl, // 添加图片URL参数
          areaId: this.formData.areaId
        }
        
        console.log('提交话题数据:', topicData);
        
        // 调用创建话题API
        // API: PUT /topic
        // 功能：创建新的话题
        const response = await topicApi.createTopic(topicData)
        
        console.log('创建话题响应:', response);
        
        if (response.hasSuccessed) {
          // 显示提交成功弹窗
          this.showSuccessDialog();
        } else {
          throw new Error(response.message || '创建话题失败')
        }
        
      } catch (error) {
        console.error('创建话题失败:', error)
        this.showError(error.message || '创建话题失败，请重试')
      } finally {
        this.isLoading = false
      }
    },
    
    // 显示提交成功弹窗
    showSuccessDialog() {
      this.showSuccessDialogVisible = true;
    },
    
    // 关闭提交成功弹窗并返回上一页
    closeSuccessDialog() {
      this.showSuccessDialogVisible = false;
      this.$router.back();
    },
    
    // 显示图片大小超限弹窗
    openImageSizeErrorDialog() {
      this.showImageSizeErrorDialog = true;
    },
    
    // 关闭图片大小超限弹窗
    closeImageSizeErrorDialog() {
      this.showImageSizeErrorDialog = false;
      // 清空文件输入，允许重新选择文件
      this.$refs.fileInput.value = '';
    }
    
  }
}
</script>

<style scoped>
/* 创建话题页面样式 */
.create-topic-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

/* 头部样式 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 15px;
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.back-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.back-arrow {
  font-size: 28px;
  color: #000000;
  font-weight: bold;
}

.title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
}

.placeholder {
  width: 24px;
}

/* 内容区域样式 */
.content {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  position: relative;
  /* 确保下拉菜单不被内容区域裁剪 */
  overflow-x: visible;
}

/* 图片上传区域 */
.image-upload-section {
  margin-bottom: 20px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.image-upload-container {
  width: 100%;
  max-width: 100%;
  height: 180px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #ffffff;
  border: 1px dashed #e0e0e0;
  cursor: pointer;
  position: relative;
  box-sizing: border-box;
}

.image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999999;
}

.upload-icon {
  font-size: 36px;
  font-weight: 300;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
}

.upload-tips {
  font-size: 12px;
  color: #999999;
  margin-top: 8px;
  text-align: center;
}

/* 表单区域样式 */
.form-section {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  width: 100%;
  box-sizing: border-box;
  overflow: visible; /* 修改为visible，确保下拉菜单不被裁剪 */
  position: relative;
}

.form-item {
  margin-bottom: 20px;
  width: 100%;
  box-sizing: border-box;
  overflow: visible; /* 修改为visible，确保下拉菜单不被裁剪 */
  position: relative;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 8px;
}

.form-input, .form-textarea {
  width: 100%;
  max-width: 100%; /* 确保不超出容器宽度 */
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
  outline: none;
  overflow: hidden; /* 防止内容溢出 */
}

.form-input:focus, .form-textarea:focus {
  border-color: #ff3b30;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 自定义下拉菜单样式 */
.custom-select-wrapper {
  width: 100%;
  max-width: 100%;
  position: relative;
  box-sizing: border-box;
}

.custom-select-trigger {
  width: 100%;
  padding: 12px 15px;
  padding-right: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  background-color: #ffffff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  position: relative;
  z-index: 998; /* 降低z-index值，确保不遮挡弹窗 */
}

.custom-select-trigger.active {
  border-color: #ff3b30;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
}

.select-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333333;
}

.select-arrow {
  font-size: 12px;
  color: #666666;
  transition: transform 0.3s ease;
}

.custom-select-trigger.active .select-arrow {
  transform: rotate(180deg);
}

.custom-options {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 200px;
  overflow-y: auto;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-top: none;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  z-index: 997; /* 降低z-index值，确保不遮挡弹窗 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  /* 确保下拉菜单不会超出屏幕 */
  width: 100%;
  box-sizing: border-box;
}

.custom-option {
  padding: 12px 15px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  font-size: 16px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-option:hover {
  background-color: #f5f5f5;
}

.custom-option.selected {
  background-color: #fff0f0;
  color: #ff3b30;
  font-weight: 500;
}

/* 下拉菜单滚动条样式 */
.custom-options::-webkit-scrollbar {
  width: 6px;
}

.custom-options::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.custom-options::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.custom-options::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 确保在小屏幕上正确显示 */
@media (max-width: 768px) {
  .custom-select-wrapper {
    width: 100%;
    max-width: 100%;
  }
  
  .custom-select-trigger,
  .custom-options {
    width: 100%;
    box-sizing: border-box;
  }
}

.category-select:focus {
  border-color: #ff3b30;
}

.char-count {
  font-size: 12px;
  color: #999999;
  text-align: right;
  margin-top: 4px;
}

.char-count.error {
  color: #ff3b30;
}

/* 图片删除按钮 */
.delete-image-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s ease;
}

.delete-image-button:hover {
  background-color: rgba(0, 0, 0, 0.8);
  transform: translate(-50%, -50%) scale(1.1);
}

.delete-icon {
  color: white;
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
}

/* 底部按钮区域 */
.bottom-actions {
  padding: 15px;
  background-color: #ffffff;
  border-top: 1px solid #e0e0e0;
  position: sticky;
  bottom: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.submit-button {
  width: 100%;
  max-width: 100%;
  height: 44px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 22px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  outline: none;
  box-sizing: border-box;
}

.submit-button:active {
  opacity: 0.8;
}

.submit-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 错误提示弹窗 */
.error-dialog-overlay {
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

.error-dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.error-dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 12px;
}

.error-dialog-message {
  font-size: 14px;
  color: #666666;
  margin-bottom: 20px;
  line-height: 1.4;
}

.error-dialog-button {
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.error-dialog-button:hover {
  background-color: #e62e24;
}

/* 提交成功弹窗 */
.success-dialog-overlay {
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

.success-dialog-content {
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

.success-dialog-message {
  font-size: 16px;
  color: #333333;
  margin-bottom: 25px;
  line-height: 1.5;
  font-weight: 500;
}

.success-dialog-button {
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

.success-dialog-button:hover {
  background-color: #e62e24;
}

.success-dialog-button:active {
  background-color: #cc1f16;
}

/* 图片大小超限弹窗 */
.image-size-error-dialog-overlay {
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

.image-size-error-dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  width: 80%;
  max-width: 300px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-size-error-dialog-message {
  font-size: 16px;
  color: #333333;
  margin-bottom: 20px;
  line-height: 1.4;
}

.image-size-error-dialog-button {
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  margin: 0 auto;
  display: block;
  width: 80%;
  max-width: 200px;
}

.image-size-error-dialog-button:hover {
  background-color: #e62e24;
}

/* 响应式设计 - iPhone 12 Pro 竖屏适配 */
@media (max-width: 390px) {
  .header {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .content {
    padding: 12px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    position: relative;
  }
  
  .image-upload-section {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .image-upload-container {
    height: 160px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  .form-section {
    padding: 12px;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
  
  .form-item {
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
  
  .bottom-actions {
    padding: 12px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
  
  /* 下拉框适配iPhone 12 Pro */
  .select-wrapper {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    overflow: hidden;
    position: relative;
  }
  
  .category-select {
    font-size: 15px;
    padding: 10px 12px;
    padding-right: 35px;
    background-size: 18px;
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    position: relative;
    z-index: 1;
  }
  
  /* 提交成功弹窗适配iPhone 12 Pro */
  .success-dialog-content {
    width: 90%;
    padding: 25px 15px;
  }
  
  .success-dialog-icon {
    width: 50px;
    height: 50px;
    font-size: 26px;
    margin-bottom: 15px;
  }
  
  .success-dialog-message {
    font-size: 15px;
    margin-bottom: 20px;
  }
  
  .success-dialog-button {
    padding: 10px 25px;
    font-size: 15px;
  }
  
  .submit-button {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
  }
}
</style>