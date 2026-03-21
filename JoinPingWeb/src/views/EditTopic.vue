<template>
  <div class="edit-topic-container">
    <!-- 顶部标题栏 -->
    <div class="top-bar">
      <div class="back-button" @click="goBack">
        <span>&lt;</span>
      </div>
      <div class="title">修改话题</div>
      <div class="placeholder"></div>
    </div>
    
    <!-- 话题内容区域 -->
    <div class="topic-content">
      <!-- 话题信息块 -->
      <div class="topic-block">
        <!-- 话题标题 -->
        <h1 class="topic-title">{{ topic.title }}</h1>
        
        <!-- 话题图片和简介 - 三七分布局 -->
        <div class="topic-details">
          <!-- 话题图片容器 - 占据30%宽度 -->
          <div class="topic-image-container">
            <img v-if="topic.imageUrl" :src="getFullImageUrl(topic.imageUrl)" :alt="topic.title" class="topic-image">
          </div>
          
          <!-- 话题简介 - 占据70%宽度 -->
          <div class="topic-description">
            <p :class="{ 'expanded': isDescriptionExpanded }">
              {{ getTopicDescription }}
              <span 
                v-if="needExpandButton()" 
                class="expand-link" 
                @click="toggleDescription"
              >
                {{ isDescriptionExpanded ? ' 收起' : ' 展开' }}
              </span>
            </p>
          </div>
        </div>
        
        <!-- 创建时间 -->
        <div class="create-time">
          {{ formatDate(topic.createTime) }}
        </div>
      </div>
      
      <!-- 主体列表区域 - 内层滚动容器 -->
      <div class="subjects-section" ref="subjectsSection">
        <div class="section-header">
          <span class="section-title">相关主体</span>
          <div class="header-actions">
            <!-- 新增主体按钮 -->
            <button class="add-subject-btn" @click="showAddSubjectDialog">
              <span class="plus-icon">+</span>
              新增主体
            </button>
          </div>
        </div>
        
        <!-- 主体列表 - 可滚动区域 -->
        <div class="subject-list-container">
          <div class="subject-list">
            <div 
              v-for="subject in allSubjects" 
              :key="subject.id || subject.tempId" 
              class="subject-item"
            >
              
              <!-- 删除按钮 - 右上角 -->
              <div class="delete-button" @click.stop="showDeleteConfirmDialog(subject)">
                ×
              </div>
              
              <!-- 主体名称 -->
              <div class="subject-name">
                {{ subject.name }}
              </div>
              
              <!-- 主体图片和评分信息 -->
              <div class="subject-info">
                <!-- 主体图片 -->
                <div class="subject-image-container">
                  <img v-if="subject.imageUrl" :src="getFullThingImageUrl(subject.imageUrl)" :alt="subject.name" class="subject-image">
                </div>
                
                <!-- 评分信息 - 上下平分 -->
                <div class="rating-info">
                  <div class="rating-score">评分: {{ subject.rating || 0 }}</div>
                  <div class="rating-count">{{ subject.ratingCount || 0 }}人参评</div>
                </div>
              </div>
            </div>
            
            <!-- 加载更多 -->
            <div v-if="loading" class="loading">加载中...</div>
            <div v-if="!loading && allSubjects.length === 0" class="empty">暂无相关主体</div>
          </div>
        </div>
        
        <!-- 分页器 - 固定在底部 -->
        <div class="pagination-container" v-if="total > 0">
          <Pagination 
            :current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 新建主体弹窗 -->
    <div v-if="showAddDialog" class="dialog-overlay" @click="closeAddSubjectDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">新建主体</div>
        
        <!-- 图片上传区域 -->
        <div class="image-upload-section">
          <div class="upload-label">主体图片</div>
          <div class="image-upload-container" @click="triggerFileUpload">
            <img v-if="newSubject.imageUrl" :src="newSubject.imageUrl" class="uploaded-image" />
            <div v-else class="upload-placeholder">
              <span class="upload-icon">📷</span>
              <span class="upload-text">点击上传图片</span>
            </div>
            <!-- 图片删除按钮 - 显示在图片中央 -->
            <div v-if="newSubject.imageUrl" class="delete-image-button" @click.stop.prevent="removeImage">
              <span class="delete-icon">—</span>
            </div>
          </div>
          <input 
            ref="fileInput" 
            type="file" 
            accept="image/*" 
            style="display: none" 
            @change="handleImageUpload"
          />
          <div class="upload-tips">图片建议尺寸比例 3:2，大小不超过3MB</div>
        </div>
        
        <!-- 主体名称输入 -->
        <div class="name-input-section">
          <div class="input-label">主体名称</div>
          <input 
            v-model="newSubject.name" 
            class="name-input" 
            placeholder="请输入主体名称（15字以内）" 
            maxlength="15"
          />
          <div class="char-count">{{ newSubject.name.length }}/15</div>
        </div>
        
        <!-- 操作按钮 -->
        <div class="dialog-buttons">
          <div class="cancel-button" @click="closeAddSubjectDialog">取消</div>
          <div 
            class="confirm-button" 
            :class="{ 'disabled': !isFormValid }" 
            @click="confirmAddSubject"
          >
            确定
          </div>
        </div>
      </div>
    </div>
    
    <!-- 图片大小超限弹窗 -->
    <div v-if="showImageSizeErrorDialog" class="image-size-error-dialog-overlay" @click="closeImageSizeErrorDialog">
      <div class="image-size-error-dialog-content" @click.stop>
        <div class="image-size-error-dialog-icon">⚠️</div>
        <div class="image-size-error-dialog-title">图片大小超限</div>
        <div class="image-size-error-dialog-message">您选择的图片大小超过3MB限制，请选择小于3MB的图片。</div>
        <div class="image-size-error-dialog-button" @click="closeImageSizeErrorDialog">确定</div>
      </div>
    </div>
      
    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="closeDeleteConfirmDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">删除确认</div>
        <div class="delete-confirm-text">确定要删除主体"{{ subjectToDelete ? subjectToDelete.name : '' }}"吗？</div>
        <div class="dialog-buttons">
          <div class="cancel-button" @click="closeDeleteConfirmDialog">取消</div>
          <div class="confirm-delete-button" @click="confirmDelete">确定</div>
        </div>
      </div>
    </div>
    
    <!-- 主体添加成功弹窗 -->
    <div v-if="showSuccessDialog" class="success-dialog-overlay" @click="closeSuccessDialog">
      <div class="success-dialog-content" @click.stop>
        <div class="success-dialog-icon">✓</div>
        <div class="success-dialog-message">{{ isDeleteOperation ? '删除成功' : '添加成功' }}</div>
        <div class="success-dialog-button" @click="closeSuccessDialog">确定</div>
      </div>
    </div>

    <!-- 正在审核中弹窗 -->
    <div v-if="showReviewDialog" class="success-dialog-overlay" @click="showReviewDialog = false">
      <div class="success-dialog-content" @click.stop>
        <div class="success-dialog-icon">⏳</div>
        <div class="success-dialog-message">正在审核中...</div>
        <div class="success-dialog-button" @click="showReviewDialog = false">确定</div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * EditTopic.vue - 修改话题页面
 * 功能：展示话题详情、管理相关主体（添加/删除）
 * 设计要点：
 * 1. 顶部红色固定栏
 * 2. 话题详情（标题、图片、简介三七分布局）
 * 3. 简介可展开/收起
 * 4. 主体列表展示，每个主体右上角有删除按钮
 * 5. 底部有圆形蓝底白色加号块，用于新建主体
 * 6. 新建主体弹窗，支持图片上传和名称输入
 */

