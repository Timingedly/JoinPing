<template>
  <div class="topic-list-container">
    <!-- 上下滑动的话题列表 -->
    <div class="topic-list">
      <div 
        v-for="(topic, index) in topics" 
        :key="topic.id"
        class="topic-item"
        @click="goToTopicDetail(topic.id)"
      >
        <!-- 金色顺序块 -->
        <div class="topic-rank">
          {{ index + 1 }}
        </div>
        
        <!-- 话题内容区域 -->
        <div class="topic-content">
          <!-- 话题名称（加粗） -->
          <div class="topic-title">{{ displayTitle(topic) }}</div>
          
          <!-- 图片和简介的左右布局 -->
          <div class="topic-details">
            <!-- 话题图片 - 占据30%宽度，始终显示以保持布局一致 -->
            <div class="topic-image-container">
              <img v-if="displayImageUrl(topic)" :src="getFullImageUrl(displayImageUrl(topic))" :alt="displayTitle(topic)" class="topic-image" />
              <!-- 无图片时的占位区域 -->
              <div v-else class="topic-image-placeholder"></div>
            </div>
            
            <!-- 话题简介 - 占据70%宽度 -->
            <div class="topic-description">
              <p :class="{ 'expanded': isDescriptionExpanded(topic) }">
                {{ getTopicDescription(topic) }}
                <span 
                  v-if="needExpandButton(topic)" 
                  class="expand-link" 
                  @click="toggleDescription(topic, $event)"
                >
                  {{ isDescriptionExpanded(topic) ? ' 收起' : ' 展开' }}
                </span>
              </p>
            </div>
          </div>
          
          <!-- 创建时间 -->
          <div class="topic-create-time">
            {{ formatDate(topic.createTime) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// TopicList.vue - 话题列表组件
// 功能：显示话题列表，支持上下滑动查看
// 设计要点：
// 1. 固定10个话题列表
// 2. 每个话题块上方有金色顺序块，居中显示数字
// 3. 话题块由话题名称（加粗）、话题图片、话题简介组成
// 4. 话题简介超过长度显示省略号
// 5. 点击话题跳转到话题详情页
import { homeApi } from '../api/index.js'

export default {
  name: 'TopicList',
  props: {
    rankKey: {
      type: String,
      default: 'weekMostLike' // 默认显示"近期最热"
    }
  },
  data() {
    return {
      topics: [], // 话题列表
      pageSize: 10, // 固定显示10个话题
      expandedStates: {} // 存储每个话题的展开状态
    }
  },
  watch: {
    // 监听rankKey变化，重新获取话题列表
    rankKey: {
      handler(newRankKey) {
        this.fetchTopics(newRankKey)
      },
      immediate: true // 组件加载时就执行一次
    }
  },
  methods: {
    // 获取话题列表
    // API: GET /index/rank?key=xxx
    // 功能：根据key获取话题排行榜列表，对接后端IndexController的rankingList方法
    // key参数说明："weekMostLike"表示"近期最热"，"weekMostFavorite"表示"近期最受期待"
    fetchTopics(rankKey = 'weekMostLike') {
      console.log('开始获取话题排行榜数据，key:', rankKey);
      
      // 调用后端IndexController的rankingList方法
      homeApi.getRankingList(rankKey)
        .then(response => {
          console.log('话题排行榜API响应:', response);
          
          // 处理成功响应
          if (response.hasSuccessed && response.data) {
            // 根据后端IndexServiceImpl实现，rankingList方法返回List<Topic>
            this.topics = response.data;
            console.log('成功获取话题排行榜数据:', this.topics);
          } else {
            console.error('获取话题排行榜失败，响应状态异常:', response);
            // 使用模拟数据作为备用
            this.generateMockTopics();
          }
        })
        .catch(error => {
          console.error('获取话题排行榜失败:', error);
          // API调用失败时清空数据
          this.topics = [];
        });
    },
    
    // 跳转到话题详情页
    goToTopicDetail(topicId) {
      this.$router.push(`/topic/${topicId}`)
    },
    
    // 格式化日期时间
    // 将ISO格式的时间转换为年月日格式
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
     * 获取话题标题（兼容前后端字段）
     * 后端字段：name，前端字段：title
     */
    displayTitle(topic) {
      return topic.name || topic.title || '无标题';
    },
    
    /**
     * 获取话题图片URL（兼容前后端字段）
     * 后端字段：photoUrl，前端字段：imageUrl
     */
    displayImageUrl(topic) {
      return topic.photoUrl || topic.imageUrl || '';
    },
    
    /**
     * 获取话题描述（兼容前后端字段）
     * 后端字段：content，前端字段：description
     */
    displayDescription(topic) {
      return topic.content || topic.description || '无描述';
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
    },
    
    /**
     * 获取话题简介内容（统一逻辑：超过80字截断为三行）
     * 功能：根据展开状态返回完整内容或截断内容
     * 统一标准：与评论组件保持一致，使用80字符截断标准
     */
    getTopicDescription(topic) {
      const description = this.displayDescription(topic);
      if (!description) return '';
      
      // 如果内容需要截断且未展开，则截断到80字
      if (this.needExpandButton(topic) && !this.isDescriptionExpanded(topic)) {
        // 获取纯文本内容进行截断
        const plainText = description.replace(/<[^>]*>/g, '').trim();
        const truncatedText = plainText.substring(0, 80) + '...';
        return truncatedText;
      }
      
      return description;
    },
    
    /**
     * 判断是否需要显示展开按钮（统一逻辑：超过80字显示展开按钮）
     * 功能：根据话题简介内容长度判断是否需要展开/收起功能
     * 统一标准：与评论组件保持一致，使用80字符判断标准
     */
    needExpandButton(topic) {
      const description = this.displayDescription(topic);
      if (!description) return false;
      
      // 获取纯文本内容（排除HTML标签）
      const plainText = description.replace(/<[^>]*>/g, '').trim();
      
      // 简单判断：超过80字符就显示展开按钮
      return plainText.length > 80;
    },
    
    /**
     * 检查话题简介是否已展开
     */
    isDescriptionExpanded(topic) {
      return this.expandedStates[topic.id] || false;
    },
    
    /**
     * 切换话题简介展开/收起状态
     */
    toggleDescription(topic, event) {
      event.stopPropagation(); // 阻止事件冒泡，避免触发话题点击
      this.$set(this.expandedStates, topic.id, !this.isDescriptionExpanded(topic));
    }
  }
}
</script>

<style scoped>
/* 话题列表容器 */
.topic-list-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #f8f8f8;
}

/* 上下滑动的话题列表 */
.topic-list {
  height: 100%;
  overflow-y: auto;
  padding: 0 16px 16px 16px;
  /* 隐藏滚动条但保留滚动功能 */
  -ms-overflow-style: none;
  scrollbar-width: thin;
}

/* 话题项 */
.topic-item {
  display: flex;
  background-color: #ffffff;
  border-radius: 8px;
  margin-top: 12px;
  padding: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  border: 1px solid #666666; /* 添加深灰色边框 */
}

/* 顺序块 - 金色居中显示当前话题的数字 */
.topic-rank {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  background-color: #FFD700; /* 金色背景 */
  color: #000000; /* 黑色字体 */
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  margin-right: 12px;
  flex-shrink: 0;
}

/* 话题内容区域 */
.topic-content {
  flex: 1;
  min-width: 0; /* 确保内容不会溢出 */
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

/* 话题图片占位区域 */
.topic-image-placeholder {
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999;
  font-size: 12px;
  border: 1px solid #cccccc; /* 添加灰边描边 */
}

/* 话题简介 - 占据70%宽度 */
.topic-description {
  width: 70%;
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
}

/* 默认的话题简介（截断） - 统一为3行截断 */
.topic-description p {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
  /* 修复省略号缝隙问题 */
  position: relative;
  word-break: break-word;
  /* 确保文本完全截断，不会出现缝隙 */
  white-space-collapse: collapse;
  line-clamp: 3;
}

/* 展开的话题简介 */
.topic-description p.expanded {
  display: block;
  overflow: visible;
  text-overflow: unset;
  -webkit-line-clamp: unset;
}

/* 展开/收起链接 */
.expand-link {
  color: #0066CC;
  cursor: pointer;
}

/* 话题项点击效果 */
.topic-item:active {
  background-color: #f5f5f5;
}

/* 创建时间样式 */
.topic-create-time {
  font-size: 12px;
  color: #999999;
  text-align: right;
  margin-top: 8px;
}
</style>
