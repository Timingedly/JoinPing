<template>
  <div class="comment-layout-container">
    <!-- 用户名头部 - 左右布局 -->
    <div class="comment-header-new">
      <!-- 左侧：用户名 -->
      <div class="user-name-left">
        {{ truncateUserName(comment.userName) }}
      </div>
      
      <!-- 右侧：日期和举报按钮 -->
      <div class="header-right">
        <div class="comment-time-top">{{ formatDate(comment.createTime) }}</div>
        <div 
          class="report-button" 
          :class="{ 'reported': comment.isReported }"
          @click="handleReport(comment.id)"
        >
          {{ comment.isReported ? '已举报' : '举报' }}
        </div>
      </div>
    </div>
    
    <!-- 主体内容区 - 三七分布局 -->
    <div class="comment-main-new">
      <!-- 左侧 - 占据25% -->
      <div class="comment-left-new">
        <!-- 上半部分：圆形头像，居中 -->
        <div class="avatar-container">
          <div class="user-avatar-new">
            <img :src="comment.userAvatar || '/default-avatar.jpg'" :alt="comment.userName" class="avatar-image-new">
          </div>
        </div>
        
        <!-- 下半部分：点赞区域（可选） -->
        <div v-if="showLikeArea" class="like-area-new">
          <div class="like-count-new">{{ comment.likeCount }}</div>
          <div 
            class="like-button-new" 
            :class="{ 'liked': comment.isLiked }"
            @click="handleLike(comment.id)"
          >
            {{ comment.isLiked ? '已赞' : '点赞' }}
          </div>
        </div>
      </div>
      
      <!-- 右侧 - 占据75% -->
      <div class="comment-right-new">
        <!-- 上半部分 - 占据80%：评论内容 -->
        <div class="comment-content-container">
          <!-- 评论内容 -->
          <div 
            class="comment-content-new" 
            :class="{ 'expanded': comment.expanded || !shouldCollapse(comment) }"
            @click="handleContentClick(comment)"
            v-html="getCommentContent(comment)"
          ></div>
          
          <!-- 展开/收起按钮 -->
          <div 
            v-if="needExpandButton(comment)"
            class="expand-button-new"
            @click="toggleCommentExpand(comment)"
          >
            {{ comment.expanded ? '收起' : '展开' }}
          </div>
        </div>
        
        <!-- 下半部分：查看回复按钮（可选） -->
        <div v-if="showReplyButton" class="reply-more-new" @click="handleViewReplies(comment)">
          查看回复
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// CommentLayout.vue - 通用评论布局组件
// 功能：提供统一的评论布局，支持一级评论和二级评论的复用
// 设计要点：
// 1. 支持头像、用户名、日期、举报按钮的通用布局
// 2. 支持点赞功能的可选显示
// 3. 支持查看回复按钮的可选显示
// 4. 支持评论内容的展开收起功能
// 5. 提供统一的样式和交互体验

import { formatDate } from '../utils/date.js'

export default {
  name: 'CommentLayout',
  props: {
    // 评论数据对象
    comment: {
      type: Object,
      required: true,
      default: () => ({
        id: '',
        userName: '',
        userAvatar: '',
        content: '',
        createTime: '',
        likeCount: 0,
        isLiked: false,
        isReported: false,
        expanded: false
      })
    },
    // 是否显示点赞区域
    showLikeArea: {
      type: Boolean,
      default: true
    },
    // 是否显示查看回复按钮
    showReplyButton: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    // 格式化日期
    formatDate(date) {
      return formatDate(date)
    },
    
    // 截断用户名（超过6个字符显示...）
    truncateUserName(name) {
      if (!name) return '匿名用户'
      return name.length > 6 ? name.substring(0, 6) + '...' : name
    },
    
    // 获取评论内容
    // 功能：根据评论类型处理评论内容显示，并实现字数截断功能
    // 需求：如果type字段是2的值，则在评论前加一段文本"回复 x ："其中x前后都有一个空格，后面的空格接一个中文的冒号，x取值自响应的replyUserName，x用蓝色表示
    // 需求：二级评论块中获取content字段的字数，如果大于80就截断并且同时显示展开/收起按钮
    getCommentContent(comment) {
      let content = comment.content || ''
      
      // 校验type字段：如果replyType为2（回复二级评论），则添加回复前缀
      if (comment.replyType === 2 && comment.replyUserName) {
        // 构建回复前缀："回复 x ："，其中x用蓝色显示，回复和冒号用黑色显示
        const prefix = `<span style="color: #000000;">回复 </span><span class="reply-user-name-blue">${comment.replyUserName}</span><span style="color: #000000;"> ：</span>`
        content = prefix + content
      }
      
      // 如果内容需要截断且未展开，则截断到80字
      if (this.needExpandButton(comment) && !comment.expanded) {
        // 获取纯文本内容进行截断
        const plainText = comment.content.replace(/<[^>]*>/g, '').trim()
        const truncatedText = plainText.substring(0, 80) + '...'
        
        // 如果有回复前缀，需要重新构建内容
        if (comment.replyType === 2 && comment.replyUserName) {
          const prefix = `<span style="color: #000000;">回复 </span><span class="reply-user-name-blue">${comment.replyUserName}</span><span style="color: #000000;"> ：</span>`
          return prefix + truncatedText
        } else {
          return truncatedText
        }
      }
      
      return content
    },
    
    // 判断是否需要显示展开按钮
    // 功能：超过80字才显示展开/收起按钮
    needExpandButton(comment) {
      if (!comment.content) return false
      
      // 获取纯文本内容（排除HTML标签）
      const plainText = comment.content.replace(/<[^>]*>/g, '').trim()
      
      // 简单判断：超过80字符就显示展开按钮
      return plainText.length > 80
    },
    
    // 判断默认是否应该截断
    shouldCollapse(comment) {
      if (!comment.content) return false
      
      // 获取纯文本内容（排除HTML标签）
      const plainText = comment.content.replace(/<[^>]*>/g, '').trim()
      
      // 超过80字默认截断，不超过80字完整显示
      return plainText.length > 80
    },
    
    // 切换评论展开状态
    toggleCommentExpand(comment) {
      this.$emit('toggle-expand', comment)
    },
    
    // 处理举报事件
    handleReport(commentId) {
      this.$emit('report', commentId)
    },
    
    // 处理点赞事件
    handleLike(commentId) {
      this.$emit('like', commentId)
    },
    
    // 处理内容点击事件（用于回复功能）
    handleContentClick(comment) {
      this.$emit('content-click', comment)
    },
    
    // 处理查看回复事件
    handleViewReplies(comment) {
      this.$emit('view-replies', comment)
    }
  }
}
</script>

