<template>
  <div class="subject-detail-container">
    <!-- 顶部标题栏 -->
    <div class="top-bar">
      <div class="back-button" @click="goBack">
        <span>&lt;</span>
      </div>
      <div class="title">主体</div>
      <div class="placeholder"></div>
    </div>
    
    <!-- 主体内容区域 -->
    <div class="subject-content">
      <!-- 主体信息块 -->
      <div class="subject-block">
        <!-- 主体名称和举报按钮 - 同一行，左右布局 -->
        <div class="subject-title-row">
          <h1 class="subject-title">{{ subject.name }}</h1>
          <button 
            class="report-button-top-right" 
            :class="{ 'reported': subject.isReported }"
            :disabled="subject.isReported"
            @click="reportSubject(subject.id)"
          >
            {{ subject.isReported ? '已举报' : '举报' }}
          </button>
        </div>
        
        <!-- 主体图片和评分 - 三七分布局 -->
        <div class="subject-details">
          <!-- 主体图片容器 - 占据30%宽度，始终显示以保持布局一致 -->
          <div class="subject-image-container">
            <img v-if="subject.imageUrl" :src="processImageUrl(subject.imageUrl)" :alt="subject.name" class="subject-image">
            <!-- 无图片时的占位区域 -->
            <div v-else class="subject-image-placeholder"></div>
          </div>
          
          <!-- 评分块 -->
        <div class="rating-block">
          <!-- 评分数字 - 居中 -->
          <div class="rating-score-center">评分: <span class="rating-value">{{ getFormattedScore(subject.averageScore) }}</span></div>
          <!-- 评分人数 - 居中 -->
          <div class="rating-count-center"><span class="rating-value">{{ subject.customerNumText }}</span>人参评</div>
          <!-- 创建时间 - 右下角 -->
          <div class="create-time-bottom">{{ formatDate(subject.createTime) }}</div>
        </div>
        </div>
      </div>
      
      <!-- 评分区块 -->
      <div class="rating-section">
        <!-- 评分交互区域 -->
        <div class="rating-interaction">
          <!-- 评分选择器 - 居中 -->
          <div class="rating-selector-center" :class="{ active: isModifyMode }">
            <!-- 五个评分圆点 -->
            <div 
              v-for="index in 5" 
              :key="index"
              class="dot"
              :class="{ active: index <= currentRating }"
              @click="setRating(index)"
            ></div>
          </div>
          
          <!-- 评分按钮 - 居中 -->
          <div class="rating-actions-center">
            <!-- 修改模式显示取消和确认按钮 -->
            <div v-if="isModifyMode" class="modify-mode-buttons">
              <button class="action-btn cancel-btn" @click="cancelModify">取消</button>
              <button class="action-btn confirm-btn" @click="submitRating">确认</button>
            </div>
            <!-- 非修改模式显示修改按钮 -->
            <button v-else class="action-btn modify-btn-center" @click="toggleModify">修改</button>
          </div>
        </div>
      </div>
      
      <!-- 评论区块 -->
      <div class="comments-section">
        <!-- 评论标签 -->
        <div class="comments-tabs">
          <!-- 左侧：相关评论标题 -->
          <div class="related-comments-title">
            相关评论<span class="comment-count">（<span class="count-text">{{ subject.commentSumText || '0' }}</span>）</span>
          </div>
          
          <!-- 右侧：标签按钮 -->
          <div class="tab-buttons-right">
            <button 
              class="tab-btn" 
              :class="{ active: commentTab === 'default' }"
              @click="switchCommentTab('default')"
            >
              默认
            </button>
            <button 
              class="tab-btn" 
              :class="{ active: commentTab === 'latest' }"
              @click="switchCommentTab('latest')"
            >
              最新
            </button>
          </div>
        </div>
        
        <!-- 发表评论输入框 - 单独一行 -->
        <div class="comment-input-row">
          <div class="comment-input-box" @click="showNewCommentBox">
            <div class="input-placeholder">发表我的看法</div>
          </div>
        </div>
        
        <!-- 评论列表 - 滚动区域 -->
        <div class="comments-scroll-container">
          <div class="comments-list">
            <div 
              v-for="comment in comments" 
              :key="comment.id" 
              class="comment-item"
            >
              <!-- 用户名头部 - 左右布局 -->
              <div class="comment-header-new">
                <!-- 左侧：用户名 -->
                <div class="user-name-left">
                  {{ truncateUserName(comment.userName) }}
                </div>
                
                <!-- 右侧：日期和举报按钮 -->
                <div class="header-right">
                  <div class="comment-time-top">{{ formatDate(comment.createTime) }}</div>
                  <div class="report-button" @click="reportComment(comment.id)">举报</div>
                </div>
              </div>
              
              <!-- 主体内容区 - 三七分布局 -->
              <div class="comment-main-new">
                <!-- 左侧 - 占据30% -->
                <div class="comment-left-new">
                  <!-- 上半部分：圆形头像，居中 -->
                  <div class="avatar-container">
                    <div class="user-avatar-new" :data-initials="getInitials(comment.userName)">
                      <img :src="comment.userAvatar || getDefaultAvatar()" :alt="comment.userName" class="avatar-image-new">
                    </div>
                  </div>
                  
                  <!-- 下半部分：点赞区域 -->
                  <div class="like-area-new">
                    <div class="like-count-new">{{ comment.likeCount }}</div>
                    <div 
                      class="like-button-new"
                      :class="{ liked: comment.isLiked }"
                      @click="toggleCommentLike(comment)"
                    >
                      {{ comment.isLiked ? '已点赞' : '点赞' }}
                    </div>
                  </div>
                </div>
                
                <!-- 右侧 - 占据70% -->
                <div class="comment-right-new">
                  <!-- 上半部分 - 占据80%：评论内容 -->
                  <div class="comment-content-container">
                    <!-- 评论内容 -->
                    <div 
                      class="comment-content-new" 
                      :class="{ 'expanded': comment.expanded }"
                      @click="showReplyBox(comment)"
                    >
                      {{ getCommentContent(comment) }}
                    </div>
                    
                    <!-- 展开/收起按钮 -->
                    <div 
                      v-if="needExpandButton(comment)" 
                      class="expand-button-new"
                      @click.stop="toggleCommentExpand(comment)"
                    >
                      {{ comment.expanded ? '收起' : '展开' }}
                    </div>
                  </div>
                  
                  <!-- 下半部分 - 占据20%：查看回复按钮 -->
                  <div 
                    v-if="comment.replyCount > 0" 
                    class="reply-more-new"
                    @click="viewCommentReplies(comment.id)"
                  >
                    点击查看{{ comment.replyNumText }}条评论 >
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 加载状态 -->
            <div v-if="loading" class="loading">加载中...</div>
            <div v-if="!loading && comments.length === 0" class="empty">暂无评论</div>
          </div>
        </div>
        
        <!-- 分页器 -->
        <div class="pagination-container">
          <Pagination
            :current-page="currentPage"
            :total-pages="totalPages"
            :page-size="pageSize"
            @page-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>
      </div>
    </div>
    
    <!-- 回复输入组件 -->
    <ReplyInput
      :visible="showReplyInput"
      :reply-to-user="replyToUserName"
      :is-reply-mode="!!replyToComment"
      @cancel="cancelReply"
      @submit="submitReply"
    />
    
    <!-- 评论审核中弹窗 -->
    <div v-if="showReviewDialog" class="dialog-overlay" @click="closeReviewDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">提示</div>
        <div class="dialog-message">评论审核中...</div>
        <div class="dialog-buttons">
          <div class="confirm-button-red" @click="closeReviewDialog">确定</div>
        </div>
      </div>
    </div>
    
    <!-- 公共举报确认弹窗 -->
    <ReportDialog 
      :visible="showReportDialog"
      :target-type="reportTargetType"
      @cancel="closeReportConfirmDialog"
      @confirm="confirmReport"
    />
  </div>
