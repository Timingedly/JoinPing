<template>
  <div class="my-topics-page">
    <!-- 页面头部 - 固定在顶部 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <span class="back-arrow">&lt;</span>
      </div>
      <div class="title">我的话题</div>
      <div class="action-button" @click="toggleManageMode">
        <span class="manage-text">{{ isManageMode ? '完成' : '管理' }}</span>
      </div>
    </div>

    <!-- 话题列表区域 - 内嵌滑动框样式，参考主体页实现 -->
    <div class="topic-section-container" v-if="topics.length > 0">
      <div class="topic-list">
        <div 
          v-for="(topic, index) in topics" 
          :key="topic.id"
        >
          <!-- 大容器 - 包含操作按钮区域和话题块 -->
          <div :class="['topic-container', { 'manage-mode': isManageMode }]">
            <!-- 上部分：操作按钮区域 -->
            <div class="actions-section">
              <!-- 左侧圆形选择器 -->
              <div class="actions-left">
                <div 
                  :class="{ 'hidden': !isManageMode }" 
                  class="topic-checkbox"
                  @click.stop
                ></div>
              </div>
              
              <!-- 右侧操作按钮 -->
              <div class="actions-right">
                <!-- 删除按钮 -->
                <div 
                  :class="{ 'hidden': !isManageMode }" 
                  class="delete-button" 
                  @click.stop="showDeleteConfirmDialog(topic.id)"
                >
                  <span class="button-text">删除</span>
                </div>
                <!-- 修改按钮 -->
                <div 
                  :class="{ 'hidden': !isManageMode }" 
                  class="edit-button" 
                  @click.stop="editTopic(topic)"
                >
                  <span class="button-text">修改</span>
                </div>
              </div>
            </div>
            
            <!-- 下部分：话题项 -->
            <div class="topic-wrapper">
              <TopicItem 
                :topic="topic"
                @click="goToTopicDetail(topic.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 - 内嵌滑动框样式 -->
    <div v-else class="topic-section-container">
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">暂无话题，快去创建吧！</div>
      </div>
    </div>

    <!-- 分页器 - 固定在底部 -->
    <div class="pagination-section" v-if="totalPages > 0">
      <Pagination
        :current-page="currentPage"
        :total-pages="totalPages"
        :page-size="pageSize"
        :total-items="totalItems"
        @page-change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>
    
    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteDialog" class="dialog-overlay" @click="closeDeleteConfirmDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">确认删除</div>
        <div class="delete-confirm-text">
          确定要删除这个话题吗？删除后无法恢复。
        </div>
        <div class="dialog-buttons">
          <button class="cancel-button" @click="closeDeleteConfirmDialog">取消</button>
          <button class="confirm-delete-button" @click="confirmDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * MyTopics.vue - 我的话题页面组件
 * 功能：显示用户创建的话题列表，支持分页查询、排序和话题管理
 * 设计要点：
 * 1. 顶部标题"我的话题" - 固定在顶部
 * 2. 左上角返回按钮，右上角管理按钮
 * 3. 分页查询的话题列表 - 可滚动区域
 * 4. 管理模式支持选择话题和修改操作
 * 5. 分页器固定在底部
 */

import Pagination from '@/components/Pagination.vue';
import TopicItem from '@/components/TopicItem.vue';
import { topicApi } from '../api/index.js';

