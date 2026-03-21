<template>
  <div class="topic-detail-container">
    <!-- 顶部标题栏 -->
    <div class="top-bar">
      <div class="back-button" @click="goBack">
        <span>&lt;</span>
      </div>
      <div class="title">话题</div>
      <div class="placeholder"></div>
    </div>
    
    <!-- 话题内容区域 - 外层容器 -->
    <div class="topic-content">
      <!-- 话题信息块 -->
      <div class="topic-block">
        <!-- 话题标题 -->
        <h1 class="topic-title">{{ topic.title }}</h1>
        
        <!-- 话题图片和简介 - 三七分布局 -->
        <div class="topic-details">
          <!-- 话题图片容器 - 占据30%宽度，始终显示以保持布局一致 -->
          <div class="topic-image-container">
            <img v-if="topic.imageUrl" :src="getFullImageUrl(topic.imageUrl)" :alt="topic.title" class="topic-image">
            <!-- 无图片时的占位区域 -->
            <div v-else class="topic-image-placeholder"></div>
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
        
        <!-- 操作按钮组 -->
        <div class="action-buttons">
          <button 
            class="action-btn" 
            :class="{ active: isCollected }" 
            @click="toggleCollect"
          >
            {{ isCollected ? '已收藏' : '收藏' }}
          </button>
          <button 
            class="action-btn" 
            :class="{ active: isLiked }" 
            @click="toggleLike"
          >
            {{ isLiked ? '已点赞' : '点赞' }}
          </button>
          <button 
            class="action-btn" 
            :class="{ disabled: isReported }" 
            :disabled="isReported" 
            @click="report"
          >
            {{ isReported ? '已举报' : '举报' }}
          </button>
        </div>
      </div>
      
      <!-- 主体列表区域 - 内层滚动容器 -->
      <div class="subjects-section" ref="subjectsSection">
        <h2 class="section-title">相关主体</h2>
        
        <!-- 主体列表 - 可滚动区域 -->
        <div class="subject-list-container">
          <div class="subject-list">
            <div 
              v-for="subject in subjects" 
              :key="subject.id" 
              class="subject-item"
              @click="goToSubjectDetail(subject.id)"
            >
              <!-- 主体名称 -->
              <div class="subject-name">
                {{ subject.name }}
                <span class="arrow">></span>
              </div>
              
              <!-- 主体图片和评分信息 -->
              <div class="subject-info">
                <!-- 主体图片 -->
                <div class="subject-image-container">
                  <img :src="getFullImageUrl(subject.imageUrl)" :alt="subject.name" class="subject-image">
                </div>
                
                <!-- 评分信息 - 上下平分 -->
                <div class="rating-info">
                  <div class="rating-score">评分: <span class="rating-value">{{ subject.averageScore.toFixed(1) }}</span></div>
                  <div class="rating-count"><span class="rating-value">{{ subject.customerNum }}</span>人参评</div>
                </div>
              </div>
              

            </div>
            
            <!-- 加载更多 -->
            <div v-if="loading" class="loading">加载中...</div>
            <div v-if="!loading && subjects.length === 0" class="empty">暂无相关主体</div>
          </div>
        </div>
      </div>
      
      <!-- 分页器 - 固定在底部 -->
      <div class="pagination-container" v-if="total > 0">
        <Pagination 
          :current-page="currentPage"
          :total-pages="totalPages"
          :page-size="pageSize"
          @page-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
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
// TopicDetail.vue - 话题详情页面
// 功能：展示话题详情、提供操作按钮、显示相关主体列表
// 设计要点：
// 1. 顶部红色固定栏
// 2. 话题详情（标题、图片、简介三七分布局）
// 3. 简介可展开/收起
// 4. 操作按钮（收藏、点赞、举报）
// 5. 相关主体列表展示
import { topicApi, subjectApi, userTopicViewHistoryApi } from '../api/index.js'
import { formatDate } from '../utils/date.js'
import Pagination from '@/components/Pagination.vue'
import ReportDialog from '@/components/ReportDialog.vue'