</template>

<script>
// SubjectDetail.vue - 主体详情页面
// 功能：展示主体详情、评分功能、评论列表展示
// 设计要点：
// 1. 顶部红色固定栏
// 2. 主体详情（名称、图片、评分三七分布局）
// 3. 评分系统（五颗圆点评分，点击右侧圆点会激活左侧所有圆点）
// 4. 评分操作按钮（修改、评分）
// 5. 评论列表展示与分页
// 6. 回复评论功能（点击评论内容触发回复输入框）
import { subjectApi } from '../api/index.js'
import { formatDate } from '../utils/date.js'
import { processImageUrl, getDefaultAvatar } from '../utils/image.js'
import Pagination from '../components/Pagination.vue'
import ReplyInput from '../components/ReplyInput.vue'
import ReportDialog from '@/components/ReportDialog.vue'

export default {
  name: 'SubjectDetail',
  components: {
    Pagination,
    ReplyInput,
    ReportDialog
  },
  data() {
    return {
      subjectId: null,
      index: null, // 新增：用于定位一级评论的索引参数
      subject: {
        id: '',
        name: '',
        imageUrl: '',
        averageScore: 0,
        customerNum: 0,
        commentCount: 0
      },
      comments: [],
      currentRating: 0,
      userRating: 0, // 用户当前的评分
      isModifyMode: false,
      commentTab: 'default',
      loading: false,
      scrollLoading: false, // 滚动加载状态
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalComments: 0, // 总评论数
      hasNextPage: false, // 是否有下一页
      scoreDistribution: [], // 评分分布
      // 回复相关数据
      showReplyInput: false,
      replyToComment: null,
      replyToUserName: '',
      // 评论审核中弹窗状态
      showReviewDialog: false,
      // 举报确认弹窗相关状态
      showReportDialog: false, // 举报确认弹窗显示状态
      reportTargetId: null, // 举报目标ID
      reportTargetType: null // 举报目标类型：'subject'或'comment'
    }
  },
  mounted() {
    // 从路由参数获取主体ID
    this.subjectId = this.$route.params.id
    // 从路由查询参数获取索引参数
    this.index = this.$route.query.index ? parseInt(this.$route.query.index) : null
    
    console.log('主体详情页mounted，路由参数:', this.$route.params, '查询参数:', this.$route.query)
    console.log('获取到的主体ID:', this.subjectId)
    
    if (this.subjectId) {
      console.log('开始获取主体详情数据...')
      // 获取主体详情数据，已经包含一级评论
      this.fetchSubjectDetailData()
      
      // 每次进入主体页面时调用getUserScore接口获取用户评分
      this.fetchUserRating()
    } else {
      console.error('主体ID为空，无法获取数据')
    }
    
    // 添加滚动事件监听
    this.$nextTick(() => {
      const container = this.$el.querySelector('.comments-scroll-container')
      if (container) {
        container.addEventListener('scroll', this.handleScroll)
      }
    })
  },
  
  beforeDestroy() {
    // 移除滚动事件监听
    const container = this.$el.querySelector('.comments-scroll-container')
    if (container) {
      container.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    // 处理图片URL
    // 功能：处理图片URL，确保经过代理
    processImageUrl(imageUrl) {
      if (!imageUrl) {
        return '';
      }
      
      // 如果已经是完整URL，直接返回
      if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
      }
      
      // 如果是相对路径，添加代理前缀
      // 后端图片路径以 /image 开头
      if (imageUrl.startsWith('/image')) {
        return imageUrl;
      }
      
      // 如果是不完整的路径，添加 /image 前缀
      return `/image/${imageUrl}`;
    },
    
    // 格式化评分
    // 功能：安全地处理评分显示，避免toFixed错误
    getFormattedScore(score) {
      if (score === null || score === undefined || isNaN(score)) {
        return '0.0';
      }
      
      // 确保是数字类型
      const numScore = Number(score);
      if (isNaN(numScore)) {
        return '0.0';
      }
      
      return numScore.toFixed(1);
    },
    
    // 滚动定位到指定索引的一级评论
    // 功能：根据传入的索引（从1开始）滚动到对应的一级评论块，并添加高亮效果
    // 参数：index - 评论索引（从1开始计数）
    locateCommentByIndex(index) {
      // 检查索引是否有效
      if (index < 1 || index > this.comments.length) {
        this.$toast(`索引 ${index} 超出范围，当前共有 ${this.comments.length} 条评论`)
        return
      }
      
      this.$nextTick(() => {
        // 获取滚动容器
        const scrollContainer = this.$el.querySelector('.comments-scroll-container')
        if (!scrollContainer) {
          this.$toast('滚动容器未找到')
          return
        }
        
        // 获取所有一级评论项
        const commentItems = scrollContainer.querySelectorAll('.comment-item')
        if (commentItems.length === 0) {
          this.$toast('未找到评论项')
          return
        }
        
        // 清除之前的高亮效果
        commentItems.forEach(item => {
          item.classList.remove('highlighted-comment')
        })
        
        // 获取目标评论项（索引从1开始，数组索引从0开始）
        const targetIndex = index - 1
        const targetItem = commentItems[targetIndex]
        
        if (!targetItem) {
          this.$toast(`未找到索引为 ${index} 的评论项`)
          return
        }
        
        // 添加高亮效果
        targetItem.classList.add('highlighted-comment')
        
        // 计算滚动位置
        const containerRect = scrollContainer.getBoundingClientRect()
        const itemRect = targetItem.getBoundingClientRect()
        const scrollTop = scrollContainer.scrollTop
        const targetTop = scrollTop + (itemRect.top - containerRect.top) - 20 // 减去20px留出顶部间距
        
        // 平滑滚动到目标位置
        scrollContainer.scrollTo({
          top: targetTop,
          behavior: 'smooth'
        })
        
        // 3秒后移除高亮效果
        setTimeout(() => {
          targetItem.classList.remove('highlighted-comment')
        }, 3000)
      })
    },
    
    // 获取评论内容
    // 功能：根据评论类型处理评论内容显示，并实现字数截断功能
    // 统一逻辑：一级评论和二级评论都遵循相同的截断规则
    getCommentContent(comment) {
      let content = comment.content || ''
      
      // 如果内容需要截断且未展开，则截断到80字
      if (this.needExpandButton(comment) && !comment.expanded) {
        // 获取纯文本内容进行截断
        const plainText = comment.content.replace(/<[^>]*>/g, '').trim()
        const truncatedText = plainText.substring(0, 80) + '...'
        return truncatedText
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
    // 功能：根据内容长度决定是否默认截断显示
    // 逻辑：超过80字默认截断为3行，不超过80字完整显示
    shouldCollapse(comment) {
      if (!comment.content) return false
      
      // 获取纯文本内容（排除HTML标签）
      const plainText = comment.content.replace(/<[^>]*>/g, '').trim()
      
      // 超过80字默认截断，不超过80字完整显示
      return plainText.length > 80
    },
    
    // 切换评论展开状态
    // 功能：点击展开/收起按钮时切换评论的显示状态
    toggleCommentExpand(comment) {
      this.$set(comment, 'expanded', !comment.expanded);
    },
    
    // 获取主体详情数据
    // API: GET /thing/{id}
    // 功能：根据主体ID获取主体详情信息
    // 对接后端ThingController的get方法
    fetchSubjectDetail() {
      if (!this.subjectId) {
        this.$toast('主体ID不存在');
        this.$router.back();
        return;
      }
      
      this.loading = true;
      
      // 调用后端API获取主体详情
      subjectApi.getSubjectDetail(this.subjectId)
        .then(response => {
          this.loading = false;
          
          if (response.hasSuccessed && response.data) {
            // 使用后端返回的真实数据
            const subjectData = response.data;
            
            // 更新subject对象
            this.subject = {
              id: subjectData.id || this.subjectId,
              name: subjectData.name || '',
              // 直接使用customerNumText字段
              customerNumText: subjectData.customerNumText,
              imageUrl: processImageUrl(subjectData.photoUrl) || '',
              averageScore: Number(subjectData.averageScore) || 0, // 确保转换为数字类型，避免toFixed错误
              customerNum: subjectData.customerNum || 0,
              commentCount: subjectData.commentSum || 0
            };
            
            // 设置评分分布
            this.scoreDistribution = [
              { score: 5, count: Math.floor(Math.random() * 50) + 10 },
              { score: 4, count: Math.floor(Math.random() * 30) + 5 },
              { score: 3, count: Math.floor(Math.random() * 20) + 5 },
              { score: 2, count: Math.floor(Math.random() * 10) + 1 },
              { score: 1, count: Math.floor(Math.random() * 5) + 1 }
            ];
          } else {
            this.$toast(response.message || '获取主体详情失败');
          }
        })
        .catch(error => {
          this.loading = false;
          console.error('获取主体详情失败:', error);
          this.$toast('获取主体详情失败，请稍后重试');
        });
    },
    
    // 获取一级评论分页列表（已弃用，请使用fetchComments方法）
    // 功能：此方法已弃用，统一使用fetchComments方法处理评论数据
    fetchT1Comments(pageNum = this.currentPage, pageSize = this.pageSize) {
      console.warn('fetchT1Comments方法已弃用，请使用fetchComments方法')
      // 直接调用fetchComments方法，确保逻辑一致性
      this.fetchComments()
    },
    
    // 获取主体详情页完整数据
    // 功能：同时获取主体详情、举报状态和一级评论列表
    fetchSubjectDetailData() {
      if (!this.subjectId) {
        this.$toast('主体ID不存在');
        this.$router.back();
        return;
      }
      
      console.log('开始调用fetchSubjectDetailData，主体ID:', this.subjectId)
      this.loading = true;
      
      // 并发请求：主体详情、举报状态和一级评论列表
      // 根据当前标签决定排序参数
      const orderByCreateTimeDesc = this.commentTab === 'latest'
      
      console.log('发起API请求，主体详情API: /thing/' + this.subjectId)
      Promise.all([
        subjectApi.getSubjectDetail(this.subjectId),
        subjectApi.getUserReportStatus(this.subjectId), // 获取举报状态
        subjectApi.getT1Comments(this.subjectId, 1, this.pageSize, orderByCreateTimeDesc)
      ])
        .then(([subjectResponse, reportResponse, commentResponse]) => {
          this.loading = false;
          
          console.log('API请求完成，主体详情响应:', subjectResponse)
          console.log('举报状态响应:', reportResponse)
          console.log('评论列表响应:', commentResponse)
          
          // 处理主体详情响应
          if (subjectResponse.hasSuccessed && subjectResponse.data) {
            const subjectData = subjectResponse.data;
            console.log('获取到主体详情数据:', subjectData)
            
            // 处理举报状态响应
            let isReported = false;
            if (reportResponse.hasSuccessed) {
              // 根据后端UserAgainstServiceImpl.get方法，返回1表示已举报，0表示未举报
              isReported = reportResponse.data === 1;
            }
            
            // 更新subject对象
            this.subject = {
              id: subjectData.id || this.subjectId,
              name: subjectData.name || '',
              // 直接使用customerNumText字段 - 显示"x人参评"
              customerNumText: subjectData.customerNumText || '',
              // 添加commentSumText字段 - 显示评论总数文本
              commentSumText: subjectData.commentSumText || '0',
              imageUrl: processImageUrl(subjectData.photoUrl) || '',
              averageScore: subjectData.averageScore || 0,
              customerNum: subjectData.customerNum || 0,
              commentCount: subjectData.commentSum || 0,
              createTime: subjectData.createTime || '', // 添加创建时间字段
              isReported: isReported // 使用后端返回的举报状态
            };
            
            // 设置评分分布
            this.scoreDistribution = [
              { score: 5, count: Math.floor(Math.random() * 50) + 10 },
              { score: 4, count: Math.floor(Math.random() * 30) + 5 },
              { score: 3, count: Math.floor(Math.random() * 20) + 5 },
              { score: 2, count: Math.floor(Math.random() * 10) + 1 },
              { score: 1, count: Math.floor(Math.random() * 5) + 1 }
            ];
          } else {
            this.$toast(subjectResponse.message || '获取主体详情失败');
          }
          
          // 处理评论列表响应
          if (commentResponse.hasSuccessed && commentResponse.data) {
            const commentData = commentResponse.data;
            
            // 设置一级评论列表
              if (commentData.list && commentData.list.length > 0) {
                this.comments = commentData.list.map(comment => ({
                  id: comment.id,
                  userId: comment.userId,
                  userName: comment.userName || '匿名用户',
                  userAvatar: processImageUrl(comment.photoUrl) || getDefaultAvatar(),
                  content: comment.content || '',
                  likeCount: comment.likeNum || 0,
                  replyCount: comment.replyNum || 0,
                  replyNumText: comment.replyNumText || '0', // 新增回复数量文本字段
                  createTime: comment.createTime ? this.formatDate(comment.createTime) : '',
                  isLiked: comment.liked === 1 // 使用后端返回的liked属性，1表示已点赞，0表示未点赞
                }));
              
              // 设置分页信息 - 确保数字类型转换
              // 修复bug：前端应该保持自己的currentPage状态，不依赖后端返回的current字段
              // 因为后端可能返回错误的current值（如11），导致分页异常
              // this.currentPage = parseInt(commentData.current) || 1; // 注释掉这行，不更新currentPage
              this.totalPages = parseInt(commentData.pages) || 1;
              this.totalComments = parseInt(commentData.total) || 0;
              this.hasNextPage = Boolean(commentData.hasNext) || false;
              console.log('API返回的current字段:', commentData.current, '前端保持的currentPage:', this.currentPage);
              
              // 注意：后端已经根据orderByCreateTimeDesc参数进行了排序，不再需要前端排序
              // 避免重复排序导致数据混乱
              console.log('fetchSubjectDetailData: 后端已排序，跳过前端排序');
              
              // 新增：数据加载完成后，如果有index参数，则执行滚动定位
              if (this.index !== null) {
                this.$nextTick(() => {
                  this.locateCommentByIndex(this.index);
                });
              }
            } else {
              this.comments = [];
              this.currentPage = 1;
              this.totalPages = parseInt(commentData.pages) || 1;
              this.totalComments = parseInt(commentData.total) || 0;
              this.hasNextPage = Boolean(commentData.hasNext) || false;
            }
          } else {
            this.$toast(commentResponse.message || '获取评论列表失败');
          }
        })
        .catch(error => {
          this.loading = false;
          console.error('获取主体详情页数据失败:', error);
          console.error('错误详情:', error.response || error.message);
          this.$toast('获取主体详情页数据失败，请稍后重试');
        });
    },
    
    // 获取用户评分
    // API: GET /score?thingId={thingId} (ThingUserScoreController的getUserScore方法)
    // 功能：获取当前用户对于主体的评分，返回0代表未评分，正常1-5
    fetchUserRating() {
      subjectApi.getUserScore(this.subjectId)
        .then(response => {
          if (response.hasSuccessed) {
            // 后端直接返回0-5的评分值，0代表未评分，1-5代表具体评分
            const score = response.data || 0
            this.userRating = score
            this.currentRating = score
            console.log('获取用户评分成功:', score)
          } else {
            console.error('获取用户评分失败:', response.message)
          }
        })
        .catch(error => {
          console.error('获取用户评分失败:', error)
        })
    },
    
    // 设置评分
    setRating(rating) {
      // 只有在修改模式下才能设置评分
      if (this.isModifyMode) {
        this.currentRating = rating
      }
    },
    
    // 切换修改模式
    toggleModify() {
      this.isModifyMode = true
      // 进入修改模式时，使用当前用户评分
      this.currentRating = this.userRating
    },
    
    // 取消修改
    cancelModify() {
      this.isModifyMode = false
      // 恢复为原始用户评分
      this.currentRating = this.userRating
    },
    
    // 提交评分
    // API: POST /score (ThingUserScoreController的insertOrUpdateScore方法)
    // 功能：提交或更新用户对主体的评分，评分值1-5
    submitRating() {
      // 后端直接使用1-5的评分系统，不需要转换
      const score = this.currentRating
      
      subjectApi.submitRating(this.subjectId, score)
        .then(response => {
          if (response.hasSuccessed) {
            // 更新用户评分
            this.userRating = this.currentRating
            
            // 退出修改模式
            this.isModifyMode = false
            
            // 刷新主体详情
            this.fetchSubjectDetailData()
            
            this.$toast('评分成功')
          } else {
            console.error('提交评分失败:', response.message)
            this.$toast(response.message || '评分失败')
          }
        })
        .catch(error => {
          console.error('提交评分失败:', error)
          this.$toast('评分失败，请稍后重试')
        })
    },
    
    // 切换评论点赞状态
    // API: POST /like/t1Comment/confirm 或 /like/t1Comment/cancel
    // 功能：点赞或取消点赞一级评论
    // 对接T1CommentUserLikeController的confirmLike和cancelLike方法
    toggleCommentLike(comment) {
      if (comment.isLiked) {
        // 取消点赞 - 调用cancelLike接口
        subjectApi.cancelT1CommentLike(comment.id)
          .then((response) => {
            // 请求成功后，检查后端返回的状态
            if (response.hasSuccessed) {
              comment.isLiked = false
              comment.likeCount--
              this.$toast('取消点赞成功')
            } else {
              console.error('取消点赞失败:', response.message)
              this.$toast(response.message || '取消点赞失败')
            }
          })
          .catch(error => {
            console.error('取消评论点赞失败:', error)
            this.$toast('取消点赞失败，请稍后重试')
          })
      } else {
        // 点赞 - 调用confirmLike接口
        subjectApi.likeT1Comment(comment.id)
          .then((response) => {
            // 请求成功后，检查后端返回的状态
            if (response.hasSuccessed) {
              comment.isLiked = true
              comment.likeCount++
              this.$toast('点赞成功')
            } else {
              console.error('点赞失败:', response.message)
              this.$toast(response.message || '点赞失败')
            }
          })
          .catch(error => {
            console.error('评论点赞失败:', error)
            this.$toast('点赞失败，请稍后重试')
          })
      }
    },
    
    // 截断用户名，最多显示10个字符
    truncateUserName(userName) {
      if (!userName) return ''
      return userName.length > 10 ? userName.substring(0, 10) + '...' : userName
    },
    
    // 获取用户名首字母，用于默认头像显示
    getInitials(userName) {
      if (!userName) return ''
      return userName.charAt(0).toUpperCase()
    },
    
    // 查看评论回复
    // 功能：跳转到评论详情页，同时传递一级评论ID和主体ID
    viewCommentReplies(commentId) {
      // 跳转到评论详情页，同时传递commentId和thingId（即当前主体ID）
      this.$router.push(`/comment/${commentId}?thingId=${this.subjectId}`)
    },
    
    // 举报评论
    // API: PUT /against
    // 功能：举报评论（只能举报一次）
    // 对接后端UserAgainstController的against方法
    reportComment(commentId) {
      // 显示举报确认弹窗
      this.showReportConfirmDialog('comment', commentId)
    },
    
    // 实际执行评论举报请求
    reportCommentRequest(commentId) {
      // 调用后端UserAgainstController的against方法
      // 传递objectId（评论ID）和type（一级评论类型为5）
      subjectApi.reportComment(commentId)
        .then((response) => {
          // 请求成功后，检查后端返回的状态
          if (response.hasSuccessed) {
            this.$toast('举报成功，我们会尽快处理');
            console.log('举报评论成功');
          } else {
            console.error('举报评论失败:', response.message);
            this.$toast(response.message || '举报失败，请稍后重试');
          }
        })
        .catch(error => {
          console.error('举报评论失败:', error);
          this.$toast('举报失败，请稍后重试');
        });
    },
    
    // 举报主体
    // API: PUT /against
    // 功能：举报主体（只能举报一次）
    // 对接后端UserAgainstController的against方法
    // 参数：objectId（主体ID）和type（主体类型为4）
    reportSubject(subjectId) {
      // 如果已经举报过，直接返回
      if (this.subject.isReported) {
        this.$toast('您已经举报过该主体');
        return;
      }
      
      // 显示举报确认弹窗
      this.showReportConfirmDialog('subject', subjectId)
    },
    
    // 显示举报确认弹窗
    showReportConfirmDialog(type, targetId) {
      this.reportTargetType = type
      this.reportTargetId = targetId
      this.showReportDialog = true
    },
    
    // 关闭举报确认弹窗
    closeReportConfirmDialog() {
      this.showReportDialog = false
      this.reportTargetType = null
      this.reportTargetId = null
    },
    
    // 确认举报
    confirmReport() {
      if (!this.reportTargetId || !this.reportTargetType) return
      
      // 根据举报类型调用不同的举报API
      if (this.reportTargetType === 'subject') {
        this.reportSubjectRequest(this.reportTargetId)
      } else if (this.reportTargetType === 'comment') {
        this.reportCommentRequest(this.reportTargetId)
      }
      
      // 关闭弹窗
      this.closeReportConfirmDialog()
    },
    
    // 实际执行主体举报请求
    reportSubjectRequest(subjectId) {
      // 如果已经举报过，直接返回
      if (this.subject.isReported) {
        this.$toast('您已经举报过该主体');
        return;
      }
      
      // 调用后端UserAgainstController的against方法
      // 传递objectId（主体ID）和type（主体类型为4）
      subjectApi.reportSubject(subjectId)
        .then((response) => {
          // 请求成功后，检查后端返回的状态
          if (response.hasSuccessed) {
            // 更新举报状态
            this.subject.isReported = true;
            this.$toast('举报成功，我们会尽快处理');
            console.log('举报主体成功');
          } else {
            console.error('举报主体失败:', response.message);
            this.$toast(response.message || '举报失败，请稍后重试');
          }
        })
        .catch(error => {
          console.error('举报主体失败:', error);
          this.$toast('举报失败，请稍后重试');
        });
    },
    
    // 切换评论标签
    switchCommentTab(tab) {
      // 只有在标签真正改变时才重新加载数据
      if (this.commentTab !== tab) {
        this.commentTab = tab
        // 保持当前页码，只重新请求评论数据以应用排序
        // 不再重置到第一页，提升用户体验
        this.fetchComments()
      }
    },
    
    // 对评论进行排序（已弃用，因为后端已经完成排序）
    // 注意：后端API已经根据orderByCreateTimeDesc参数进行了排序
    // 前端不需要再次排序，否则会导致排序结果混乱
    sortComments() {
      // 此方法已弃用，后端API已经完成排序
      // 保留方法以防其他地方有调用
      console.warn('sortComments方法已弃用，后端API已经完成排序')
    },
    
    // 获取评论列表
    // API: GET /t1comment?id={thingId}&pageNum={pageNum}&pageSize={pageSize}&orderByCreateTimeDesc={orderByCreateTimeDesc}
    // 功能：获取主体的一级评论列表，支持分页和排序
    // 对接后端T1CommentController的selectPage方法
    // 参数说明：orderByCreateTimeDesc=true表示按创建时间倒序（最新排序），false或不传表示默认排序（热度优先）
    fetchComments(isLoadMore = false) {
      if (!this.subjectId) {
        this.$toast('主体ID不存在');
        return;
      }
      
      this.loading = true
      
      // 根据当前标签决定排序参数
      const orderByCreateTimeDesc = this.commentTab === 'latest'
      
      console.log('请求评论数据，排序参数:', orderByCreateTimeDesc, '页码:', this.currentPage)
      
      // 调用新的T1Comments API，传递排序参数
      subjectApi.getT1Comments(
        this.subjectId, 
        this.currentPage, 
        this.pageSize,
        orderByCreateTimeDesc
      )
        .then(response => {
          if (response.hasSuccessed && response.data) {
            const commentData = response.data;
            
            // 设置一级评论列表
            if (commentData.list && commentData.list.length > 0) {
              const newComments = commentData.list.map(comment => ({
                id: comment.id,
                userId: comment.userId,
                userName: comment.userName || '匿名用户',
                userAvatar: processImageUrl(comment.photoUrl) || getDefaultAvatar(),
                content: comment.content || '',
                likeCount: comment.likeNum || 0,
                replyCount: comment.replyNum || 0,
                replyNumText: comment.replyNumText || '0', // 新增回复数量文本字段
                createTime: comment.createTime ? this.formatDate(comment.createTime) : '',
                isLiked: comment.liked === 1 // 使用后端返回的liked属性，1表示已点赞，0表示未点赞
              }));
              
              // 修复分页逻辑：每次翻页都应该替换整个评论列表，而不是追加
              // 这样才能正确显示当前页的数据
              this.comments = newComments;
              
              // 设置分页信息 - 确保数字类型转换
              this.currentPage = parseInt(commentData.current) || 1;
              this.totalPages = parseInt(commentData.pages) || 1;
              this.totalComments = parseInt(commentData.total) || 0;
              this.hasNextPage = Boolean(commentData.hasNext) || false;
              
              console.log('获取评论数据成功，数量:', this.comments.length, '排序方式:', this.commentTab)
              
              // 注意：后端API已经根据orderByCreateTimeDesc参数完成了排序
              // 前端不需要再次排序，否则会导致排序结果混乱
              // 已移除sortComments()调用
              
            } else {
              // 没有评论数据
              this.comments = [];
              this.currentPage = this.currentPage;
              this.totalPages = parseInt(commentData.pages) || 1;
              this.totalComments = parseInt(commentData.total) || 0;
              this.hasNextPage = Boolean(commentData.hasNext) || false;
            }
          } else {
            // API调用失败，显示错误信息
            this.$toast(response.message || '获取评论列表失败');
            
            // 清空评论列表
            this.comments = []
          }
        })
        .catch(error => {
          console.error('获取评论列表失败:', error);
          this.$toast('获取评论列表失败，请稍后重试');
          
          // 清空评论列表
          this.comments = []
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    // 滚动事件处理 - 已禁用无缝加载，仅保留基本功能
    handleScroll() {
      // 禁用无缝加载功能，仅保留基本滚动处理
      // 分页器已启用，不再需要滚动加载更多
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      
      // 简单的日期格式化函数
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      return `${year}-${month}-${day}`
    },
    
    // 返回上一页
    goBack() {
      this.$router.back()
    },
    
    // 显示回复输入框
    // 功能：点击评论内容时触发，显示回复输入框
    showReplyBox(comment) {
      this.replyToComment = comment
      this.replyToUserName = comment.userName
      this.showReplyInput = true
    },
    
    // 显示发表评论输入框
    // 功能：点击"发表我的看法"输入框时触发，显示评论输入框
    showNewCommentBox() {
      this.replyToComment = null // 表示发表新评论，不是回复
      this.replyToUserName = ''
      this.showReplyInput = true
    },
    
    // 取消回复
    // 功能：关闭回复输入框
    cancelReply() {
      this.showReplyInput = false
      this.replyToComment = null
      this.replyToUserName = ''
    },
    
    // 提交回复/评论
    // API: POST /comment/create (T1CommentController的insert方法)
    // 功能：提交评论内容到后端
    submitReply(content) {
      // 如果replyToComment为null，表示发表新评论
      if (!this.replyToComment) {
        // 调用API发表评论
        subjectApi.submitComment(this.subjectId, content)
          .then(response => {
            // 评论成功后，显示"评论审核中..."弹窗
            this.showReviewDialog = true
            
            // 关闭输入框
            this.cancelReply()
          })
          .catch(error => {
            console.error('发表评论失败:', error)
            this.$toast('发表评论失败，请稍后重试')
          })
      } else {
        // 调用API提交二级评论回复
        // 对接后端T2CommentController的insert方法
        // 参数：主体id、一级评论id、被回复的用户id、回复内容、replyType
        // replyType说明：1-回复一级评论，2-回复二级评论
        // 注意：回复一级评论时，replyUserId是一级评论的用户id；回复二级评论时，replyUserId是二级评论的用户id
        // 注意：一级评论id始终传递一级评论的id，不随回复类型变化
        subjectApi.submitReply(
          this.subjectId,                    // 主体id
          this.replyToComment.id,            // 一级评论id
          this.replyToComment.userId,        // 被回复的用户id（回复一级评论时是一级评论的用户id）
          content,                           // 回复内容
          1                                  // 回复类型：1-回复一级评论
        )
          .then(response => {
            if (response.hasSuccessed) {
              // 回复成功，显示"评论审核中..."弹窗
              this.showReviewDialog = true
              
              // 关闭回复输入框
              this.cancelReply()
              
              // 不刷新评论列表，因为回复是在评论详情页显示的
            } else {
              // 显示回复失败提示
              this.$toast(response.message || '回复失败')
              console.error('回复失败:', response.message)
            }
          })
          .catch(error => {
            console.error('提交回复失败:', error)
            this.$toast('回复失败，请稍后重试')
          })
      }
    },
    
    // 关闭评论审核中弹窗
    closeReviewDialog() {
      this.showReviewDialog = false
    },
    
    // 设置模拟数据
    // 设置模拟数据 - 已弃用，现在使用真实API数据
    // 保留此方法以防其他地方有调用
    setMockData() {
      console.warn('setMockData方法已弃用，现在使用fetchSubjectDetailData获取真实数据');
      this.fetchSubjectDetailData();
    },
    
    // 设置模拟评论数据 - 已弃用，现在使用真实API数据
    // 保留此方法以防其他地方有调用
    setMockComments(isLoadMore = false) {
      console.warn('setMockComments方法已弃用，现在使用fetchComments获取真实数据');
      this.fetchComments(isLoadMore);
    },
    
    // 分页器事件处理 - 页码变化
    // 功能：处理分页器页码变化事件，重新加载对应页面的评论数据
    handlePageChange(page) {
      console.log('分页器页码变化事件触发，目标页码:', page, '当前页码:', this.currentPage);
      
      // 更新当前页码
      this.currentPage = page;
      
      // 重新加载评论数据
      this.fetchT1Comments(page, this.pageSize);
    },
    
    // 分页器事件处理 - 每页显示条数变化
    // 功能：处理每页显示条数变化事件，重新加载第一页的评论数据
    handlePageSizeChange(pageSize, page = 1) {
      console.log('分页器每页条数变化事件触发，目标条数:', pageSize, '目标页码:', page);
      
      // 更新每页显示条数
      this.pageSize = pageSize;
      
      // 重置到第一页
      this.currentPage = page;
      
      // 重新加载评论数据
      this.fetchT1Comments(page, pageSize);
    }
  }
}
</script>

<style scoped>
/* 主体详情页面容器 */
.subject-detail-container {
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 顶部标题栏 - 红色固定 */
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 44px;
  background-color: #FF0000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  color: #ffffff;
  font-size: 18px;
  font-weight: bold;
  z-index: 1000;
}

/* 返回按钮 */
.back-button {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 占位元素，保持标题居中 */
.placeholder {
  width: 24px;
}

/* 主体内容区域 */
.subject-content {
  padding-top: 44px;
  padding-bottom: 0; /* 移除底部留白 */
  background-color: #f8f8f8; /* 添加背景色，与评论区形成对比 */
}

/* 主体信息块 */
.subject-block {
  background-color: #ffffff;
  padding: 16px;
  margin: 0 12px 16px 12px; /* 增加左右边距，添加更大的下边距 */
  border-radius: 8px; /* 添加圆角 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  border: 1px solid #e0e0e0; /* 添加边框 */
}

/* 主体标题行 - 同一行，左右布局 */
.subject-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

/* 举报按钮 - 右上角样式 */
.report-button-top-right {
  font-size: 14px;
  color: #999999;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  margin-left: 8px;
}

.report-button-top-right:active {
  background-color: #e8e8e8;
}

/* 举报按钮已举报状态 */
.report-button-top-right.reported {
  color: #999999;
  border-color: #e0e0e0;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 主体名称 */
.subject-title {
  font-size: 20px;
  font-weight: bold;
  color: #000000;
  margin: 0;
  line-height: 1.4;
  word-wrap: break-word;
  overflow-wrap: break-word;
  flex: 1;
  margin-right: 8px;
}

/* 图片和评分的左右布局容器 */
.subject-details {
  display: flex;
  width: 100%; /* 占满整个宽度 */
  gap: 12px;
}

/* 主体图片容器 - 占据30%宽度 */
.subject-image-container {
  width: 30%;
  height: 120px; /* 固定高度，确保容器大小一致 */
  flex-shrink: 0;
  overflow: hidden; /* 确保超出部分被裁剪 */
}

/* 主体图片 */
.subject-image {
  width: 100%;
  height: 100%; /* 填充整个容器 */
  object-fit: cover; /* 保持宽高比，裁剪超出部分 */
  object-position: center; /* 居中显示 */
  border-radius: 4px;
  border: 1px solid #cccccc; /* 添加灰边描边 */
}

/* 主体图片占位区域 */
.subject-image-placeholder {
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

/* 评分块 */
.rating-block {
  width: 70%;
  margin-top: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative; /* 为创建时间定位提供参照 */
}

/* 评分分数 - 调整字体大小 - 居中 */
.rating-score-center {
  font-size: 28px; /* 从36px调整为28px，减小字体大小 */
  font-weight: bold;
  color: #000000; /* 恢复为黑色 */
  line-height: 1;
  margin-bottom: 14px; /* 从10px调整为14px，进一步增加与评分人数的间距 */
  text-align: center;
}

/* 评分人数 - 调整字体大小 - 居中 */
.rating-count-center {
  font-size: 16px; /* 从14px调整为16px，增大字体大小 */
  color: #000000; /* 恢复为黑色 */
  text-align: center;
}

/* 创建时间 - 右下角 */
.create-time-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 12px;
  color: #999999;
  margin-top: 8px;
}

/* 评分数值 - 红色 */
.rating-value {
  color: #FF0000; /* 红色 */
}

/* 评分区块 */
.rating-section {
  background-color: #ffffff;
  padding: 16px;
  margin: 0 12px 16px 12px; /* 增加左右边距，添加更大的下边距 */
  border-radius: 8px; /* 添加圆角 */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
  border: 1px solid #e0e0e0; /* 添加边框 */
}

/* 评分交互区域 */
.rating-interaction {
  margin-top: 0;
}

/* 评分选择器 - 居中 */
.rating-selector-center {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  cursor: not-allowed;
  justify-content: center;
  /* 不铺满宽度，只显示五个圆点的宽度 */
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

/* 评分选择器激活状态 */
.rating-selector-center.active {
  cursor: pointer;
}

/* 评分圆点 */
.dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: #e0e0e0;
  transition: background-color 0.2s ease;
}

/* 评分圆点激活状态 */
.dot.active {
  background-color: #FFD700;
}

/* 评分操作按钮 */
/* 操作按钮 - 旧样式，已不再使用 */
.action-btn {
  flex: 1;
  padding: 8px 0;
  margin: 0 8px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #666666;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 评分按钮居中容器 */
.rating-actions-center {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* 修改模式按钮组 */
.modify-mode-buttons {
  display: flex;
  gap: 12px;
}

/* 居中修改按钮 */
.modify-btn-center {
  flex: none; /* 覆盖.action-btn的flex: 1属性，让按钮只占用必要空间 */
  padding: 8px 20px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #666666;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 取消按钮 */
.cancel-btn {
  padding: 8px 24px;
  border: 1px solid #e0e0e0;
  background-color: #ffffff;
  color: #666666;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 确认按钮 */
.confirm-btn {
  padding: 8px 24px;
  border: 1px solid #FF0000;
  background-color: #FF0000;
  color: #ffffff;
  font-size: 14px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

/* 按钮悬停效果 */
.modify-btn-center:hover,
.cancel-btn:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.confirm-btn:hover {
  background-color: #e60000;
  border-color: #e60000;
}

/* 评论区块 */
.comments-section {
  background-color: #ffffff;
  padding: 16px 16px 0 16px; /* 移除底部padding */
  margin: 0; /* 移除所有边距 */
  border-top: 8px solid #f0f0f0; /* 添加顶部粗边框作为分隔 */
}

/* 分页器容器 */
.pagination-container {
  margin-top: 16px;
  padding-top: 16px;
  padding-bottom: 0; /* 移除底部padding */
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: center;
}

/* 发表评论输入框行 */
.comment-input-row {
  margin-bottom: 16px;
}

/* 发表评论输入框 */
.comment-input-box {
  padding: 12px 16px;
  background-color: #f5f5f5;
  border-radius: 20px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 输入框占位符 */
.input-placeholder {
  font-size: 14px;
  color: #999999;
}

/* 输入框悬停效果 */
.comment-input-box:hover {
  background-color: #eeeeee;
}

/* 评论标签容器 */
.comments-tabs {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px; /* 添加底部边距 */
}

/* 相关评论标题 */
.related-comments-title {
  font-size: 16px;
  font-weight: bold;
  color: #000000; /* 黑色 */
}

/* 评论数量 */
.comment-count {
  color: #000000; /* 黑色 */
}

/* 数量文本 - 红色 */
.count-text {
  color: #FF0000; /* 红色 */
}

/* 右侧标签按钮容器 */
.tab-buttons-right {
  display: flex;
  gap: 12px;
}

/* 评论标签按钮 */
.tab-btn {
  padding: 4px 8px;
  border: none;
  background-color: transparent;
  color: #666666;
  font-size: 14px;
  cursor: pointer;
  transition: color 0.2s ease;
}

/* 评论标签按钮激活状态 */
.tab-btn.active {
  color: #FF0000;
}

/* 评论列表 - 滚动容器 */
.comments-scroll-container {
  height: 600px; /* 增加评论区域高度，显示更多评论 */
  overflow-y: auto; /* 垂直滚动 */
  padding: 8px 0;
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* Webkit浏览器滚动条样式 */
.comments-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.comments-scroll-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.comments-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.comments-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 评论列表 */
.comments-list {
  padding: 0 8px; /* 添加内边距，使内容不贴边 */
}

/* 评论项 */
.comment-item {
  padding: 10px; /* 从16px缩小到10px，减少内边距 */
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); /* 增强阴影效果 */
  transition: transform 0.2s ease, box-shadow 0.2s ease; /* 添加过渡效果 */
}

/* 评论项悬停效果 */
.comment-item:hover {
  transform: translateY(-2px); /* 悬停时轻微上移 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); /* 悬停时增强阴影 */
}

/* 最后一个评论项不显示底部分割线 */
.comment-item:last-child {
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 0;
}

/* 用户名头部 - 左右布局 */
.comment-header-new {
  display: flex;
  justify-content: space-between;
  align-items: center; /* 从flex-start改为center，使用户名上下居中 */
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

/* 主体内容区 - 三七分布局 */
.comment-main-new {
  display: flex;
  gap: 12px;
  width: 100%;
  position: relative; /* 为绝对定位的子元素提供参照 */
}

/* 左侧 - 占据25% */
.comment-left-new {
  width: 25%; /* 从30%缩小到25%，减少左右宽度 */
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-left: 0; /* 减少左侧内边距，使头像离左侧边界更近 */
  margin-left: -8px; /* 左移整个左侧块 */
}

/* 上半部分：头像容器 */
.avatar-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px; /* 减少下边距，使头像与用户名更近 */
  margin-top: -4px; /* 上移头像，使其与用户名更近 */
}

/* 用户头像 - 圆形居中，参考"我的"页头像框样式，使用圆框红边 */
.user-avatar-new {
  width: 40px;
  height: 40px; /* 固定高度，确保容器大小一致 */
  border-radius: 50%;
  border: 2px solid #ff3b30; /* 添加红色边框，与"我的"页保持一致 */
  overflow: hidden; /* 确保超出部分被裁剪 */
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ff3b30; /* 背景色改为红色，与"我的"页保持一致 */
  position: relative;
}

/* 头像图片 */
.avatar-image-new {
  width: 100%;
  height: 100%; /* 填充整个容器 */
  object-fit: cover; /* 保持宽高比，裁剪超出部分 */
  object-position: center; /* 居中显示 */
}

/* 当没有头像时的默认文本 - 参考"我的"页头像框样式 */
.user-avatar-new::before {
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
  font-size: 16px; /* 根据头像大小调整字体大小 */
  font-weight: bold;
  opacity: 0;
  pointer-events: none;
}

.user-avatar-new:empty::before,
.user-avatar-new img[src=""]::before {
  opacity: 1;
}

/* 下半部分：点赞区域 */
.like-area-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
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
  width: 75%; /* 从70%增加到75%，与左侧块调整相匹配 */
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 上半部分：评论内容容器 */
.comment-content-container {
  flex: 9; /* 增加内容区域占比 */
}

/* 评论内容 - 完全照搬话题块实现 */
.comment-content-new {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0;
  margin: 0;
  /* 彻底修复省略号缝隙问题 - 完全照搬话题块实现 */
  position: relative;
  word-break: break-word;
  /* 确保文本紧密排列，无额外空间 */
  white-space: normal;
  word-spacing: 0;
  letter-spacing: 0;
  /* 使用新属性增强兼容性 */
  line-clamp: 3;
  /* 确保背景色覆盖整个区域，避免缝隙显示 */
  background-color: #ffffff;
  /* 防止最后一行出现不完整字符 */
  -webkit-hyphens: none;
  hyphens: none;
  /* 添加点击效果 */
  cursor: pointer;
  transition: background-color 0.2s ease;
}

/* 评论内容点击效果 */
.comment-content-new:hover {
  background-color: #f5f5f5;
}

/* 展开状态下的评论内容 */
.comment-content-new.expanded {
  -webkit-line-clamp: unset;
  display: block;
  overflow: visible;
  /* 展开时移除渐变背景 */
  background: transparent;
}

/* 展开状态下隐藏伪元素 */
.comment-content-new.expanded::after {
  display: none;
}

/* 展开/收起按钮 */
.expand-button-new {
  font-size: 14px;
  color: #0066CC;
  cursor: pointer;
  margin-top: -4px; /* 减少与文本的间距 */
  margin-bottom: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  transition: all 0.2s ease;
  /* 添加下划线，使其更像链接 */
  text-decoration: underline;
  /* 增加字体粗细 */
  font-weight: 500;
}

/* 展开/收起按钮悬停效果 */
.expand-button-new:hover {
  background-color: rgba(0, 102, 204, 0.1);
}

/* 下半部分：查看回复按钮 - 固定在comment-main-new右下角 */
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

/* 分页器容器 */
.pagination {
  margin-top: 16px;
}

/* 加载状态 */
.loading {
  text-align: center;
  padding: 16px;
  color: #999999;
  font-size: 14px;
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 32px 16px;
  color: #999999;
  font-size: 14px;
}

/* 高亮评论项样式 */
.comment-item.highlighted-comment {
  background-color: #fff9c4 !important;
  border: 2px solid #ffd54f !important;
  border-radius: 8px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 0 10px rgba(255, 213, 79, 0.5) !important;
}

/* 测试定位按钮样式 */
.test-locate-buttons {
  display: flex;
  gap: 8px;
  margin: 8px 0;
  padding: 0 16px;
}

.test-btn {
  padding: 4px 8px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.test-btn:hover {
  background-color: #e0e0e0;
}

/* 响应式适配 - iPhone 12 Pro */
@media screen and (max-width: 390px) {
  .subject-details {
    gap: 8px;
  }
  
  .rating-score {
    font-size: 32px;
  }
  
  .rating-dots {
    gap: 10px;
  }
  
  .dot {
    width: 18px;
    height: 18px;
  }
}

/* 评论审核中弹窗样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.dialog-content {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 24px;
  width: 80%;
  max-width: 300px;
  text-align: center;
}

.dialog-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 16px;
  color: #333333;
}

.dialog-message {
  font-size: 16px;
  color: #666666;
  margin-bottom: 24px;
  line-height: 1.5;
}

.dialog-buttons {
  display: flex;
  justify-content: center;
}

.confirm-button-red {
  background-color: #FF0000;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex: 1;
}

.confirm-button-red:hover {
  background-color: #CC0000;
}
</style>