import { topicApi, documentApi, subjectApi } from '../api/index.js'
import { formatDate } from '../utils/date.js'
import Pagination from '@/components/Pagination.vue'
import request from '@/utils/request' // 新增：导入request用于直接调用API

export default {
  name: 'EditTopic',
  components: {
    Pagination
  },
  data() {
    return {
      topicId: null,
      topic: {
        id: '',
        title: '',
        description: '',
        imageUrl: '',
        createTime: ''
      },
      subjects: [], // 已有主体列表（从后端获取）
      tempSubjects: [], // 新创建但未提交的主体列表（临时存储在前端）
      isDescriptionExpanded: false,
      showAddDialog: false,
      newSubject: {
        name: '',
        imageUrl: '',
        imageId: null
      },
      showDeleteDialog: false,
      subjectToDelete: null,
      showImageSizeErrorDialog: false,
      showSuccessDialog: false,
      isDeleteOperation: false,
      showReviewDialog: false, // 新增：正在审核中弹窗状态
      // 分页相关数据
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  computed: {
    // 获取话题简介内容（统一逻辑：超过80字截断为三行）
    // 功能：根据展开状态返回完整内容或截断内容
    // 统一标准：与评论组件保持一致，使用80字符截断标准
    getTopicDescription() {
      if (!this.topic.description) return ''
      
      // 如果内容需要截断且未展开，则截断到80字
      if (this.needExpandButton() && !this.isDescriptionExpanded) {
        // 获取纯文本内容进行截断
        const plainText = this.topic.description.replace(/<[^>]*>/g, '').trim()
        const truncatedText = plainText.substring(0, 80) + '...'
        return truncatedText
      }
      
      return this.topic.description
    },
    // 表单验证：图片和名称都是必填项
    isFormValid() {
      return this.newSubject.name.trim() !== '' && 
             this.newSubject.imageUrl !== '' && 
             this.newSubject.imageId !== null
    },
    // 合并已有主体和临时主体，用于显示
    allSubjects() {
      // 已有主体有id字段，临时主体没有id字段但有tempId字段
      return [...this.subjects, ...this.tempSubjects];
    }
  },
  mounted() {
    // 从路由参数获取话题ID
    this.topicId = this.$route.params.id
    if (this.topicId) {
      this.fetchTopicData()
    }
    
    // 移除页面退出前的监听器 - 不再自动提交
    // window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  
  beforeDestroy() {
    // 组件销毁前移除事件监听器
    // window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  methods: {
    // 获取完整的图片URL
    getFullImageUrl(imageUrl) {
      if (!imageUrl) return '';
      // 直接拼接固定IP+端口号，确保不会出现双斜杠
      // 如果imageUrl已经以/开头，则去掉开头的斜杠
      const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      return `http://localhost:8080/${cleanImageUrl}`;
    },
    
    // 获取主体图片URL
    getFullThingImageUrl(imageUrl) {
      if (!imageUrl) return '';
      // 直接拼接固定IP+端口号，确保不会出现双斜杠
      // 如果imageUrl已经以/开头，则去掉开头的斜杠
      const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      return `http://localhost:8080/${cleanImageUrl}`;
    },
    
    // 返回上一页 - 已在后面重新定义
    // goBack() {
    //   this.$router.back()
    // },
    
    // 判断是否需要显示展开按钮（统一逻辑：超过80字显示展开按钮）
    // 功能：根据话题简介内容长度判断是否需要展开/收起功能
    // 统一标准：与评论组件保持一致，使用80字符判断标准
    needExpandButton() {
      if (!this.topic.description) return false
      
      // 获取纯文本内容（排除HTML标签）
      const plainText = this.topic.description.replace(/<[^>]*>/g, '').trim()
      
      // 简单判断：超过80字符就显示展开按钮
      return plainText.length > 80
    },
    
    // 切换简介展开状态
    toggleDescription() {
      this.isDescriptionExpanded = !this.isDescriptionExpanded
    },
    
    // 格式化日期
    formatDate(dateString) {
      return formatDate(dateString)
    },
    

    
    // 获取话题数据
    // API: GET /topic/{id} - 调用TopicController的get方法
    // 功能：获取话题详情（不包含主体列表）
    async fetchTopicData() {
      try {
        this.loading = true;
        
        // 并发请求：话题信息（修改话题页不需要用户状态）
        const [topicResponse] = await Promise.all([
          topicApi.getTopicDetail(this.topicId) // 调用TopicController的get方法
        ]);
        
        // 处理话题信息
        if (topicResponse.hasSuccessed && topicResponse.data) {
          // 映射后端字段到前端字段
          this.topic = {
            id: topicResponse.data.id,
            title: topicResponse.data.name, // 后端返回的是name字段，前端需要的是title字段
            description: topicResponse.data.content, // 后端返回的是content字段，前端需要的是description字段
            imageUrl: topicResponse.data.photoUrl, // 后端返回的是photoUrl字段，前端需要的是imageUrl字段
            createTime: topicResponse.data.createTime
          };
        } else {
          throw new Error(topicResponse?.message || '获取话题信息失败');
        }
        
        // 获取主体列表（第二次请求）
        await this.fetchSubjectsData();
        
      } catch (error) {
        console.error('获取话题详情失败:', error);
        this.$toast('获取话题详情失败');
        
        // 使用模拟数据
        this.useMockData();
      } finally {
        this.loading = false;
      }
    },
    
    // 获取主体列表数据（单独分页请求）
    // API: GET /thing?pageNum={pageNum}&pageSize={pageSize}&id={topicId} - 调用ThingController的selectPage方法
    // 功能：获取话题相关的主体列表，支持分页
    async fetchSubjectsData() {
      try {
        this.loading = true;
        
        // 清空临时主体列表，确保每次查询都从后端获取最新数据
        this.tempSubjects = [];
        
        // 使用subjectApi.getSubjectList方法调用后端/thing接口（ThingController的selectPage方法）
        const response = await subjectApi.getSubjectList(this.currentPage, this.pageSize, this.topicId);
        
        if (response.hasSuccessed && response.data) {
          // 处理主体数据
          this.subjects = response.data.list.map((item) => ({
            id: item.id,
            name: item.name,
            imageUrl: item.photoUrl, // 后端返回的是photoUrl字段
            rating: item.rating || 0,
            ratingCount: item.ratingCount || 0
          }));
          
          // 更新分页信息
          this.total = response.data.total || 0;
          
          console.log('分页查询成功，当前页:', this.currentPage, '页大小:', this.pageSize, '总数:', this.total);
        } else {
          throw new Error(response?.message || '获取主体列表失败');
        }
      } catch (error) {
        console.error('获取主体列表失败:', error);
        this.$toast('获取主体列表失败');
        
        // 使用模拟主体数据
        this.subjects = [
          {
            id: '1',
            name: '正宗沙县小吃',
            imageUrl: '/shop1.jpg',
            rating: 9.9,
            ratingCount: 2345
          },
          {
            id: '2',
            name: '老字号沙县拌面',
            imageUrl: '/shop2.jpg',
            rating: 9.7,
            ratingCount: 1892
          },
          {
            id: '3',
            name: '福建沙县小吃王',
            imageUrl: '/shop3.jpg',
            rating: 9.5,
            ratingCount: 1567
          }
        ];
        
        this.total = 3;
      } finally {
        this.loading = false;
      }
    },
    
    // 显示新建主体弹窗
    showAddSubjectDialog() {
      this.showAddDialog = true
      // 重置表单数据
      this.newSubject = {
        name: '',
        imageUrl: '',
        imageId: null
      }
    },
    
    // 关闭新建主体弹窗 - 只在取消时删除图片
    async closeAddSubjectDialog() {
      // 如果有已上传的图片，先删除图片
      if (this.newSubject.imageId) {
        try {
          console.log('关闭弹窗，删除已上传的图片，ID:', this.newSubject.imageId);
          // 调用删除图片API
          // API: DELETE /document/{id}
          // 功能：删除指定ID的图片
          const response = await documentApi.deleteById(this.newSubject.imageId);
          console.log('删除图片响应:', response);
          
          if (!response.hasSuccessed) {
            throw new Error(response.message || '删除图片失败');
          }
        } catch (error) {
          console.error('删除图片失败:', error);
          // 即使删除失败，也继续关闭弹窗，不显示错误提示
          // 因为用户可能只是想关闭弹窗，不关心图片是否删除成功
        }
      }
      
      this.showAddDialog = false
      
      // 重置表单数据
      this.newSubject = {
        name: '',
        imageUrl: '',
        imageId: null
      }
      
      // 清空文件输入，允许重新选择同一文件
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    // 关闭新建主体弹窗 - 保存成功后调用，不删除图片
    closeAddSubjectDialogAfterSave() {
      this.showAddDialog = false
      
      // 重置表单数据
      this.newSubject = {
        name: '',
        imageUrl: '',
        imageId: null
      }
      
      // 清空文件输入，允许重新选择同一文件
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    // 显示图片大小超限弹窗
    openImageSizeErrorDialog() {
      this.showImageSizeErrorDialog = true;
    },
    
    // 关闭图片大小超限弹窗
    closeImageSizeErrorDialog() {
      this.showImageSizeErrorDialog = false;
      // 清空文件输入，允许重新选择文件
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
    },
    
    // 关闭成功弹窗
    closeSuccessDialog() {
      this.showSuccessDialog = false;
      // 重置操作类型标记
      this.isDeleteOperation = false;
    },
    
    // 分页相关方法
    handlePageChange(page) {
      this.currentPage = page;
      this.fetchSubjectsData();
    },
    
    handlePageSizeChange(size) {
      this.pageSize = size;
      this.currentPage = 1;
      this.fetchSubjectsData();
    },
    
    // 使用模拟数据
    useMockData() {
      this.topic = {
        id: this.topicId,
        title: '沙县小吃',
        description: '沙县小吃是福建沙县的传统美食，以其品种繁多、风味独特和经济实惠而著称。主要品种有拌面、扁肉、烧麦、蒸饺、烤鸭等，其中拌面和扁肉被称为沙县小吃的"当家花旦"。沙县小吃不仅在福建广为流传，在全国各地都有其身影，甚至已经走出国门，在美国、日本等国家开设分店。作为中国传统美食的代表之一，沙县小吃已经成为了中华饮食文化的重要组成部分。',
        imageUrl: 'http://localhost:8080/image/shaxian.jpg',
        createTime: '2023-06-15T10:30:00'
      };

      this.subjects = [
        {
          id: '1',
          name: '正宗沙县小吃',
          imageUrl: '/shop1.jpg',
          rating: 9.9,
          ratingCount: 2345
        },
        {
          id: '2',
          name: '老字号沙县拌面',
          imageUrl: '/shop2.jpg',
          rating: 9.7,
          ratingCount: 1892
        },
        {
          id: '3',
          name: '福建沙县小吃王',
          imageUrl: '/shop3.jpg',
          rating: 9.5,
          ratingCount: 1567
        }
      ];
      
      this.total = 3;
    },
    
    // 触发文件上传
    triggerFileUpload() {
      console.log('triggerFileUpload方法被调用');
      console.log('fileInput ref:', this.$refs.fileInput);
      
      if (this.$refs.fileInput) {
        console.log('触发文件选择');
        this.$refs.fileInput.click();
      } else {
        console.error('fileInput ref不存在');
      }
    },
    
    // 处理图片上传
    // API: POST /document/upload/topic
    // 功能：上传主体图片，获取imageId和imageUrl
    async handleImageUpload(event) {
      const file = event.target.files[0]
      if (file) {
        // 验证文件大小 - 3MB限制
        const maxSize = 3 * 1024 * 1024; // 3MB
        if (file.size > maxSize) {
          // 显示图片大小超限弹窗
          this.openImageSizeErrorDialog();
          // 清空文件输入，允许重新选择文件
          event.target.value = '';
          return;
        }
        
        // 验证文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!validTypes.includes(file.type)) {
          // TODO: 显示错误弹窗
          console.error('请上传JPG、PNG、GIF或WebP格式的图片');
          // 清空文件输入，允许重新选择文件
          event.target.value = '';
          return;
        }
        
        // 先显示本地预览，使用FileReader
        const reader = new FileReader()
        reader.onload = (e) => {
          this.newSubject.imageUrl = e.target.result
        }
        reader.readAsDataURL(file)
        
        // 等待图片上传完成
        await this.uploadImage(file)
      }
    },
    
    // 上传图片
    async uploadImage(file) {
      try {
        // 调用上传图片API
        // API: POST /document/upload/thing
        // 功能：上传主体图片到服务器，返回图片信息
        console.log('开始上传主体图片，文件大小:', file.size, '字节');
        
        const response = await documentApi.uploadThingImage(file);
        console.log('主体图片上传响应:', response);
        
        if (response.hasSuccessed && response.data) {
          // 保存图片ID，用于后续创建主体
          this.newSubject.imageId = response.data.id;
          // 保存图片URL，用于提交主体时传递
          this.newSubject.imageUrl = response.data.url || '';
          console.log('主体图片上传成功，ID:', response.data.id, 'URL:', this.newSubject.imageUrl);
        } else {
          throw new Error(response.message || '主体图片上传失败');
        }
      } catch (error) {
        console.error('主体图片上传失败:', error);
        // 显示错误弹窗并删除当前上传的图片
        alert('图片上传失败: ' + (error.message || '未知错误'));
        this.removeImage();
      }
    },
    
    // 删除图片
    // API: DELETE /document/{id}
    // 功能：根据图片ID删除服务器上的图片
    async removeImage() {
      console.log('removeImage方法被调用');
      console.log('当前图片ID:', this.newSubject.imageId);
      console.log('当前图片URL:', this.newSubject.imageUrl);
      
      // 如果图片ID，则调用后端删除接口
      if (this.newSubject.imageId) {
        try {
          console.log('准备调用documentApi.deleteById，图片ID:', this.newSubject.imageId);
          // 调用documentApi的deleteById方法删除服务器上的图片
          // RESTful风格接口：DELETE /document/{id}
          const response = await documentApi.deleteById(this.newSubject.imageId);
          console.log('图片删除API响应:', response);
          console.log('图片删除成功，ID:', this.newSubject.imageId);
        } catch (error) {
          console.error('删除服务器图片失败:', error);
          console.error('错误详情:', error.response || error.message);
          // 即使删除失败，也继续清空本地图片信息
        }
      } else {
        console.log('没有图片ID，跳过服务器删除操作');
      }
      
      // 清空本地图片信息
      this.newSubject.imageUrl = '';
      this.newSubject.imageId = null;
      // 清空文件输入，允许重新选择同一文件
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
      console.log('本地图片信息已清空');
    },
    
    // 添加新主体 - 修改为立即调用ThingController的insert方法
    // 功能：点击确定后直接调用后端API，显示审核中弹窗，保持页面不变
    async addSubject() {
      if (!this.isFormValid) return
      
      try {
        // 构建BufferThing对象，符合后端ThingController.insert方法的要求
        const bufferThing = {
          topicId: this.topicId, // 所属话题ID
          name: this.newSubject.name.trim(), // 主体名称
          photoId: this.newSubject.imageId, // 图片ID
          photoUrl: this.newSubject.imageUrl, // 图片URL
          score: 0, // 初始评分为0
          customerNum: 0, // 初始评分为0人数
          commentSum: 0 // 初始评论数为0
        };
        
        console.log('准备调用ThingController.insert方法，数据:', bufferThing);
        
        // 调用ThingController的insert方法
        // API: PUT /thing (ThingController.insert方法)
        const response = await this.callThingInsert(bufferThing);
        
        if (response.hasSuccessed) {
          console.log('新增主体成功，正在审核中...');
          
          // 显示"正在审核中..."弹窗
          this.showReviewDialog = true;
          
          // 关闭新建主体弹窗
          this.closeAddSubjectDialogAfterSave();
          
          // 保持页面不变，不刷新主体列表
        } else {
          throw new Error(response.message || '新增主体失败');
        }
      } catch (error) {
        console.error('新增主体失败:', error);
        this.$toast('新增主体失败: ' + (error.message || '未知错误'));
      }
    },
    
    // 调用ThingController.insert方法
    // API: PUT /thing
    callThingInsert(bufferThing) {
      return request({
        url: '/thing',
        method: 'put',
        data: bufferThing
      });
    },
    
    // 确认添加主体 - 模板中引用的方法
    confirmAddSubject() {
      this.addSubject();
    },
    
    // 删除主体 - 修改为立即调用ThingController的delete方法
    // 功能：点击红叉叉后调用后端API删除主体，并在页面中删除该块
    async deleteSubject(subject) {
      try {
        // 判断是已有主体还是临时主体
        if (subject.id) {
          // 已有主体：调用ThingController.delete方法
          console.log('准备删除已有主体，ID:', subject.id);
          
          // 调用ThingController的delete方法
          // API: DELETE /thing/{id}
          const response = await this.callThingDelete(subject.id);
          
          if (response.hasSuccessed) {
            console.log('删除主体成功');
            
            // 从页面中删除该主体块
            this.deleteExistingSubject(subject);
            
            // 显示成功提示
            this.$toast('删除成功');
          } else {
            throw new Error(response.message || '删除主体失败');
          }
        } else {
          // 临时主体：直接删除
          this.deleteTempSubject(subject);
        }
      } catch (error) {
        console.error('删除主体失败:', error);
        this.$toast('删除失败: ' + (error.message || '未知错误'));
      }
    },
    
    // 调用ThingController.delete方法
    // API: DELETE /thing/{id}
    callThingDelete(subjectId) {
      return request({
        url: `/thing/${subjectId}`,
        method: 'delete'
      });
    },
    
    // 显示删除确认弹窗
    showDeleteConfirmDialog(subject) {
      this.subjectToDelete = subject
      this.showDeleteDialog = true
    },
    
    // 关闭删除确认弹窗
    closeDeleteConfirmDialog() {
      this.showDeleteDialog = false
      this.subjectToDelete = null
    },
    
    // 删除已有主体（从subjects数组中移除）
    deleteExistingSubject(subject) {
      // 从subjects数组中过滤掉要删除的主体
      this.subjects = this.subjects.filter(item => item.id !== subject.id);
      console.log('已从页面删除主体:', subject.name);
    },
    
    // 删除临时主体
    deleteTempSubject(subject) {
      // 从tempSubjects数组中过滤掉要删除的主体
      this.tempSubjects = this.tempSubjects.filter(item => item.tempId !== subject.tempId);
      
      // 如果临时主体有图片，需要调用documentApi.deleteById删除服务器上的图片
      if (subject.imageId) {
        documentApi.deleteById(subject.imageId).catch(error => {
          console.error('删除临时主体图片失败:', error);
        });
      }
      
      console.log('已从页面删除临时主体:', subject.name);
    },
    
    // 完成删除临时主体（显示成功弹窗）
    finishDeleteTempSubject(subject) {
      this.deleteTempSubject(subject);
      this.showSuccessDialog = true;
      this.isDeleteOperation = true;
    },
    
    // 确认删除
    confirmDelete() {
      if (this.subjectToDelete) {
        this.deleteSubject(this.subjectToDelete)
        this.closeDeleteConfirmDialog()
      }
    },
    
    // 处理页面退出前的操作
    // 功能：在页面退出前提交所有主体变化（包括新增和删除）
    handleBeforeUnload(event) {
      // 无论是否有临时主体，只要主体列表可能发生变化，就提交数据
      // 这样确保即使删除了所有主体，后端也能收到空列表
      this.submitAllSubjects();
    },
    
    // 提交所有主体到后端（包括新增和删除的）
    // API: POST /thing
    // 功能：将当前主体状态提交到后端，确保后端收到最新的主体列表
    submitAllSubjects() {
      // 将临时主体转换为API需要的格式
      const newSubjectsData = this.tempSubjects.map(tempSubject => ({
        topicId: this.topicId, // 所属话题ID
        name: tempSubject.name, // 主体名称
        photoId: tempSubject.imageId, // 图片ID
        photoUrl: tempSubject.imageUrl, // 图片URL
        score: 0, // 初始评分为0
        customerNum: 0, // 初始评分为0人数
        commentSum: 0 // 初始评论数为0
      }));
      
      // 已有主体只需要包含必要的字段（id, topicId, name）
      const existingSubjectsData = this.subjects.map(subject => ({
        id: subject.id, // 已有主体的ID
        topicId: this.topicId, // 所属话题ID
        name: subject.name // 主体名称
      }));
      
      // 将新主体和已有主体合并到一个数组中
      const allSubjects = [...newSubjectsData, ...existingSubjectsData];
      
      console.log('提交所有主体，新主体数据:', newSubjectsData);
      console.log('已有主体数据:', existingSubjectsData);
      console.log('发送的主体数据:', allSubjects);
      
      // 使用API模块中的addSubject方法提交
      // 即使allSubjects为空数组，也要发送，确保后端收到空列表而不是null
      return subjectApi.addSubject(allSubjects, this.topicId)
        .then(response => {
          console.log('提交所有主体响应:', response);
          if (response.hasSuccessed) {
            console.log('主体提交成功');
          } else {
            console.error('主体提交失败:', response.message);
          }
        })
        .catch(error => {
          console.error('主体提交出错:', error);
        });
    },
    
    // 提交临时主体到后端 - 保留原方法以兼容可能的调用
    submitTempSubjects() {
      return this.submitAllSubjects();
    },
    
    // 修改返回上一页方法，在返回前提交主体变化
    goBack() {
      // 提交所有主体变化（包括新增和删除）
      this.submitAllSubjects()
        .then(() => {
          this.$router.back();
        })
        .catch(error => {
          console.error('提交主体变化失败:', error);
          // 即使提交失败，也允许返回上一页
          this.$router.back();
        });
    }
  }
}
</script>

<style scoped>
/* 修改话题页面容器 */
.edit-topic-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  /* 适配iPhone刘海屏 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

/* 顶部标题栏 */
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #ff3b30;
  color: white;
  padding: 0 15px;
  flex-shrink: 0;
}

.back-button {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
}

.title {
  font-size: 18px;
  font-weight: 600;
}

.placeholder {
  width: 50px;
}

/* 话题内容区域 */
.topic-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0 0 0;
}

/* 话题信息块 */
.topic-block {
  background-color: #ffffff;
  padding: 16px;
  margin-bottom: 12px;
}

/* 话题标题 */
.topic-title {
  font-size: 20px;
  font-weight: bold;
  color: #000000;
  margin: 0 0 12px 0;
}

/* 话题图片和简介 - 三七分布局 */
.topic-details {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

/* 话题图片容器 - 占据30%宽度 */
.topic-image-container {
  width: 30%;
  flex-shrink: 0;
}

/* 话题图片 */
.topic-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #cccccc; /* 添加灰边描边 */
}

/* 话题简介 - 占据70%宽度 */
.topic-description {
  width: 70%;
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
}

/* 展开链接 */
.expand-link {
  color: #ff3b30;
  cursor: pointer;
}

/* 创建时间 */
.create-time {
  font-size: 12px;
  color: #999999;
  text-align: right;
}

/* 主体列表区域 - 内层滚动容器 */
.subjects-section {
  background-color: #ffffff;
  padding: 0 15px 15px;
  margin-top: 10px;
  /* 计算内层容器高度：100vh - 顶部栏高度 - 话题信息块高度 */
  height: calc(100vh - 44px - 160px);
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  height: 40px; /* 调整到合适的高度 */
}

/* 区域标题 */
.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
  padding: 0;
  border-bottom: none;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* 高亮效果 */
.highlight {
  box-shadow: 0 0 0 2px #ff6b35;
  transform: scale(1.02);
  transition: all 0.3s ease;
}

/* 主体列表 - 可滚动区域 */
.subject-list-container {
  flex: 1;
  overflow-y: auto;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

/* 主体列表 */
.subject-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 15px;
}

/* 主体项 */
.subject-item {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px; /* 增加底部间距 */
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); /* 增强阴影效果 */
  position: relative;
  overflow: hidden;
  border: 1px solid #dddddd; /* 使用更深的边框颜色 */
  border-bottom: 3px solid #cccccc; /* 底部边框加粗，增强分隔效果 */
}

/* 最后一个主体项 */
.subject-item:last-child {
  margin-bottom: 0;
}

/* 删除按钮 */
.delete-button {
  position: absolute;
  top: 5px;
  right: 5px;
  width: 24px;
  height: 24px;
  background-color: rgba(255, 59, 48, 0.8);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  z-index: 10;
}

/* 主体名称 */
.subject-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
  color: #000000;
  margin-bottom: 12px;
}