export default {
  name: 'MyTopics',
  components: {
    Pagination,
    TopicItem
  },
  data() {
    return {
      topics: [],               // 话题列表
      pageSize: 10,             // 每页显示数量
      currentPage: 1,           // 当前页码
      totalPages: 1,            // 总页数
      totalItems: 0,            // 总记录数
      isManageMode: false,      // 是否处于管理模式
      // 选中的话题ID数组 - 虽然不显示选择框，但保留此变量以备后续功能扩展使用
      selectedTopics: [],       // 选中的话题ID列表
      isLoading: false,          // 加载状态
      showDeleteDialog: false,   // 是否显示删除确认弹窗
      topicToDelete: null       // 要删除的话题ID
    };
  },
  created() {
    // 组件创建时获取话题列表
    this.fetchMyTopics();
  },
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      this.$router.back();
    },
    
    /**
     * 切换管理模式
     */
    toggleManageMode() {
      this.isManageMode = !this.isManageMode;
      // 切换管理模式时清空选中状态
      this.selectedTopics = [];
    },
    
    /**
     * 获取我的话题列表
     * API: GET /topic/my?pageNum=1&pageSize=10
     * 功能：获取当前用户创建的话题列表，支持分页
     */
    fetchMyTopics() {
      // 调用真实API
      this.isLoading = true;
      
      console.log('我的话题页面：调用API获取数据，页码:', this.currentPage, '每页条数:', this.pageSize);
      
      // 调用topicApi.getMyTopics方法获取我的话题列表
      // 注意：第一个参数是pageNum，第二个参数是pageSize
      // 修复bug：前端使用currentPage变量，但API期望接收pageNum参数
      // 这里直接传递this.currentPage作为pageNum参数是正确的
      topicApi.getMyTopics(this.currentPage, this.pageSize)
        .then(response => {
          if (response.hasSuccessed && response.data) {
            // 处理分页数据
            const { list, total, current, pages } = response.data;
            
            // 更新话题列表
            this.topics = list.map(topic => ({
              id: topic.id,
              title: topic.name, // 后端返回的是name字段，前端需要的是title字段
              description: topic.content, // 后端返回的是content字段，前端需要的是description字段
              imageUrl: topic.photoUrl, // 后端返回的是photoUrl字段
              createTime: topic.createTime
            }));
            
            // 更新分页信息 - 后端Long类型转为String，需要转换为Number类型
            // 修复Vue警告：Invalid prop: type check failed for prop "totalPages". Expected Number, got String
            this.totalItems = Number(total) || 0;
            this.totalPages = Number(pages) || 1;
            // 修复bug：前端应该保持自己的currentPage状态，不依赖后端返回的current字段
            // 因为后端可能返回错误的current值（如11），导致分页异常
            // this.currentPage = current || 1; // 注释掉这行，不更新currentPage
            console.log('API返回的current字段:', current, '前端保持的currentPage:', this.currentPage);
          } else {
            console.error('获取我的话题列表失败:', response.message);
            // 如果API调用失败，使用空数组
            this.topics = [];
            this.totalItems = 0;
            this.totalPages = 1;
          }
          this.isLoading = false;
        })
        .catch(error => {
          console.error('获取我的话题列表出错:', error);
          // 如果发生错误，使用空数组
          this.topics = [];
          this.totalItems = 0;
          this.totalPages = 1;
          this.isLoading = false;
        });
    },
    
    /**
     * 处理页码变化
     * @param {number} page - 新的页码
     */
    handlePageChange(page) {
      console.log('我的话题页面：页码变化事件触发，目标页码:', page, '当前页码:', this.currentPage, '总页数:', this.totalPages);
      
      // 验证页码范围
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.currentPage = page;
        this.fetchMyTopics();
      } else {
        console.warn('页码验证失败，不执行分页操作');
      }
    },
    
    /**
     * 处理每页显示数量变化
     * @param {number} size - 新的每页显示数量
     */
    handlePageSizeChange(size) {
      console.log('我的话题页面：每页条数变化事件触发，目标条数:', size, '当前条数:', this.pageSize);
      
      // 验证每页显示数量
      if (size > 0 && size !== this.pageSize) {
        this.pageSize = size;
        this.currentPage = 1; // 重置为第一页
        this.fetchMyTopics();
      } else {
        console.warn('每页条数验证失败，不执行分页操作');
      }
    },
    
    /**
     * 跳转到话题详情页
     * @param {number} topicId - 话题ID
     */
    goToTopicDetail(topicId) {
      // 如果不是管理模式，则跳转到话题详情页
      if (!this.isManageMode) {
        this.$router.push(`/topic/${topicId}`);
      }
    },
    
    /**
     * 选择或取消选择话题
     * @param {number} topicId - 话题ID
     */
    selectTopic(topicId) {
      const index = this.selectedTopics.indexOf(topicId);
      if (index > -1) {
        // 如果已选中，则取消选择
        this.selectedTopics.splice(index, 1);
      } else {
        // 如果未选中，则选中
        this.selectedTopics.push(topicId);
      }
    },
    
    /**
     * 全选或取消全选
     */
    toggleSelectAll() {
      if (this.selectedTopics.length === this.topics.length) {
        // 如果已全选，则取消全选
        this.selectedTopics = [];
      } else {
        // 如果未全选，则全选
        this.selectedTopics = this.topics.map(topic => topic.id);
      }
    },
    
    /**
     * 删除话题
     * @param {number} topicId - 话题ID
     */
    deleteTopic(topicId) {
      // 调用真实API删除话题
      this.isLoading = true;
      
      // 调用topicApi.deleteTopic方法删除话题
      topicApi.deleteTopic(topicId)
        .then(response => {
          if (response.hasSuccessed) {
            // 删除成功，从列表中移除
            this.topics = this.topics.filter(topic => topic.id !== topicId);
            this.totalItems--;
            this.totalPages = Math.ceil(this.totalItems / this.pageSize);
            
            // 如果当前页没有数据了，且不是第一页，则切换到上一页
            if (this.topics.length === 0 && this.currentPage > 1) {
              this.currentPage--;
              this.fetchMyTopics();
            }
            
            // 显示删除成功提示
            this.$toast('删除成功');
          } else {
            // 删除失败，显示错误信息
            this.$toast(response.message || '删除失败，请重试');
          }
        })
        .catch(error => {
          console.error('删除话题失败:', error);
          this.$toast('删除失败，请重试');
        })
        .finally(() => {
          this.isLoading = false;
        });
    },
    
    /**
     * 显示删除确认弹窗
     * @param {number} topicId - 话题ID
     */
    showDeleteConfirmDialog(topicId) {
      this.topicToDelete = topicId;
      this.showDeleteDialog = true;
    },
    
    /**
     * 关闭删除确认弹窗
     */
    closeDeleteConfirmDialog() {
      this.showDeleteDialog = false;
      this.topicToDelete = null;
    },
    
    /**
     * 确认删除
     */
    confirmDelete() {
      if (this.topicToDelete) {
        this.deleteTopic(this.topicToDelete);
        this.closeDeleteConfirmDialog();
      }
    },
    
    /**
     * 编辑话题
     * @param {Object} topic - 要编辑的话题
     */
    editTopic(topic) {
      // 跳转到话题编辑页面，传递话题ID
      this.$router.push({ path: `/edit-topic/${topic.id}` });
    },
    
    /**
     * 格式化日期时间
     * @param {string} dateString - ISO格式的时间字符串
     * @returns {string} 格式化后的时间显示（年月日格式）
     */
    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      // 统一返回年月日格式：2025-10-01
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
};
</script>