export default {
  components: {
    Pagination,
    ReportDialog
  },
  name: 'TopicDetail',
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
      subjects: [],
      isDescriptionExpanded: false,
      isCollected: false,
      isLiked: false,
      isReported: false,
      loading: false,
      currentPage: 1,
      pageSize: 10,
      hasMore: true,
      total: 0,
      showReportDialog: false, // 举报确认弹窗显示状态
      reportTargetId: null, // 举报目标ID
      reportTargetType: null // 举报目标类型：'topic'或'subject'
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
    // 计算总页数
    totalPages() {
      return Math.ceil(this.total / this.pageSize)
    }
  },
  mounted() {
    // 从路由参数获取话题ID
    this.topicId = this.$route.params.id
    if (this.topicId) {
      // 同时发起三个请求获取话题详情页完整数据
      this.fetchTopicDetailData()
    }
  },

  methods: {
    // 获取话题详情数据（第一次请求）
    async fetchTopicDetailData() {
      try {
        this.loading = true;
        
        // 并发请求：话题信息、点赞状态、收藏状态、举报状态
        const [topicResponse, likeResponse, favoriteResponse, reportResponse] = await Promise.all([
          topicApi.getTopicDetail(this.topicId),
          topicApi.getUserLikeStatus(this.topicId),
          topicApi.getUserFavoriteStatus(this.topicId),
          topicApi.getUserReportStatus(this.topicId)
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
        
        // 处理用户状态
        this.isLiked = likeResponse.hasSuccessed && likeResponse.data === true;
        this.isCollected = favoriteResponse.hasSuccessed && favoriteResponse.data === true;
        this.isReported = reportResponse.hasSuccessed && reportResponse.data === 1;
        
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
    
    // 获取主体列表数据（第二次请求）
    async fetchSubjectsData() {
      try {
        console.log('开始获取主体列表数据，topicId:', this.topicId);
        // 使用subjectApi.getSubjectList方法调用后端/thing接口
        const response = await subjectApi.getSubjectList(this.currentPage, this.pageSize, this.topicId);
        
        console.log('获取主体列表响应:', response);
        
        if (response.hasSuccessed && response.data && response.data.list && Array.isArray(response.data.list)) {
          // 首先检查数据结构
          if (response.data.list.length > 0) {
            console.log('第一个主体数据结构:', response.data.list[0]);
          }
          
          // 灵活处理不同的数据字段，确保兼容性
          this.subjects = response.data.list.map(item => ({
            id: item.id || Math.random().toString(36).substr(2, 9), // 确保有id
            name: item.name || '未命名主体',
            imageUrl: item.photoUrl || item.imageUrl || '/default-image.jpg',
            averageScore: Number(item.averageScore) || 0, // 确保转换为数字类型，避免toFixed错误
            customerNum: item.customerNumText || item.customerNum || item.ratingCount || 0, // 支持三种可能的字段名
            isReported: false // 默认未举报状态
          }));
          
          console.log('处理后的主体列表:', this.subjects);
          
          // 更新分页信息
          this.total = response.data.total || this.subjects.length;
          console.log('总条数:', this.total);
        } else {
          console.warn('响应数据不完整或请求失败，使用模拟数据');
          this.useMockData();
        }
      } catch (error) {
        console.error('获取主体列表失败:', error);
        console.log('使用模拟数据');
        this.useMockData();
      } finally {
        // 确保loading状态被正确设置，避免一直显示加载中
        this.loading = false;
      }
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
            averageScore: 9.9, // 数字类型
            customerNum: 2345
          },
          {
            id: '2',
            name: '老字号沙县拌面',
            imageUrl: '/shop2.jpg',
            averageScore: 9.7, // 数字类型
            customerNum: 1892
          },
          {
            id: '3',
            name: '福建沙县小吃王',
            imageUrl: '/shop3.jpg',
            averageScore: 9.5, // 数字类型
            customerNum: 1567
          }
        ];
        
        this.total = 3;
        
        // 默认都为未操作状态
        this.isLiked = false;
        this.isCollected = false;
        this.isReported = false;
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
    
    // 获取相关主体列表
    // 注意：此方法已不再使用，主体列表现在从话题详情的thingList字段获取
    // API: GET /topic/{id}/subjects?page={page}&size={size}
    // 功能：获取话题相关的主体列表，支持分页
    fetchSubjects() {
      // 此方法已废弃，保留作为参考
      if (this.loading || !this.hasMore) return
      
      this.loading = true
      topicApi.getTopicSubjects(this.topicId, this.currentPage, this.pageSize)
        .then(response => {
          if (response.data && response.data.success) {
            const newSubjects = response.data.data.list || []
            this.subjects = this.currentPage === 1 ? newSubjects : [...this.subjects, ...newSubjects]
            this.hasMore = newSubjects.length === this.pageSize
            this.currentPage++
          } else {
            // 模拟数据：由于没有真实后端，使用默认值
            this.subjects = [
              {
                id: '1',
                name: '正宗沙县小吃',
                imageUrl: 'http://localhost:8080/image/shop1.jpg',
                averageScore: 9.9,
                customerNum: 2345
              },
              {
                id: '2',
                name: '老字号沙县拌面',
                imageUrl: 'http://localhost:8080/image/shop2.jpg',
                averageScore: 9.7,
                customerNum: 1892
              },
              {
                id: '3',
                name: '福建沙县小吃王',
                imageUrl: 'http://localhost:8080/image/shop3.jpg',
                averageScore: 9.5,
                customerNum: 1567
              }
            ]
          }
        })
        .catch(error => {
          console.error('获取主体列表失败:', error)
          // 模拟数据：发生错误时使用默认主体列表
          this.subjects = [
            {
              id: '1',
              name: '正宗沙县小吃',
              imageUrl: 'http://localhost:8080/image/shop1.jpg',
              averageScore: 9.9,
              customerNum: 2345
            },
            {
              id: '2',
              name: '老字号沙县拌面',
              imageUrl: 'http://localhost:8080/image/shop2.jpg',
              averageScore: 9.7,
              customerNum: 1892
            },
            {
              id: '3',
              name: '福建沙县小吃王',
              imageUrl: 'http://localhost:8080/image/shop3.jpg',
              averageScore: 9.5,
              customerNum: 1567
            }
          ]
        })
        .finally(() => {
          this.loading = false
        })
    },
    
    // 检查用户对话题的问题状态
    // 注意：此方法已不再使用，用户状态检查已合并到fetchTopicDetailData中
    // API: GET /user/topic/status/{topicId}
    // 功能：检查用户是否已收藏、点赞、举报过该话题
    checkUserStatus() {
      // 此方法已废弃，保留作为参考
      topicApi.checkUserTopicStatus(this.topicId)
        .then(response => {
          if (response.data && response.data.success) {
            const status = response.data.data
            this.isCollected = status.isCollected || false
            this.isLiked = status.isLiked || false
            this.isReported = status.isReported || false
          }
        })
        .catch(error => {
          console.error('检查用户状态失败:', error)
          // 默认都为未操作状态
          this.isCollected = false
          this.isLiked = false
          this.isReported = false
        })
    },
    
    // 切换话题收藏状态
    // API: POST /favorite/topic/confirm 或 /favorite/topic/cancel
    // 功能：收藏或取消收藏话题
    toggleCollect() {
      if (this.isCollected) {
        // 取消收藏
        topicApi.cancelCollect(this.topicId)
          .then((response) => {
            // 请求成功后，检查后端返回的状态
            if (response.hasSuccessed) {
              this.isCollected = false
              // TODO: 显示操作成功提示
            } else {
              console.error('取消收藏失败:', response.message)
              // TODO: 显示操作失败提示
            }
          })
          .catch(error => {
            console.error('取消收藏失败:', error)
            // TODO: 显示操作失败提示
          })
      } else {
        // 收藏
        topicApi.collectTopic(this.topicId)
          .then((response) => {
            // 请求成功后，检查后端返回的状态
            if (response.hasSuccessed) {
              this.isCollected = true
              // TODO: 显示操作成功提示
            } else {
              console.error('收藏失败:', response.message)
              // TODO: 显示操作失败提示
            }
          })
          .catch(error => {
            console.error('收藏失败:', error)
            // TODO: 显示操作失败提示
          })
      }
    },
    
    // 切换话题点赞状态
    // API: POST /like/topic/confirm 或 /like/topic/cancel
    // 功能：点赞或取消点赞话题
    toggleLike() {
      if (this.isLiked) {
        // 取消点赞
        topicApi.cancelLike(this.topicId)
          .then((response) => {
            // 请求成功后，检查后端返回的状态
            if (response.hasSuccessed) {
              this.isLiked = false
              // TODO: 显示操作成功提示
            } else {
              console.error('取消点赞失败:', response.message)
              // TODO: 显示操作失败提示
            }
          })
          .catch(error => {
            console.error('取消点赞失败:', error)
            // TODO: 显示操作失败提示
          })
      } else {
        // 点赞
        topicApi.likeTopic(this.topicId)
          .then((response) => {
            // 请求成功后，检查后端返回的状态
            if (response.hasSuccessed) {
              this.isLiked = true
              // TODO: 显示操作成功提示
            } else {
              console.error('点赞失败:', response.message)
              // TODO: 显示操作失败提示
            }
          })
          .catch(error => {
            console.error('点赞失败:', error)
            // TODO: 显示操作失败提示
          })
      }
    },
    
    // 举报话题
    // API: PUT /against
    // 功能：举报话题（只能举报一次）
    // 对接后端UserAgainstController的against方法
    // 参数: { objectId: topicId, type: 3 } (type=3对应话题)
    report() {
      if (this.isReported) return
      
      // 显示举报确认弹窗
      this.showReportConfirmDialog('topic', this.topicId)
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
      if (this.reportTargetType === 'topic') {
        this.reportTopicRequest()
      } else if (this.reportTargetType === 'subject') {
        this.reportSubjectRequest(this.reportTargetId)
      }
      
      // 关闭弹窗
      this.closeReportConfirmDialog()
    },
    
    // 实际执行话题举报请求
    reportTopicRequest() {
      if (this.isReported) return
      
      topicApi.reportTopic(this.topicId)
        .then((response) => {
          // 请求成功后，检查后端返回的状态
          if (response.hasSuccessed) {
            this.isReported = true
            this.$toast('举报成功，我们会尽快处理')
          } else {
            this.$toast(response.message || '举报失败，请稍后重试')
          }
        })
        .catch(error => {
          console.error('举报失败:', error)
          this.$toast('举报失败，请稍后重试')
        })
    },
    
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
    
    // 切换话题简介展开/收起状态
    toggleDescription() {
      this.isDescriptionExpanded = !this.isDescriptionExpanded
    },
    
    // 格式化日期
    formatDate(dateString) {
      if (!dateString) return ''
      
      // 简单的日期格式化函数
      // 实际项目中应使用专门的日期格式化工具
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      
      return `${year}年${month}月${day}日`
    },
    
    // 获取完整图片URL
    getFullImageUrl(imageUrl) {
      if (!imageUrl) return '';
      // 直接拼接固定IP+端口号，确保不会出现双斜杠
      // 如果imageUrl已经以/开头，则去掉开头的斜杠
      const cleanImageUrl = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
      return `http://localhost:8080/${cleanImageUrl}`;
    },
    
    // 返回上一页
    goBack() {
      this.$router.back()
    },
    
    // 跳转到主体详情页
    goToSubjectDetail(subjectId) {
      this.$router.push(`/subject/${subjectId}`)
    },
    
    // 举报主体
    // API: PUT /against
    // 功能：举报主体（只能举报一次）
    // 对接后端UserAgainstController的against方法
    // 参数: { objectId: subjectId, type: 4 } (type=4对应主体)
    reportSubject(subjectId) {
      // 查找对应的主体
      const subjectIndex = this.subjects.findIndex(s => s.id === subjectId);
      if (subjectIndex === -1) return;
      
      const subject = this.subjects[subjectIndex];
      
      // 如果已经举报过，直接返回
      if (subject.isReported) {
        this.$toast('您已经举报过该主体');
        return;
      }
      
      // 显示举报确认弹窗
      this.showReportConfirmDialog('subject', subjectId)
    },
    
    // 实际执行主体举报请求
    reportSubjectRequest(subjectId) {
      // 查找对应的主体
      const subjectIndex = this.subjects.findIndex(s => s.id === subjectId);
      if (subjectIndex === -1) return;
      
      const subject = this.subjects[subjectIndex];
      
      // 如果已经举报过，直接返回
      if (subject.isReported) {
        this.$toast('您已经举报过该主体');
        return;
      }
      
      // 调用举报API
      subjectApi.reportSubject(subjectId)
        .then(response => {
          if (response.hasSuccessed) {
            // 更新举报状态
            this.$set(subject, 'isReported', true);
            this.$toast('举报成功，我们会尽快处理')
          } else {
            this.$toast(response.message || '举报失败，请稍后重试')
          }
        })
        .catch(error => {
          console.error('举报主体失败:', error)
          this.$toast('举报失败，请稍后重试')
        })
    },
    

  },
  mounted() {
    // 获取路由参数中的话题ID
    this.topicId = this.$route.params.id
    if (this.topicId) {
      // 调用浏览历史记录API - 记录用户查看话题
      // API: POST /history/{topicId}
      // 功能：记录用户浏览话题历史，用于后续推荐和统计
      // 对接后端UserTopicViewHistoryController的insertOrUpdate方法
      userTopicViewHistoryApi.insertOrUpdate(this.topicId)
        .then(response => {
          if (response.hasSuccessed) {
            console.log('浏览历史记录成功')
          } else {
            console.warn('浏览历史记录失败:', response.message)
          }
        })
        .catch(error => {
          console.error('浏览历史记录请求失败:', error)
        })
      
      // 同时发起三个请求获取话题详情页面完整数据
      this.fetchTopicDetailData()
    }
  }
}
</script>

<style scoped>
/* 话题详情页面容器 */
.topic-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  overflow: hidden;
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

/* 话题内容区域 - 外层容器 */
.topic-content {
  flex: 1;
  overflow-y: auto;
  padding-top: 44px;
  height: calc(100vh - 44px);
}

/* 话题信息块 */
.topic-block {
  background-color: #ffffff;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #666666; /* 添加深灰色边框 */
}

/* 话题标题 */
.topic-title {
  font-size: 20px;
  font-weight: bold;
  color: #000000;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

/* 图片和简介的左右布局容器 */
.topic-details {
  display: flex;
  width: 100%; /* 占满整个宽度 */
  gap: 12px;
  margin-bottom: 12px;
}

/* 话题图片容器 - 占据30%宽度 */
.topic-image-container {
  width: 30%;
  height: 120px; /* 固定高度，确保容器大小一致 */
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
  font-size: 16px; /* 增加字体大小，从14px到16px */
  color: #333333; /* 调整颜色为更深的灰色，提高可读性 */
  line-height: 1.5;
}

/* 展开的话题简介 */
.topic-description p.expanded {
  display: block;
  overflow: visible;
  text-overflow: unset;
  -webkit-line-clamp: unset;
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

/* 展开/收起链接 */
.expand-link {
  color: #0066CC;
  cursor: pointer;
}

/* 创建时间 */
.create-time {
  text-align: right;
  font-size: 12px;
  color: #999999;
  margin-bottom: 16px;
}

/* 操作按钮组 */
.action-buttons {
  display: flex;
  justify-content: space-around;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

/* 操作按钮 */
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

/* 操作按钮激活状态（已收藏、已点赞） */
.action-btn.active {
  color: #FF0000;
  border-color: #FF0000;
}

/* 操作按钮禁用状态（已举报） */
.action-btn.disabled {
  color: #999999;
  border-color: #e0e0e0;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 主体列表区域 - 内层滚动容器 */
.subjects-section {
  background-color: #ffffff;
  padding: 0 15px 15px;
  margin-top: 10px;
  /* 使用flex布局自动调整高度，避免固定高度计算问题 */
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px; /* 设置最小高度确保可见性 */
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

/* 主体列表 - 可滚动区域 - 改为内嵌样式，参考二级评论页和主体详情页实现 */
.subject-list-container {
  height: 600px; /* 设置固定高度，与二级评论页和主体详情页保持一致 */
  overflow-y: auto; /* 垂直滚动 */
  padding: 8px 0;
  /* 添加边框和背景色，形成明确的内嵌区块 */
  border: 2px solid #f0f0f0; /* 添加粗边框，与二级评论页保持一致 */
  border-radius: 8px; /* 圆角边框 */
  background-color: #ffffff; /* 白色背景 */
  /* 优化滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: #ccc #f5f5f5;
}

/* Webkit浏览器滚动条样式 */
.subject-list-container::-webkit-scrollbar {
  width: 6px;
}

.subject-list-container::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.subject-list-container::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.subject-list-container::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* 固定元素样式 */
.fixed-elements {
  position: fixed;
  top: 44px;
  left: 0;
  right: 0;
  height: auto; /* 改为自动高度，不占据整个屏幕 */
  max-height: 70vh; /* 设置最大高度为视窗高度的70% */
  background-color: #f5f5f5;
  z-index: 100;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* 添加阴影，增强层次感 */
}

.fixed-section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  padding: 15px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 0;
  z-index: 101;
}

.fixed-subjects-container {
  flex: 1;
  overflow-y: auto;
  padding: 0 15px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
  margin: 0 15px;
}

/* 主体列表 */
.subject-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 15px;
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

/* 主体名称 */
.subject-name {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px; /* 调大字体 */
  font-weight: bold;
  color: #000000;
  margin-bottom: 12px;
}

/* 箭头图标 */
.arrow {
  font-size: 16px; /* 调大字体 */
  color: #999999;
}

/* 主体图片和评分信息 */
.subject-info {
  display: flex;
  gap: 12px;
}

/* 主体图片容器 */
.subject-image-container {
  width: 80px;
  height: 80px; /* 固定高度，确保容器大小一致 */
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
  font-size: 18px; /* 调大字体 */
  font-weight: bold;
  color: #000000; /* 恢复为黑色 */
  text-align: center;
  margin-bottom: 8px;
}

/* 评分人数 */
.rating-count {
  font-size: 16px; /* 调大字体 */
  color: #000000; /* 恢复为黑色 */
  text-align: center;
}

/* 评分数值 - 红色 */
.rating-value {
  color: #FF0000; /* 红色 */
}

/* 举报按钮 */
.report-button {
  position: absolute;
  bottom: 12px;
  right: 12px;
  font-size: 14px;
  color: #999999;
  background-color: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 4px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.report-button:active {
  background-color: #e8e8e8;
}

/* 举报按钮已举报状态 */
.report-button.reported {
  color: #999999;
  border-color: #e0e0e0;
  background-color: #f5f5f5;
  cursor: not-allowed;
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

/* 分页器 - 固定在底部 */
.pagination-container {
  display: flex;
  justify-content: center;
  padding: 15px 0;
  margin-top: 0;
  background-color: #ffffff;
  border-top: 1px solid #eee;
  position: relative;
  width: 100%;
  left: 0;
  right: 0;
}

/* 固定分页器容器 */
.fixed-pagination-container {
  display: flex;
  justify-content: center;
  padding: 15px 0;
  background-color: #fff;
  border-top: 1px solid #eee;
  position: sticky;
  bottom: 0;
  z-index: 101;
}



/* 响应式适配 - iPhone 12 Pro */
@media screen and (max-width: 390px) {
  .topic-details {
    gap: 8px;
  }
  
  .topic-description {
    font-size: 15px; /* 小屏幕上保持较大的字体大小 */
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
    margin-bottom: 14px; /* 小屏幕上保持较大的间距 */
    border-bottom: 2px solid #cccccc; /* 小屏幕上底部边框稍细 */
  }
  
  /* 移动端分页器样式 - 确保背景色一致且不挤成两行 */
  .pagination-container {
    background-color: #ffffff;
    border-top: 1px solid #eee;
    margin: 0;
    padding: 10px 15px; /* 减小垂直padding */
    /* 移除padding-bottom，减少空白区域 */
    width: 100%;
    display: flex;
    flex-direction: row; /* 改为水平排列，避免挤成两行 */
    justify-content: center;
    align-items: center;
    position: relative;
    left: 0;
    right: 0;
  }
  
  /* 固定分页器容器 - 移动端适配 */
  .fixed-pagination-container {
    display: flex;
    justify-content: center;
    padding: 10px 15px; /* 减小垂直padding */
    /* 移除padding-bottom，减少空白区域 */
    background-color: #fff;
    border-top: 1px solid #eee;
    position: sticky;
    bottom: 0;
    z-index: 101;
  }
  
  .pagination-controls {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-right: 15px; /* 与跳转控件保持间距 */
  }
  
  .pagination-jump {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .pagination-jump span {
    font-size: 12px;
    margin-right: 5px;
  }
  
  .pagination-jump input {
    width: 35px; /* 减小宽度 */
    height: 22px; /* 减小高度 */
    font-size: 12px;
    padding: 0 3px;
    margin: 0 3px;
  }
  
  .pagination-jump button {
    padding: 3px 6px; /* 减小padding */
    font-size: 12px;
    margin-left: 3px;
  }
}
</style>