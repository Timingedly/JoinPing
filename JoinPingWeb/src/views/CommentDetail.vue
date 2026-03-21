<template>
  <div class="comment-detail-container">
    <!-- 顶部标题栏 -->
    <div class="top-bar">
      <div class="back-button" @click="goBack">
        <span>&lt;</span>
      </div>
      <div class="title">评论详情</div>
      <div class="placeholder"></div>
    </div>
    
    <!-- 评论内容区域 - 如果任意请求失败，整个页面空白 -->
    <div v-if="!errorDialogVisible && mainComment.id" class="comment-content">
      <!-- 一级评论块 -->
      <div class="main-comment-block">
        <!-- 用户名头部 - 左右布局 -->
        <div class="comment-header-new">
          <!-- 左侧：用户名 -->
          <div class="user-name-left">
            {{ truncateUserName(mainComment.userName) }}
          </div>
          
          <!-- 右侧：日期和举报按钮 -->
          <div class="header-right">
            <div class="comment-time-top">{{ formatDate(mainComment.createTime) }}</div>
            <div 
              class="report-button" 
              :class="{ 'reported': mainComment.isReported }"
              @click="reportComment(mainComment.id)"
            >
              {{ mainComment.isReported ? '已举报' : '举报' }}
            </div>
          </div>
        </div>
        
        <!-- 主体内容区 - 三七分布局 -->
        <div class="comment-main-new">
          <!-- 左侧 - 占据30% -->
          <div class="comment-left-new">
            <!-- 上半部分：圆形头像，居中 -->
            <div class="avatar-container">
              <div class="user-avatar-new">
                <img :src="mainComment.userAvatar || '/default-avatar.jpg'" :alt="mainComment.userName" class="avatar-image-new">
              </div>
            </div>
            
            <!-- 下半部分：点赞区域 -->
            <div class="like-area-new">
              <div class="like-count-new">{{ mainComment.likeCount }}</div>
              <div 
                class="like-button-new"
                :class="{ liked: mainComment.isLiked }"
                @click="toggleCommentLike(mainComment)"
              >
                {{ mainComment.isLiked ? '已点赞' : '点赞' }}
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
                  :class="{ 'expanded': mainComment.expanded || !shouldCollapse(mainComment) }"
                  @click="showReplyToMain"
                >
                  {{ getCommentContent(mainComment) }}
                </div>
                
                <!-- 展开/收起按钮 -->
                <div 
                  v-if="needExpandButton(mainComment)" 
                  class="expand-button-new"
                  @click.stop="toggleCommentExpand(mainComment)"
                >
                  {{ mainComment.expanded ? '收起' : '展开' }}
                </div>
              </div>
            
            <!-- 注意：这里没有查看回复按钮，因为已经在回复页面 -->
          </div>
        </div>
      </div>
      
      <!-- 回复区块 -->
      <div class="replies-section">
        <div class="replies-header">
          <div class="replies-title">相关回复<span class="reply-bracket">（</span><span class="reply-count">{{ mainComment.replyCount }}</span><span class="reply-bracket">）</span></div>
        </div>
        
        <!-- 二级评论列表 - 滚动区域 -->
        <div class="replies-scroll-container">
          <div class="replies-list">
            <!-- 增强加载状态显示 -->
            <div v-if="loading" class="loading enhanced-loading">
              <div class="loading-spinner"></div>
              <div class="loading-text">正在加载回复...</div>
            </div>
            
            <!-- 使用通用评论布局组件 -->
            <div 
              v-for="reply in replies" 
              :key="reply.id" 
              class="reply-item"
            >
              <CommentLayout
                :comment="reply"
                :show-like-area="false"
                :show-reply-button="false"
                @toggle-expand="toggleCommentExpand"
                @report="reportReply"
                @content-click="showReplyToReply"
              />
            </div>
            
            <div v-if="!loading && replies.length === 0" class="empty">暂无回复</div>
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
    
    <!-- 空白页面状态 - 当任意请求失败时显示 -->
    <div v-if="errorDialogVisible" class="blank-page">
      <!-- 空白页面，只显示错误弹窗 -->
    </div>
    
    <!-- 回复输入组件 -->
    <ReplyInput
      :visible="showReplyInput"
      :reply-to-user="replyToUserName"
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
    
    <!-- 错误弹窗 -->
    <div v-if="errorDialogVisible" class="dialog-overlay" @click="hideErrorDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-title">提示</div>
        <div class="dialog-message">{{ errorMessage }}</div>
        <div class="dialog-buttons">
          <div class="confirm-button-red" @click="hideErrorDialog">确定</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// CommentDetail.vue - 评论详情页面
