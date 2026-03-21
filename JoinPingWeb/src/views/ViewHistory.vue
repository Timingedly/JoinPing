<template>
  <div class="my-topics-page">
    <!-- 页面头部 - 固定在顶部 -->
    <div class="header">
      <div class="back-button" @click="goBack">
        <span class="back-arrow">&lt;</span>
      </div>
      <div class="title">浏览历史</div>
      <div class="clear-button" @click="showClearConfirmDialog">
        <span class="clear-text">清空</span>
      </div>
    </div>

    <!-- 浏览历史列表区域 - 内嵌滑动框样式，参考我的话题页实现 -->
    <div class="topic-section-container" v-if="historyList.length > 0">
      <div class="topic-list">
        <div 
          v-for="(history, index) in historyList" 
          :key="history.id"
        >
          <!-- 话题项 -->
          <div class="topic-wrapper">
            <TopicItem 
              :topic="history"
              @click="goToTopicDetail(history.id)"
            />
            <!-- 浏览时间 -->
            <div class="view-time">
              <span class="time-icon">🕒</span>
              <span class="time-text">{{ formatViewTime(history.lastViewTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 空状态 - 内嵌滑动框样式 -->
    <div v-else class="topic-section-container">
      <div class="empty-state">
        <div class="empty-icon">📖</div>
        <div class="empty-text">暂无浏览历史</div>
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

    <!-- 清空确认弹窗 -->
    <div v-if="showClearDialog" class="modal-overlay">
      <div class="confirm-dialog">
        <div class="dialog-content">
          <div class="dialog-title">确认清空</div>
          <div class="dialog-message">确认清空浏览历史吗？</div>
          <div class="dialog-buttons">
            <button class="cancel-button" @click="closeClearConfirmDialog">取消</button>
            <button class="confirm-button" @click="confirmClearHistory">确认</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * ViewHistory.vue - 浏览历史页面组件
 * 功能：显示用户浏览话题的历史记录列表，支持分页查询
 * 设计要点：
 * 1. 顶部标题"浏览历史" - 固定在顶部
 * 2. 左上角返回按钮，右上角无管理按钮
 * 3. 分页查询的浏览历史列表 - 可滚动区域
 * 4. 每条记录显示话题信息和浏览时间
 * 5. 分页器固定在底部
 */

import Pagination from '@/components/Pagination.vue';
import TopicItem from '@/components/TopicItem.vue';
import { userTopicViewHistoryApi } from '../api/index.js';

export default {
  name: 'ViewHistory',
  components: {
    Pagination,
    TopicItem
  },
  data() {
    return {
      historyList: [],          // 浏览历史列表
      pageSize: 10,             // 每页显示数量
      currentPage: 1,           // 当前页码
      totalPages: 1,            // 总页数
      totalItems: 0,            // 总记录数
      isLoading: false,         // 加载状态
      showClearDialog: false    // 清空确认弹窗显示状态
    };
  },
  created() {
    // 组件创建时获取浏览历史列表
    this.fetchHistoryList();
  },
  methods: {
    /**
     * 返回上一页
     */
    goBack() {
      this.$router.back();
    },
    
    /**
     * 获取浏览历史列表
     * API: GET /history?pageNum=1&pageSize=10
     * 功能：获取当前用户的浏览历史记录列表，支持分页
     * 对接后端UserTopicViewHistoryController的list方法
     */
    fetchHistoryList() {
      // 调用真实API
      this.isLoading = true;
      
      console.log('浏览历史页面：调用API获取数据，页码:', this.currentPage, '每页条数:', this.pageSize);
      
      // 调用userTopicViewHistoryApi.getHistoryList方法获取浏览历史列表
      userTopicViewHistoryApi.getHistoryList(this.currentPage, this.pageSize)
        .then(response => {
          if (response.hasSuccessed && response.data) {
            // 处理分页数据
            const { list, total, current, pages } = response.data;
            
            // 直接使用后端返回的数据，不需要复杂的字段映射
            this.historyList = list.map(item => ({
              id: item.id,
              title: item.name, // 后端返回的是name字段，前端需要的是title字段
              description: item.content, // 后端返回的是content字段，前端需要的是description字段
              imageUrl: item.photoUrl, // 后端返回的是photoUrl字段
              createTime: item.createTime,
              lastViewTime: item.lastViewTime // 浏览时间
            }));
            
            // 更新分页信息
            this.totalItems = Number(total) || 0;
            this.totalPages = Number(pages) || 1;
            
            console.log('浏览历史API返回数据:', response.data);
          } else {
            console.error('获取浏览历史列表失败:', response.message);
            // 如果API调用失败，使用空数组
            this.historyList = [];
            this.totalItems = 0;
            this.totalPages = 1;
          }
          this.isLoading = false;
        })
        .catch(error => {
          console.error('获取浏览历史列表出错:', error);
          // 如果发生错误，使用空数组
          this.historyList = [];
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
      console.log('浏览历史页面：页码变化事件触发，目标页码:', page, '当前页码:', this.currentPage, '总页数:', this.totalPages);
      
      // 验证页码范围
      if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
        this.currentPage = page;
        this.fetchHistoryList();
      } else {
        console.warn('页码验证失败，不执行分页操作');
      }
    },
    
    /**
     * 处理每页显示数量变化
     * @param {number} size - 新的每页显示数量
     */
    handlePageSizeChange(size) {
      console.log('浏览历史页面：每页条数变化事件触发，目标条数:', size, '当前条数:', this.pageSize);
      
      // 验证每页显示数量
      if (size > 0 && size !== this.pageSize) {
        this.pageSize = size;
        this.currentPage = 1; // 重置为第一页
        this.fetchHistoryList();
      } else {
        console.warn('每页条数验证失败，不执行分页操作');
      }
    },
    
    /**
     * 跳转到话题详情页
     * @param {number} topicId - 话题ID
     */
    goToTopicDetail(topicId) {
      this.$router.push(`/topic/${topicId}`);
    },
    
    /**
     * 格式化浏览时间
     * @param {string} timeString - 时间字符串
     * @returns {string} 格式化后的时间
     */
    formatViewTime(timeString) {
      if (!timeString) return '未知时间';
      
      try {
        const date = new Date(timeString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) {
          return '刚刚';
        } else if (diffMins < 60) {
          return `${diffMins}分钟前`;
        } else if (diffHours < 24) {
          return `${diffHours}小时前`;
        } else if (diffDays < 7) {
          return `${diffDays}天前`;
        } else {
          return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
        }
      } catch (error) {
        console.error('时间格式化错误:', error);
        return '未知时间';
      }
    },
    
    /**
     * 显示清空确认弹窗
     */
    showClearConfirmDialog() {
      // 只有在有浏览历史时才显示清空确认弹窗
      if (this.historyList.length > 0) {
        this.showClearDialog = true;
      }
    },
    
    /**
     * 关闭清空确认弹窗
     */
    closeClearConfirmDialog() {
      this.showClearDialog = false;
    },
    
    /**
     * 确认清空浏览历史
     * API: DELETE /history
     * 功能：清空当前用户的所有浏览历史记录
     * 对接后端UserTopicViewHistoryController的delete方法
     */
    confirmClearHistory() {
      this.isLoading = true;
      
      // 调用userTopicViewHistoryApi.clearHistory方法清空浏览历史
      userTopicViewHistoryApi.clearHistory()
        .then(response => {
          if (response.hasSuccessed) {
            // 清空成功，重置数据
            this.historyList = [];
            this.totalItems = 0;
            this.totalPages = 1;
            this.currentPage = 1;
            
            // 显示成功提示
            this.$toast('清空成功');
          } else {
            // 清空失败，显示错误信息
            this.$toast(response.message || '清空失败，请重试');
          }
          this.closeClearConfirmDialog();
          this.isLoading = false;
        })
        .catch(error => {
          console.error('清空浏览历史失败:', error);
          this.$toast('清空失败，请重试');
          this.closeClearConfirmDialog();
          this.isLoading = false;
        });
    }
  }
};
</script>

<style scoped>
/* 浏览历史页面样式 - 采用flex布局确保固定头部和底部，完全按照我的话题页实现 */
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

/* 清空按钮样式 */
.clear-button {
  width: 50px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: #ff3b30; /* 红色背景 */
  border-radius: 15px; /* 圆角 */
  border: none;
}

.clear-text {
  font-size: 14px;
  font-weight: 500;
  color: #ffffff; /* 白色文字 */
}

/* 话题列表区域 - 内嵌滑动框样式，与我的话题页保持一致 */
.topic-section-container {
  flex: 1; /* 使用flex布局替代固定高度，让滑动框自适应剩余空间 */
  overflow-y: auto; /* 垂直滚动 */
  padding: 8px 0;
  /* 添加边框和背景色，形成明确的内嵌区块 */
  border: 2px solid #f0f0f0; /* 添加粗边框，与我的话题页保持一致 */
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

/* 话题项包装器 */
.topic-wrapper {
  margin-bottom: 16px;
  border-radius: 8px; /* 添加圆角效果 */
  overflow: hidden; /* 确保圆角效果正常显示 */
}

/* 浏览时间样式 */
.view-time {
  display: flex;
  align-items: center;
  margin-top: 8px;
  padding: 0 16px 16px 16px;
  font-size: 12px;
  color: #666;
}

.time-icon {
  margin-right: 4px;
}

.time-text {
  font-size: 12px;
}

/* 分页器区域 - 固定在底部 */
.pagination-section {
  display: flex;
  justify-content: center;
  padding: 10px 0; /* 减少垂直内边距，消除底部空白 */
  margin-top: 0;
  background-color: #ffffff;
  border-top: 1px solid #eee;
  position: sticky; /* 使用sticky定位替代fixed或relative */
  bottom: 0; /* 固定在底部 */
  z-index: 99; /* 确保在其他内容之上 */
  width: 100%;
  flex-shrink: 0; /* 防止分页器被压缩 */
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

/* 清空确认弹窗样式 */
.modal-overlay {
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

.confirm-dialog {
  background-color: #ffffff;
  border-radius: 12px;
  width: 280px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-content {
  padding: 24px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 8px;
  text-align: center;
}

.dialog-message {
  font-size: 14px;
  color: #666666;
  margin-bottom: 20px;
  text-align: center;
  line-height: 1.4;
}

.dialog-buttons {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.cancel-button {
  flex: 1;
  height: 40px;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  color: #666666;
  cursor: pointer;
}

.cancel-button:hover {
  background-color: #e8e8e8;
}

.confirm-button {
  flex: 1;
  height: 40px;
  background-color: #ff3b30;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  color: #ffffff;
  cursor: pointer;
}

.confirm-button:hover {
  background-color: #e5352b;
}
</style>