/* 主体图片和评分信息 */
.subject-info {
  display: flex;
  gap: 12px;
}

/* 主体图片容器 */
.subject-image-container {
  width: 80px;
  height: 80px;
  flex-shrink: 0;
}

/* 主体图片 */
.subject-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #cccccc; /* 添加灰边描边 */
}

/* 评分信息 */
.rating-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4px 0;
}

/* 评分分数 */
.rating-score {
  font-size: 18px;
  font-weight: bold;
  color: #FF6600;
  text-align: center;
  margin-bottom: 8px;
}

/* 评分人数 */
.rating-count {
  font-size: 16px;
  color: #999999;
  text-align: center;
}

/* 新增主体按钮 */
.add-subject-btn {
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  transition: background-color 0.2s ease;
}

.add-subject-btn:hover {
  background-color: #0056cc;
}

.add-subject-btn:active {
  background-color: #004499;
}

/* 加号图标 */
.plus-icon {
  font-size: 16px;
  font-weight: 300;
}

/* 弹窗遮罩层 */
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

/* 弹窗内容 */
.dialog-content {
  width: 80%;
  max-width: 320px;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
}

/* 弹窗标题 */
.dialog-title {
  font-size: 18px;
  font-weight: bold;
  color: #000000;
  text-align: center;
  margin-bottom: 20px;
}