<style scoped>
/* 我的话题页面样式 - 采用flex布局确保固定头部和底部 */
.my-topics-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f5f5f5;
  /* 适配iPhone刘海屏 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 头部样式 - 固定在顶部 */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  padding: 0 15px;
  flex-shrink: 0; /* 防止头部被压缩 */
  z-index: 100;
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

.action-button {
  width: 40px;
  text-align: center;
}

.manage-text {
  font-size: 16px;
  color: #ff3b30;
  font-weight: 500;
}

/* 话题列表区域 - 内嵌滑动框样式，参考主体页实现 */
.topic-section-container {
  flex: 1; /* 使用flex布局填充剩余空间，替代固定高度 */
  overflow-y: auto; /* 垂直滚动 */
  padding: 8px 0;
  /* 添加边框和背景色，形成明确的内嵌区块 */
  border: 2px solid #f0f0f0; /* 添加粗边框，与主体页保持一致 */
  border-radius: 8px; /* 圆角边框 */
  background-color: #ffffff; /* 白色背景 */
  margin: 12px 16px; /* 添加外边距，与页面边缘保持距离 */
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* Webkit浏览器滚动条样式 */
.topic-section-container::-webkit-scrollbar {
  width: 6px;
}

.topic-section-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.topic-section-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.topic-section-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 话题列表容器 */
.topic-list {
  width: 100%;
  padding: 0 16px; /* 添加内边距，确保内容不贴边 */
}

/* 话题大容器 - 包含操作按钮区域和话题块 */
.topic-container {
  margin-bottom: 16px;
  border-radius: 8px; /* 添加圆角效果 */
  overflow: hidden; /* 确保圆角效果正常显示 */
}

/* 管理模式下的样式 - 显示深灰色背景 */
.topic-container.manage-mode {
  background-color: #e0e0e0; /* 只在管理模式下显示深灰色背景 */
}

/* 操作按钮区域 - 位于上方 */
.actions-section {
  width: 100%;
  min-height: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 8px;
  padding-right: 8px;
  box-sizing: border-box;
}

/* 左侧圆形选择器容器 */
.actions-left {
  display: flex;
  align-items: center;
}

/* 圆形选择器样式 */
.topic-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
}

/* 操作按钮右侧容器 */
.actions-right {
  display: flex;
  gap: 8px;
}

/* 话题项包装器 */
.topic-wrapper {
  position: relative;
}

/* 删除按钮样式 */
.delete-button {
  background-color: #ff3b30;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 16px;
  border-radius: 4px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
}

/* 修改按钮样式 */
.edit-button {
  background-color: #ff9500;
  color: #ffffff;
  font-size: 12px;
  padding: 6px 12px;
  border-radius: 4px;
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
}

/* 隐藏类 - 使用visibility替代display，确保元素仍然占据空间 */
.hidden {
  visibility: hidden;
  pointer-events: none; /* 隐藏时不响应点击事件 */
}

/* 按钮文字样式 */
.button-text {
  font-weight: 500;
}

/* 分页器区域 - 固定在底部 */
.pagination-section {
  display: flex;
  justify-content: center;
  padding: 10px 0;
  margin-top: 0;
  background-color: #ffffff;
  border-top: 1px solid #eee;
  position: sticky; /* 使用sticky定位固定在底部 */
  bottom: 0;
  width: 100%;
  flex-shrink: 0; /* 防止分页器被压缩 */
  z-index: 99; /* 确保在其他元素之上 */
}

/* 空状态样式 */
.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #666666;
}
/* 删除确认弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 300px;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16px;
}

.delete-confirm-text {
  font-size: 14px;
  color: #333333;
  line-height: 1.5;
  margin-bottom: 20px;
  text-align: center;
}

.dialog-buttons {
  display: flex;
  gap: 12px;
}

.cancel-button {
  flex: 1;
  height: 40px;
  border: 1px solid #dddddd;
  background-color: #ffffff;
  color: #333333;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}

.confirm-delete-button {
  flex: 1;
  height: 40px;
  background-color: #ff3b30;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
}
</style>