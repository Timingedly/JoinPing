<template>
  <div 
    class="topic-item" 
    @click="$emit('click', topic)"
  >
    <!-- 话题内容区域 -->
    <div class="topic-content">
      <!-- 话题名称（加粗） -->
      <div class="topic-title">{{ displayTitle }}</div>
      
      <!-- 图片和简介的左右布局 -->
      <div class="topic-details">
        <!-- 话题图片容器 - 占据30%宽度，始终显示以保持布局一致 -->
        <div class="topic-image-container">
          <img v-if="displayImageUrl" :src="getFullImageUrl(displayImageUrl)" :alt="displayTitle" class="topic-image" />
          <!-- 无图片时的占位区域 -->
          <div v-else class="topic-image-placeholder"></div>
        </div>
        
        <!-- 话题简介 - 占据70%宽度 -->
        <div class="topic-description">
          {{ displayDescription }}
        </div>
      </div>
      
      <!-- 创建时间 -->
      <div class="topic-create-time">
        {{ formatDate(topic.createTime) }}
      </div>

      <!-- 管理按钮（可选） -->
      <div 
        class="modify-icon" 
        v-if="showManageButton" 
        @click.stop="$emit('manage-click', topic)"
      >
        <span class="modify-text">管理</span>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * TopicItem.vue - 可复用的话题块组件
 * 基于分类页的话题块设计，支持不同的显示模式
 * 功能：
 * 1. 显示话题基本信息（标题、图片、简介、创建时间）
 * 2. 可选显示序号
 * 3. 可选显示统计信息（主体数、评论数、点赞数）
 * 4. 可选显示管理按钮
 */

export default {
  name: 'TopicItem',
  props: {
    topic: {
      type: Object,
      required: true,
      default: () => ({
        id: '',
        name: '',        // 后端字段：话题名称
        title: '',       // 前端字段：话题标题（兼容性）
        photoUrl: '',    // 后端字段：图片URL
        imageUrl: '',    // 前端字段：图片URL（兼容性）
        content: '',     // 后端字段：话题内容
        description: '', // 前端字段：话题描述（兼容性）
        createTime: ''
      })
    },
    index: {
      type: Number,
      default: 0
    },
    showManageButton: {
      type: Boolean,
      default: false
    }
  },
  emits: ['click', 'manage-click'],
  computed: {
    /**
     * 获取话题标题（兼容前后端字段）
     */
    displayTitle() {
      return this.topic.name || this.topic.title || '无标题';
    },
    /**
     * 获取话题图片URL（兼容前后端字段）
     */
    displayImageUrl() {
      return this.topic.photoUrl || this.topic.imageUrl || '';
    },
    /**
     * 获取话题描述（兼容前后端字段）
     */
    displayDescription() {
      return this.topic.content || this.topic.description || '无描述';
    }
  },
  methods: {
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
    },
    /**
     * 获取完整的图片URL
     * @param {string} imageUrl - 图片URL或路径
     * @returns {string} 完整的图片URL
     */
    getFullImageUrl(imageUrl) {
      if (!imageUrl) return '';
      // 直接拼接固定IP+端口号，确保不会出现双斜杠
      // 如果imageUrl已经以/开头，则去掉开头的斜杠
      const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      return `http://localhost:8080/${cleanImageUrl}`;
    }
  }
};
</script>

<style scoped>
/* 话题项 */
.topic-item {
  display: flex;
  background-color: #ffffff;
  border-radius: 8px;
  margin-top: 5px; /* 上边距改为5px */
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  border: 1px solid #666666; /* 添加深灰色边框 */
}

/* 话题内容区域 */
.topic-content {
  flex: 1;
  min-width: 0; /* 确保内容不会溢出 */
  position: relative;
}

/* 话题名称（加粗） */
.topic-title {
  font-size: 16px;
  font-weight: bold;
  color: #000000; /* 黑色字体 */
  margin-bottom: 8px;
  word-break: break-word;
}

/* 图片和简介的左右布局容器 */
.topic-details {
  display: flex;
  width: 100%; /* 占满整个宽度 */
  gap: 12px;
}

/* 话题图片容器 - 占据30%宽度 */
.topic-image-container {
  width: 30%;
  height: 80px; /* 固定高度，确保容器大小一致 */
  flex-shrink: 0;
  overflow: hidden; /* 确保超出部分被裁剪 */
}

/* 话题图片 */
.topic-image {
  width: 100%;
  height: 100%; /* 填充整个容器 */
  object-fit: cover; /* 保持宽高比，裁剪超出部分 */
  object-position: center; /* 居中显示 */
  border-radius: 4px;
  border: 1px solid #cccccc; /* 添加灰边描边 */
}

/* 话题图片占位区域 - 无图片时显示 */
.topic-image-placeholder {
  width: 100%;
  height: 100%; /* 填充整个容器 */
  background-color: #f5f5f5; /* 浅灰色背景 */
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999; /* 淡灰色文字 */
  font-size: 12px;
  border: 1px solid #cccccc; /* 添加灰边描边 */
}

/* 话题简介 - 占据70%宽度 */
.topic-description {
  width: 70%;
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4; /* 增加显示行数 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0;
  margin: 0;
  /* 彻底修复省略号缝隙问题 */
  position: relative;
  word-break: break-word;
  /* 确保文本紧密排列，无额外空间 */
  white-space: normal;
  word-spacing: 0;
  letter-spacing: 0;
  /* 使用新属性增强兼容性 */
  line-clamp: 4;
  /* 确保背景色覆盖整个区域，避免缝隙显示 */
  background-color: #ffffff;
  /* 防止最后一行出现不完整字符 */
  -webkit-hyphens: none;
  hyphens: none;
}

/* 创建时间样式 */
.topic-create-time {
  font-size: 12px;
  color: #999999;
  text-align: right;
  margin-top: 8px;
}

/* 修改按钮样式 */
.modify-icon {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff3b30;
  color: #ffffff;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
}

.modify-text {
  font-weight: 500;
}

/* 话题项点击效果 */
.topic-item:active {
  background-color: #f5f5f5;
}
</style>