/* 图片上传区域 */
.image-upload-section {
  margin-bottom: 20px;
}

/* 上传标签 */
.upload-label {
  font-size: 14px;
  color: #333333;
  margin-bottom: 8px;
}

/* 图片上传容器 */
.image-upload-container {
  width: 100%;
  height: 120px;
  border: 1px dashed #cccccc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  position: relative;
}

/* 已上传图片 */
.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 上传占位符 */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999999;
}

/* 上传图标 */
.upload-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

/* 上传文字 */
.upload-text {
  font-size: 14px;
}

/* 上传提示 */
.upload-tips {
  font-size: 12px;
  color: #999999;
  margin-top: 8px;
  text-align: center;
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
  z-index: 999;
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

/* 主体名称输入 -->
.name-input-section {
  margin-bottom: 20px;
}

/* 输入标签 */
.input-label {
  font-size: 14px;
  color: #333333;
  margin-bottom: 8px;
}

/* 名称输入框 */
.name-input {
  width: 100%;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
  box-sizing: border-box;
}

/* 字符计数 */
.char-count {
  font-size: 12px;
  color: #999999;
  text-align: right;
  margin-top: 4px;
}

/* 弹窗按钮区域 */
.dialog-buttons {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

/* 取消按钮 */
.cancel-button {
  flex: 1;
  height: 40px;
  background-color: #f5f5f5;
  color: #333333;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 确定按钮 */
.confirm-button {
  flex: 1;
  height: 40px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 图片大小超限弹窗样式 */
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
  width: 80%;
  max-width: 280px;
  background-color: white;
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-size-error-dialog-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.image-size-error-dialog-title {
  font-size: 18px;
  font-weight: bold;
  color: #333333;
  margin-bottom: 12px;
}

.image-size-error-dialog-message {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  margin-bottom: 24px;
}

.image-size-error-dialog-button {
  width: 100%;
  height: 44px;
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

/* 主体添加成功弹窗 */
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

.image-size-error-dialog-button:hover {
  background-color: #d63229;
}

.image-size-error-dialog-button:active {
  background-color: #c02d26;
}

/* 响应式设计 - iPhone 12 Pro 竖屏适配 */
@media screen and (max-width: 390px) {
  .image-size-error-dialog-content {
    width: 85%;
    padding: 20px;
  }
  
  .image-size-error-dialog-icon {
    font-size: 42px;
    margin-bottom: 14px;
  }
  
  .image-size-error-dialog-title {
    font-size: 17px;
    margin-bottom: 10px;
  }
  
  .image-size-error-dialog-message {
    font-size: 13px;
    margin-bottom: 20px;
  }
  
  .image-size-error-dialog-button {
    height: 44px;
    font-size: 16px;
  }
}

/* 确定按钮禁用状态 */
.confirm-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

/* 删除确认文本 */
.delete-confirm-text {
  font-size: 14px;
  color: #333333;
  text-align: center;
  margin-bottom: 20px;
  line-height: 1.5;
}

/* 确认删除按钮 */
.confirm-delete-button {
  flex: 1;
  height: 40px;
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 字数统计样式 */
.char-count {
  font-size: 12px;
  color: #999999;
  text-align: right;
  margin-top: 4px;
  height: 16px;
}

/* 响应式适配 - iPhone 12 Pro */
@media screen and (max-width: 390px) {
  .edit-topic-container {
    padding-bottom: 60px; /* 为底部导航栏留出空间 */
  }
  
  .topic-details {
    gap: 8px;
  }
  
  .subject-image-container {
    width: 70px;
    height: 70px;
  }
  
  .subjects-section {
    padding: 12px 8px;
  }
  
  .subject-item {
    padding: 12px;
    margin-bottom: 10px;
  }
}
</style>