// 功能：展示一级评论及其二级评论列表
// 设计要点：
// 1. 顶部红色固定栏
// 2. 一级评论块（与主体页相似，但没有查看回复按钮）
// 3. 回复标题（显示回复数量）
// 4. 二级评论列表（没有点赞和查看回复功能）
// 5. 二级评论分页器
// 6. 回复评论功能（点击评论内容触发回复输入框）
import { subjectApi } from '../api/index.js'
import { formatDate } from '../utils/date.js'
import Pagination from '../components/Pagination.vue'
import ReplyInput from '../components/ReplyInput.vue'
import CommentLayout from '../components/CommentLayout.vue'
import ReportDialog from '@/components/ReportDialog.vue'

export default {
  name: 'CommentDetail',
  components: {
    Pagination,
    ReplyInput,
    CommentLayout,
    ReportDialog
  },
  data() {
    return {
      commentId: null,
      thingId: null, // 新增：一级评论所在主体的ID
      index: null, // 新增：用于定位二级评论的索引参数
      mainComment: {
        id: '',
        userName: '',
        userAvatar: '',
        content: '',
        createTime: '',
        likeCount: 0,
        isLiked: false,
        replyCount: 0,
        expanded: false
      },
      replies: [],
      loading: false,
      scrollLoading: false, // 滚动加载状态
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      // 回复相关数据
      showReplyInput: false,
      replyToComment: null,
      replyToUserName: '',
      replyType: 'main', // 'main' 表示回复一级评论，'reply' 表示回复二级评论
      // 评论审核中弹窗状态
      showReviewDialog: false,
      // 举报确认弹窗状态
      showReportDialog: false,
      reportTargetId: null,
      reportTargetType: null, // 'comment' 或 'reply'
      // 错误弹窗状态
      errorDialogVisible: false,
      errorMessage: ''
    }
  },
  mounted() {
    // 从路由参数获取评论ID
    this.commentId = this.$route.params.id
    // 从路由查询参数获取主体ID和索引参数
    this.thingId = this.$route.query.thingId
    this.index = this.$route.query.index ? parseInt(this.$route.query.index) : null
    
    if (this.commentId && this.thingId) {
      this.fetchCommentDetailData()
    } else {
      this.$toast('缺少必要的参数')
      this.$router.back()
    }
    
    // 添加滚动事件监听
    this.$nextTick(() => {
      const scrollContainer = this.$el.querySelector('.replies-scroll-container')
      if (scrollContainer) {
        scrollContainer.addEventListener('scroll', this.handleScroll)
      }
    })
  },
  
  beforeDestroy() {
    // 移除滚动事件监听
    const scrollContainer = this.$el.querySelector('.replies-scroll-container')
    if (scrollContainer) {
      scrollContainer.removeEventListener('scroll', this.handleScroll)
    }
  },
  methods: {
    // 滚动定位到指定索引的二级评论
    // 功能：根据传入的索引（从1开始）滚动到对应的二级评论块，并添加高亮效果
    // 参数：index - 评论索引（从1开始计数）
    locateReplyByIndex(index) {
      // 检查索引是否有效
      if (index < 1 || index > this.replies.length) {
        this.$toast(`索引 ${index} 超出范围，当前共有 ${this.replies.length} 条回复`)
        return
      }
      
      this.$nextTick(() => {
        // 获取滚动容器
        const scrollContainer = this.$el.querySelector('.replies-scroll-container')
        if (!scrollContainer) {
          this.$toast('滚动容器未找到')
          return
        }
        
        // 获取所有二级评论项
        const replyItems = scrollContainer.querySelectorAll('.reply-item')
        if (replyItems.length === 0) {
          this.$toast('未找到评论项')
          return
        }
        
        // 清除之前的高亮效果
        replyItems.forEach(item => {
          item.classList.remove('highlighted-comment')
        })
        
        // 获取目标评论项（索引从1开始，数组索引从0开始）
        const targetIndex = index - 1
        const targetItem = replyItems[targetIndex]
        
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
    
    // 获取评论详情页完整数据
    // API: GET /t1comment/{id} (T1CommentController的get方法)
    // API: GET /t2comment?id={t1commentId}&thingId={thingId}&pageNum={pageNum}&pageSize={pageSize} (T2CommentController的selectPage方法)
    // 功能：获取一级评论详情和二级评论数据
    // 需求：如果任意请求失败，整个页面空白，显示错误弹窗"评论不存在或已被删除"
    fetchCommentDetailData() {
      this.loading = true
      
      // 同时发送两个请求：获取一级评论详情和二级评论列表
      Promise.all([
        subjectApi.getT1CommentDetail(this.commentId),
        subjectApi.getT2Comments(this.commentId, this.thingId, this.currentPage, this.pageSize)
      ])
        .then(([commentResponse, repliesResponse]) => {
          // 检查两个请求是否都成功
          const isCommentSuccess = commentResponse.hasSuccessed && commentResponse.data
          const isRepliesSuccess = repliesResponse.hasSuccessed && repliesResponse.data
          
          // 如果任意一个请求失败，清空页面数据并显示错误弹窗
          if (!isCommentSuccess || !isRepliesSuccess) {
            this.mainComment = {
              id: '',
              userId: '',
              userName: '',
              userAvatar: '',
              content: '',
              createTime: '',
              likeCount: 0,
              isLiked: false,
              replyCount: 0,
              expanded: false
            }
            this.replies = []
            this.loading = false
            this.errorMessage = '评论不存在或已被删除'
            this.errorDialogVisible = true
            return
          }
          
          // 两个请求都成功，正常设置数据
          const commentData = commentResponse.data
          this.mainComment = {
            id: commentData.id || this.commentId,
            userId: commentData.userId || '61390509976883200', // 一级评论的用户ID，用于回复时传递replyUserId参数
            userName: commentData.userName || '匿名用户',
            userAvatar: commentData.photoUrl || '/default-avatar.jpg',
            content: commentData.content || '',
            createTime: commentData.createTime || '',
            likeCount: commentData.likeNum || 0,
            isLiked: commentData.liked === 1,
            replyCount: commentData.replyNum || 0,
            expanded: false
          }
          
          const repliesData = repliesResponse.data
          const newReplies = (repliesData.list || []).map(reply => ({
            id: reply.id,
            userId: reply.userId || `61390509976883${reply.id}`, // 二级评论的用户ID，用于回复时传递replyUserId参数
            userName: reply.userName || '匿名用户',
            userAvatar: reply.photoUrl || '/default-avatar.jpg',
            content: reply.content || '',
            createTime: reply.createTime || '',
            replyType: reply.replyType || 1, // 回复类型：1-回复一级评论，2-回复二级评论
            replyUserName: reply.replyUserName || '', // 被回复的用户名
            expanded: false
          }))
          
          this.replies = newReplies
          this.totalPages = Number(repliesData.pages) || 1
          // 不覆盖用户选择的页码，保持当前页码不变
          // this.currentPage = repliesData.current || 1
          this.hasNextPage = repliesData.hasNext || false
          
          this.loading = false
          
          // 数据加载完成后，如果有index参数，调用定位方法
          if (this.index && this.index > 0) {
            this.$nextTick(() => {
              this.locateReplyByIndex(this.index)
            })
          }
        })
        .catch(error => {
          this.loading = false
          console.error('获取评论详情失败:', error)
          // 清空页面数据
          this.mainComment = {
            id: '',
            userId: '',
            userName: '',
            userAvatar: '',
            content: '',
            createTime: '',
            likeCount: 0,
            isLiked: false,
            replyCount: 0,
            expanded: false
          }
          this.replies = []
          // 显示错误弹窗"评论不存在或已被删除"
          this.errorMessage = '评论不存在或已被删除'
          this.errorDialogVisible = true
        })
    },
    
    // 获取二级评论列表
    // API: GET /t2comment?id={t1commentId}&thingId={thingId}&pageNum={pageNum}&pageSize={pageSize}
    // 功能：获取评论的回复列表，支持分页
    // 对接后端T2CommentController的selectPage方法
    fetchReplies(isLoadMore = false) {
      this.loading = true
      
      // 调用真实API获取二级评论列表，传递thingId参数
      subjectApi.getT2Comments(this.commentId, this.thingId, this.currentPage, this.pageSize)
        .then(response => {
          this.loading = false
          
          if (response.hasSuccessed && response.data) {
            const repliesData = response.data
            const newReplies = (repliesData.list || []).map(reply => ({
              id: reply.id,
              userId: reply.userId || `61390509976883${reply.id}`, // 二级评论的用户ID，用于回复时传递replyUserId参数
              userName: reply.userName || '匿名用户',
              userAvatar: reply.photoUrl || '/default-avatar.jpg',
              content: reply.content || '',
              createTime: reply.createTime || '',
              replyType: reply.replyType || 1, // 回复类型：1-回复一级评论，2-回复二级评论
              replyUserName: reply.replyUserName || '', // 被回复的用户名
              expanded: false // 确保所有二级评论默认都是收起状态
            }))
            
            // 如果是加载更多，追加到现有列表；否则替换列表
            if (isLoadMore) {
              this.replies = [...this.replies, ...newReplies]
            } else {
              this.replies = newReplies
            }
            
            // 设置分页信息
            this.totalPages = Number(repliesData.pages) || 1
            // 不覆盖用户选择的页码，保持当前页码不变
            // this.currentPage = repliesData.current || 1
            this.hasNextPage = repliesData.hasNext || false
          } else {
            this.$toast(response.message || '获取回复列表失败')
            // 如果获取失败，使用模拟数据作为降级方案
            this.setMockReplies(isLoadMore)
          }
        })
        .catch(error => {
          this.loading = false
          console.error('获取回复列表失败:', error)
          this.$toast('获取回复列表失败，请稍后重试')
          // 如果API调用失败，使用模拟数据作为降级方案
          this.setMockReplies(isLoadMore)
        })
    },
    
    // 滚动事件处理 - 已禁用无缝加载，仅保留基本功能
    handleScroll() {
      // 禁用无缝加载功能，仅保留基本滚动处理
      // 分页器已启用，不再需要滚动加载更多
    },
    
    // 加载更多评论 - 已禁用滚动加载功能
    // 保留方法以防其他地方有调用
    loadMoreReplies() {
      console.warn('loadMoreReplies方法已禁用，请使用分页器进行分页操作');
    },
    
    // 切换一级评论点赞状态
    // API: POST /like/t1Comment/confirm 或 /like/t1Comment/cancel (T1CommentUserLikeController)
    // 功能：点赞或取消点赞一级评论
    toggleCommentLike(comment) {
      // 调用真实API进行点赞/取消点赞操作
      const apiCall = comment.isLiked 
        ? subjectApi.cancelT1CommentLike(comment.id) 
        : subjectApi.likeT1Comment(comment.id)
      
      apiCall
        .then(response => {
          if (response.hasSuccessed) {
            // API调用成功，更新本地状态
            if (comment.isLiked) {
              comment.isLiked = false
              comment.likeCount--
              this.$toast('取消点赞成功')
            } else {
              comment.isLiked = true
              comment.likeCount++
              this.$toast('点赞成功')
            }
          } else {
            this.$toast(response.message || '操作失败')
          }
        })
        .catch(error => {
          console.error('点赞操作失败:', error)
          this.$toast('操作失败，请稍后重试')
        })
        .catch(error => {
          console.error('点赞操作失败:', error)
          // TODO: 显示操作失败提示
        })
    },
    
    // 获取评论内容
    // 功能：根据评论类型处理评论内容显示，并实现字数截断功能
    // 需求：二级评论块中获取content字段的字数，如果大于80就截断并且同时显示展开/收起按钮
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
    // 逻辑：默认不截断，只有点击按钮时才截断为3行
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
    // 确保一级评论和二级评论的展开/收起效果完全同步
    toggleCommentExpand(comment) {
      // 如果传递的是评论对象，直接设置
      if (typeof comment === 'object' && comment.id) {
        this.$set(comment, 'expanded', !comment.expanded);
      } else {
        // 如果传递的是评论ID，需要找到对应的评论对象
        // 先检查是否是二级评论
        const reply = this.replies.find(r => r.id === comment);
        if (reply) {
          this.$set(reply, 'expanded', !reply.expanded);
        } else {
          // 如果是一级评论
          this.$set(this.mainComment, 'expanded', !this.mainComment.expanded);
        }
      }
    },
    
    // 截断用户名，最多显示10个字符
    truncateUserName(userName) {
      if (!userName) return ''
      return userName.length > 10 ? userName.substring(0, 10) + '...' : userName
    },
    
    // 举报评论
    // API: PUT /against
    // 对接后端: UserAgainstController.against
    // 参数: { objectId: commentId, type: 5 } (type=5对应一级评论)
    reportComment(commentId) {
      // 如果是一级评论，检查mainComment的举报状态
      if (this.mainComment.id === commentId) {
        if (this.mainComment.isReported) {
          this.$toast('您已经举报过该评论');
          return;
        }
      }
      
      // 显示举报确认弹窗
      this.showReportConfirmDialog('comment', commentId)
    },
    
    // 显示举报确认弹窗
    showReportConfirmDialog(type, targetId) {
      this.reportTargetType = type
      this.reportTargetId = targetId
      this.showReportDialog = true
    },
    
    // 公共举报确认弹窗 - 关闭
    closeReportConfirmDialog() {
      this.showReportDialog = false
      this.reportTargetId = null
      this.reportTargetType = null
    },
    
    // 显示错误弹窗
    showErrorDialog(message) {
      this.errorMessage = message
      this.errorDialogVisible = true
    },
    
    // 隐藏错误弹窗
    hideErrorDialog() {
      this.errorDialogVisible = false
      this.errorMessage = ''
    },
    
    // 确认举报
    confirmReport() {
      if (!this.reportTargetId || !this.reportTargetType) return
      
      // 根据举报类型调用不同的举报API
      if (this.reportTargetType === 'comment') {
        this.reportCommentRequest(this.reportTargetId)
      } else if (this.reportTargetType === 'reply') {
        this.reportReplyRequest(this.reportTargetId)
      }
      
      // 关闭弹窗
      this.closeReportConfirmDialog()
    },
    
    // 实际执行评论举报请求
    reportCommentRequest(commentId) {
      // 如果是一级评论，检查mainComment的举报状态
      if (this.mainComment.id === commentId) {
        if (this.mainComment.isReported) {
          this.$toast('您已经举报过该评论');
          return;
        }
      }
      
      // 调用举报API
      subjectApi.reportComment(commentId)
        .then(response => {
          if (response.hasSuccessed) {
            // 更新举报状态
            if (this.mainComment.id === commentId) {
              this.$set(this.mainComment, 'isReported', true);
            }
            this.$toast('举报成功，我们会尽快处理')
          } else {
            this.$toast(response.message || '举报失败，请稍后重试')
          }
        })
        .catch(error => {
          console.error('举报评论失败:', error)
          this.$toast('举报失败，请稍后重试')
        })
    },
    
    // 举报回复
    // API: PUT /against
    // 对接后端: UserAgainstController.against
    // 参数: { objectId: replyId, type: 6 } (type=6对应二级评论)
    reportReply(replyId) {
      // 查找回复对象
      const reply = this.replies.find(r => r.id === replyId);
      if (!reply) return;
      
      // 如果已经举报过，直接返回
      if (reply.isReported) {
        this.$toast('您已经举报过该回复');
        return;
      }
      
      // 显示举报确认弹窗
      this.showReportConfirmDialog('reply', replyId)
    },
    
    // 实际执行回复举报请求
    reportReplyRequest(replyId) {
      // 查找回复对象
      const reply = this.replies.find(r => r.id === replyId);
      if (!reply) return;
      
      // 如果已经举报过，直接返回
      if (reply.isReported) {
        this.$toast('您已经举报过该回复');
        return;
      }
      
      // 调用举报API
      subjectApi.reportReply(replyId)
        .then(response => {
          if (response.hasSuccessed) {
            // 更新举报状态
            this.$set(reply, 'isReported', true);
            this.$toast('举报成功，我们会尽快处理')
          } else {
            this.$toast(response.message || '举报失败，请稍后重试')
          }
        })
        .catch(error => {
          console.error('举报回复失败:', error)
          this.$toast('举报失败，请稍后重试')
        })
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
    
    // 显示回复输入框 - 回复一级评论
    // 功能：点击一级评论内容时触发，显示回复输入框
    showReplyToMain() {
      this.replyToComment = this.mainComment
      this.replyToUserName = this.mainComment.userName
      this.replyType = 'main'
      this.showReplyInput = true
    },
    
    // 显示回复输入框 - 回复二级评论
    // 功能：点击二级评论内容时触发，显示回复输入框
    showReplyToReply(reply) {
      this.replyToComment = reply
      this.replyToUserName = reply.userName
      this.replyType = 'reply'
      this.showReplyInput = true
    },
    
    // 取消回复
    // 功能：关闭回复输入框
    cancelReply() {
      this.showReplyInput = false
      this.replyToComment = null
      this.replyToUserName = ''
      this.replyType = 'main'
    },
    
    // 关闭评论审核中弹窗
    closeReviewDialog() {
      this.showReviewDialog = false
    },
    
    // 提交回复
    // API: PUT /t2comment (T2CommentController的insert方法)
    // 功能：提交回复内容到后端
    // 对接后端T2CommentController的insert方法
    // 参数：主体id、一级评论id、被回复的用户id、回复内容、replyType
    // replyType说明：1-回复一级评论，2-回复二级评论
    // 注意：回复一级评论时，replyUserId是一级评论的用户id；回复二级评论时，replyUserId是二级评论的用户id
    // 注意：一级评论id始终传递一级评论的id，不随回复类型变化
    submitReply(content) {
      if (!this.replyToComment) return
      
      // 根据replyType确定回复类型
      // replyType为'main'表示回复一级评论，replyType为'reply'表示回复二级评论
      const replyType = this.replyType === 'main' ? 1 : 2
      
      // 确定被回复的用户ID
      // 回复一级评论时：replyUserId是一级评论的用户ID
      // 回复二级评论时：replyUserId是二级评论的用户ID
      const replyUserId = this.replyType === 'main' ? this.mainComment.userId : this.replyToComment.userId
      
      // 一级评论id始终传递一级评论的id
      const t1commentId = this.mainComment.id
      
      // 调用API提交二级评论回复
      // 对接后端T2CommentController的insert方法
      // 参数：主体id、一级评论id、被回复的用户id、回复内容、replyType
      subjectApi.submitReply(
        this.thingId,                    // 主体id
        t1commentId,                      // 一级评论id（始终传递一级评论的id）
        replyUserId,                     // 被回复的用户id（回复一级评论时是一级评论的用户id，回复二级评论时是二级评论的用户id）
        content,                           // 回复内容
        replyType                          // 回复类型：1-回复一级评论，2-回复二级评论
      )
        .then(response => {
          if (response.hasSuccessed) {
            // 回复成功，显示"评论审核中..."弹窗
            this.showReviewDialog = true
            
            // 关闭回复输入框
            this.cancelReply()
            
            // 不刷新回复列表，因为回复需要审核
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
    },
    
    // 设置模拟数据
    setMockData() {
      this.mainComment = {
        id: this.commentId,
        userId: '61390509976883200', // 一级评论的用户ID，用于回复时传递replyUserId参数
        userName: '这是一个很长的用户名称测试',
        userAvatar: '/avatar1.jpg',
        content: '这家店真的很不错，口味正宗，服务态度也很好，强烈推荐！我已经去过很多次了，每次都很满意！他们的招牌菜红烧肉做得特别入味，肥而不腻，入口即化。环境也很舒适，装修风格简约而不失格调，适合朋友聚会或者家庭聚餐。服务员态度很热情，点餐时会根据人数给出合理建议，不会过度推销。价格也比较合理，性价比很高。唯一的小缺点是周末人比较多，可能需要等位，但为了美食值得等待！强烈推荐给喜欢中餐的朋友们！',
        createTime: '2025-10-05T10:30:00',
        likeCount: 128,
        isLiked: false,
        replyCount: 564,
        expanded: false
      }
      
      this.setMockReplies()
    },
    
    // 处理页码变化
    // 功能：处理分页器页码变化事件，重新加载对应页的二级评论数据
    // 参考主体详情页的一级评论分页器逻辑，确保pageNum参数正确传递
    handlePageChange(page) {
      console.log('评论详情页分页器页码变化事件触发，目标页码:', page, '当前页码:', this.currentPage);
      
      // 添加页面滚动到顶部的效果，让用户明显感知到页面刷新
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // 添加短暂的延迟，让用户看到页面正在刷新
      this.loading = true
      
      // 立即更新当前页码，确保fetchReplies使用正确的页码
      // 修复：直接使用传入的page参数，确保pageNum正确传递
      this.currentPage = page
      
      setTimeout(() => {
        this.fetchReplies(false) // 传递false表示不是加载更多，而是分页切换
      }, 100)
    },
    
    // 处理每页条数变化
    handlePageSizeChange(size) {
      // 添加页面滚动到顶部的效果，让用户明显感知到页面刷新
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      // 添加短暂的延迟，让用户看到页面正在刷新
      this.loading = true
      setTimeout(() => {
        this.pageSize = size
        this.currentPage = 1
        this.fetchReplies(false) // 传递false表示不是加载更多，而是分页切换
      }, 100)
    },
    

    
    // 设置模拟回复数据
    setMockReplies(isLoadMore = false) {
      // 模拟API延迟
      setTimeout(() => {
        // 生成更多模拟数据
        const mockReplies = []
        const startId = isLoadMore ? this.replies.length + 1 : 1
        const count = isLoadMore ? 10 : 10 // 每次加载10条
        
        for (let i = 0; i < count; i++) {
          const id = startId + i
          mockReplies.push({
            id: `r${id}`,
            userId: `61390509976883${id}`, // 二级评论的用户ID，用于回复时传递replyUserId参数
            userName: `用户${id}`,
            userAvatar: `/avatar${(id % 5) + 1}.jpg`,
            content: `这是第${id}条回复。这家店真的很不错，口味正宗，服务态度也很好，强烈推荐！我已经去过很多次了，每次都很满意！他们的招牌菜红烧肉做得特别入味，肥而不腻，入口即化。环境也很舒适，装修风格简约而不失格调，适合朋友聚会或者家庭聚餐。服务员态度很热情，点餐时会根据人数给出合理建议，不会过度推销。价格也比较合理，性价比很高。唯一的小缺点是周末人比较多，可能需要等位，但为了美食值得等待！强烈推荐给喜欢中餐的朋友们！`,
            createTime: `2025-10-${(id % 28) + 1}T${(id % 24)}:${(id % 60)}:00`,
            expanded: false
          })
        }
        
        if (isLoadMore) {
          // 加载更多时，追加到现有列表
          this.replies = [...this.replies, ...mockReplies]
        } else {
          // 首次加载时，替换列表
          this.replies = mockReplies
          this.currentPage = 1
        }
        
        // 计算总页数
        this.totalPages = Math.ceil(this.mainComment.replyCount / this.pageSize)
        
        // 重置加载状态
        this.loading = false
        this.scrollLoading = false
      }, 500)
    }
  }
}
</script>

<style scoped>
/* 评论详情页面容器 */
.comment-detail-container {
  background-color: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* 高亮评论项样式 */
.reply-item.highlighted-comment {
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
  margin-top: 8px;
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
.comment-content {
  padding-top: 44px;
  padding-bottom: 0; /* 移除底部留白 */
}

/* 一级评论块 */
.main-comment-block {
  background-color: #ffffff;
  padding: 16px;
  margin: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 回复区块 */
.replies-section {
  background-color: #ffffff;
  padding: 16px;
  margin: 0 12px 12px 12px;
  border: 2px solid #f0f0f0; /* 添加粗边框，与一级评论块形成明显差异 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 增强阴影效果，参考主体页设计 */
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

/* 回复头部 */
.replies-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f0f0f0; /* 加粗底部分隔线，增强视觉层次 */
}

/* 回复标题 */
.replies-title {
  font-size: 16px;
  font-weight: bold;
  color: #000000;
  padding-left: 4px; /* 添加左侧内边距，与主体页标题对齐 */
  border-left: 3px solid #ff3b30; /* 添加红色左侧边框，增强标题视觉冲击力 */
}

/* 回复数量 - 括号为黑色，括号内数字为红色 */
.reply-count {
  color: #FF0000;
}

/* 括号样式 - 黑色 */
.reply-bracket {
  color: #000000;
}

/* 回复列表容器 */
.replies-list {
  margin-bottom: 16px;
  padding: 0 8px; /* 添加左右内边距，使内容不贴边，避免与滚动条重叠 */
}

/* 滚动容器样式 */
.replies-scroll-container {
  height: 600px; /* 增加回复区域高度，显示更多回复 */
  overflow-y: auto;
  padding: 8px 0;
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* Webkit浏览器滚动条样式 */
.replies-scroll-container::-webkit-scrollbar {
  width: 6px;
}

.replies-scroll-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.replies-scroll-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.replies-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 回复项 - 使用CommentLayout组件，添加更明显的视觉差异 */
.reply-item {
  margin-bottom: 12px;
  padding: 8px;
  background-color: #fafafa; /* 浅灰色背景，与一级评论块形成差异 */
  border: 1px solid #e8e8e8; /* 添加边框 */
  border-radius: 6px;
  transition: all 0.2s ease; /* 添加过渡效果 */
}

/* 回复项悬停效果 */
.reply-item:hover {
  background-color: #f5f5f5;
  border-color: #d0d0d0;
  transform: translateY(-1px);
}

/* 最后一个回复项不显示底部分割线 */
.reply-item:last-child {
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

/* 用户头像 - 圆形居中，参考主体页头像框样式，使用圆框红边 */
.user-avatar-new {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #ff3b30; /* 添加红色边框，与主体页保持一致 */
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ff3b30; /* 背景色改为红色，与主体页保持一致 */
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

/* 评论内容 - 展开收起功能样式 */
/* 默认状态：超过80字自动截断为3行，不超过80字完整显示 */
.comment-content-new {
  font-size: 14px;
  color: #666666;
  line-height: 1.5;
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
  /* 默认截断为3行 */
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 增强加载状态 */
.enhanced-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin: 10px 0;
  border: 1px solid #e0e0e0;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #ff0000;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

.loading-text {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 空状态 */
.empty {
  text-align: center;
  padding: 32px 16px;
  color: #999999;
  font-size: 14px;
}

/* 响应式适配 - iPhone 12 Pro */
@media screen and (max-width: 390px) {
  .comment-main-new {
    gap: 8px;
  }
}

/* 评论审核中弹窗样式 - 与主体页保持一致 */
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