<style scoped>
/* 评论布局容器 */
.comment-layout-container {
  width: 100%;
  padding: 10px; /* 参考主体页一级评论块的内边距 */
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 增强阴影效果 */
  transition: transform 0.2s ease, box-shadow 0.2s ease; /* 添加过渡效果 */
}

/* 评论布局容器悬停效果 */
.comment-layout-container:hover {
  transform: translateY(-2px); /* 悬停时轻微上移 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* 悬停时增强阴影 */
}

/* 用户名头部 - 左右布局 */
.comment-header-new {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

/* 左侧：用户名 */
.user-name-left {
  font-size: 14px;
  font-weight: bold;
  color: #000000;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 右侧：日期和举报按钮 */
.header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

/* 日期 */
.comment-time-top {
  font-size: 12px;
  color: #999999;
}

/* 举报按钮 */
.report-button {
  font-size: 12px;
  color: #666666;
  cursor: pointer;
}

/* 举报按钮已举报状态 */
.report-button.reported {
  color: #999999;
  cursor: not-allowed;
}

/* 主体内容区 - 三七分布局 */
.comment-main-new {
  display: flex;
  gap: 12px;
  width: 100%;
  position: relative;
}

/* 左侧 - 占据25% */
.comment-left-new {
  width: 25%;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-left: 0;
  margin-left: -8px;
}

/* 上半部分：头像容器 */
.avatar-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  margin-top: -4px;
}

/* 用户头像 - 圆形居中 */
.user-avatar-new {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ff3b30;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ff3b30;
  position: relative;
}

/* 头像图片 */
.avatar-image-new {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 下半部分：点赞区域 */
.like-area-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 48px; /* 固定高度，确保即使没有点赞按钮也保持固定大小 */
  justify-content: center; /* 垂直居中 */
}

/* 当没有点赞区域时的占位样式 */
.comment-left-new:not(:has(.like-area-new)) {
  position: relative;
}

.comment-left-new:not(:has(.like-area-new))::after {
  content: '';
  display: block;
  height: 48px; /* 与点赞区域高度一致 */
  width: 100%;
}

/* 点赞数 */
.like-count-new {
  font-size: 14px;
  color: #666666;
  text-align: center;
}

/* 点赞按钮 */
.like-button-new {
  padding: 4px 12px;
  font-size: 12px;
  color: #666666;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  background-color: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 已点赞状态 */
.like-button-new.liked {
  color: #FF0000;
  border-color: #FF0000;
}

/* 右侧 - 占据75% */
.comment-right-new {
  width: 75%;
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 上半部分：评论内容容器 */
.comment-content-container {
  flex: 9;
}

/* 评论内容 - 展开收起功能样式 */
/* 默认状态：超过80字自动截断为3行，不超过80字完整显示 */
.comment-content-new {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  /* 默认截断为3行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0;
  margin: 0;
  position: relative;
  word-break: break-word;
  white-space: normal;
  word-spacing: 0;
  letter-spacing: 0;
  background-color: #ffffff;
  -webkit-hyphens: none;
  hyphens: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 评论内容点击效果 */
.comment-content-new:hover {
  background-color: #f5f5f5;
}

/* 展开状态 - 点击展开按钮后添加expanded类，完整显示 */
.comment-content-new.expanded {
  display: block;
  -webkit-line-clamp: unset;
  -webkit-box-orient: vertical;
  overflow: visible;
  max-height: none;
  background: transparent;
}

/* 展开/收起按钮 */
.expand-button-new {
  font-size: 14px;
  color: #0066CC;
  cursor: pointer;
  margin-top: -4px;
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  transition: all 0.2s ease;
  text-decoration: underline;
  font-weight: 500;
}

/* 展开/收起按钮悬停效果 */
.expand-button-new:hover {
  background-color: rgba(0, 102, 204, 0.1);
}

/* 查看回复按钮 */
.reply-more-new {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 14px;
  color: #0066CC;
  cursor: pointer;
  padding: 4px 8px;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  transition: all 0.2s ease;
}

/* 查看回复按钮悬停效果 */
.reply-more-new:hover {
  background-color: #f5f5f5;
  border-color: #0066CC;
}

/* 回复用户名蓝色样式 - 使用深度选择器确保v-html内容也能应用样式 */
.comment-content-new >>> .reply-user-name-blue {
  color: #0066CC !important;
  font-weight: bold !important;
}

/* 响应式适配 - iPhone 12 Pro */
@media screen and (max-width: 390px) {
  .comment-main-new {
    gap: 8px;
  }
}
</style>