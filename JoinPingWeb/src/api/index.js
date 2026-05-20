// API模块 - 负责定义和导出所有API接口
// 功能：集中管理API接口，方便统一维护和使用
// 说明：对接SpringBoot后端API，实现真实数据交互

import request from '../utils/request'

// 用户相关API
export const userApi = {
  // 用户登录
  // API: GET /user/login
  // 功能：用户登录验证，返回用户信息和token
  // 注意：后端使用GET请求且参数不使用@RequestBody注解，参数通过URL参数传递
  login(phone, password) {
    console.log('发起登录请求:', { phone, password });
    return request({
      url: '/user/login',
      method: 'get',
      // 后端使用GET请求且参数不使用@RequestBody注解，参数通过URL参数传递
      params: {
        phone: Number(phone), // 将手机号转换为数字类型，匹配后端Long类型
        password
      }
    }).then(response => {
      console.log('登录API响应:', response);
      return response;
    }).catch(error => {
      console.error('登录API错误:', error);
      throw error;
    });
  },
  
  // 用户注册
  // API: PUT /user/register
  // 功能：用户注册，创建新账号
  // 注意：后端注册接口使用@RequestBody注解，参数通过请求体传递
  register(phone, password, confirmPassword) {
    console.log('发起注册请求:', { phone, password, confirmPassword });
    return request({
      url: '/user/register',
      method: 'put',
      // 后端注册接口使用@RequestBody注解，参数通过请求体传递
      data: {
        phone: Number(phone), // 将手机号转换为数字类型，匹配后端Long类型
        password,
        confirmPassword
      }
    }).then(response => {
      console.log('注册API响应:', response);
      return response;
    }).catch(error => {
      console.error('注册API错误:', error);
      throw error;
    });
  },
  
  // 获取用户信息
  // API: GET /user
  // 功能：获取当前登录用户的详细信息
  // 注意：后端使用Sa-Token的StpUtil.getLoginId()获取用户ID
  getCurrentUserInfo() {
    return request({
      url: '/user',
      method: 'get'
    })
  },
  
  // 退出登录
  // API: POST /user/logout
  // 功能：用户退出登录，清除token
  logout() {
    return request({
      url: '/user/logout',
      method: 'post'
    })
  },
  
  // 更新用户名
  // API: POST /user
  // 功能：修改当前登录用户的用户名，对接后端UserController的update方法
  // 参数说明：name - 新的用户名
  updateUserName(name) {
    console.log('发起更新用户名请求:', { name });
    return request({
      url: '/user',
      method: 'post',
      // 后端UserController的update方法使用String参数，通过URL参数传递
      params: {
        name: name
      }
    }).then(response => {
      console.log('更新用户名API响应:', response);
      return response;
    }).catch(error => {
      console.error('更新用户名API错误:', error);
      throw error;
    });
  },
  
  // 忘记密码
  // API: PUT /user/forget
  // 功能：用户忘记密码，重置密码
  // 注意：后端使用@RequestBody User user接收，参数通过请求体传递完整的User对象
  forgetPassword(phone, password, confirmPassword) {
    console.log('发起忘记密码请求:', { phone, password, confirmPassword });
    return request({
      url: '/user/forget',
      method: 'put',
      // 后端使用@RequestBody User user接收，传递完整的User对象字段
      data: {
        phone: Number(phone), // 手机号，转换为数字类型匹配后端Long类型
        password: password,    // 新密码
        confirmPassword: confirmPassword // 确认密码
      }
    }).then(response => {
      console.log('忘记密码API响应:', response);
      return response;
    }).catch(error => {
      console.error('忘记密码API错误:', error);
      throw error;
    });
  }
}

// Home相关API - 首页专用API，分类页禁止使用
export const homeApi = {
  // 获取话题列表 - 首页专用
  // API: GET /topic/areaId
  // 功能：根据分类ID获取话题列表，对接后端TopicController的getByAreaId方法
  // 参数说明：
  // - categoryId: 分类ID（对应后端areaId）
  // - pageNum: 页码
  // - pageSize: 每页大小
  // - sortType: 排序类型 'hot'（最热）或 'newest'（最新）
  getTopics(categoryId = 0, pageNum = 1, pageSize = 10, sortType = 'hot') {
    console.log('调用首页getTopics API获取话题列表:', { categoryId, pageNum, pageSize, sortType });
    
    // 构建请求参数，对应后端Topic对象的字段
    const params = {
      areaId: categoryId,
      pageNum,
      pageSize,
      // 根据排序类型设置排序参数
      orderByCreateTimeDesc: sortType === 'newest' // true表示按最新排序，false表示按最热排序
    };
    
    return request({
      url: '/topic/areaId',
      method: 'get',
      params: params
    }).then(response => {
      console.log('首页getTopics API响应:', response);
      return response;
    }).catch(error => {
      console.error('首页getTopics API错误:', error);
      throw error;
    });
  },
  
  // 获取话题分类列表
  // API: GET /topic/area
  // 功能：获取话题类别列表，对接后端TopicController的getAreaList方法
  // 返回值格式：[{id: 1, description: "音乐"}, {id: 2, description: "游戏"}]
  getCategories() {
    console.log('调用getCategories API获取分类列表');
    return request({
      url: '/topic/area',
      method: 'get'
    }).then(response => {
      console.log('getCategories API响应:', response);
      // 后端返回的数据格式为[{id: 1, description: "音乐"}, {id: 2, description: "游戏"}]
      // 需要转换为前端需要的格式[{id: 1, name: "音乐"}, {id: 2, name: "游戏"}]
      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map(category => ({
          id: category.id,
          name: category.description
        }));
      }
      return response;
    }).catch(error => {
      console.error('getCategories API错误:', error);
      throw error;
    });
  },
  
  // 获取话题排行榜
  // API: GET /index/rank?key=xxx
  // 功能：根据key获取话题排行榜数据，支持weekMostLike、weekMostFavorite等参数
  // 对接后端IndexController的rankingList方法
  getRankingList(rankKey) {
    console.log('调用getRankingList API，rankKey:', rankKey);
    return request({
      url: '/index/rank',
      method: 'get',
      params: {
        key: rankKey
      }
    }).then(response => {
      console.log('getRankingList API响应:', response);
      return response;
    }).catch(error => {
      console.error('getRankingList API错误:', error);
      throw error;
    });
  },
  
  // 搜索话题
  // API: GET /index/search
  // 功能：根据关键词搜索话题，支持分页和排序
  // 对接后端IndexController的search方法（GET方法，参数通过URL参数传递）
  searchTopics(searchParams) {
    console.log('调用searchTopics API，搜索参数:', searchParams);
    return request({
      url: '/index/search',
      method: 'get',
      params: searchParams // 使用params传递参数，GET请求通过URL参数传递
    }).then(response => {
      console.log('searchTopics API响应:', response);
      return response;
    }).catch(error => {
      console.error('searchTopics API错误:', error);
      throw error;
    });
  },
  
  // 获取通知状态
  // API: GET /notice/status
  // 功能：获取通知状态，0表示有未读消息，1表示没有未读消息
  getNoticeStatus() {
    return request({
      url: '/notice/status',
      method: 'get'
    })
  },
  
  // 获取最新通知
  // API: GET /notification/latest
  // 功能：从后端获取最新通知信息
  getLatestNotification() {
    // 模拟API调用，因为后端暂时没有提供通知接口
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟数据
        const mockData = {
          id: 1,
          content: '有新的系统通知，请查收',
          createTime: '2023-04-01 10:00:00',
          isRead: false
        };
        resolve({ data: mockData });
      }, 100);
    });
  },
  
  // 获取系统通知分页列表
  // API: GET /notice/system
  // 功能：分页获取系统通知列表
  // 对接后端NoticeController的getSystemNoticePage方法
  // 参数：使用Search对象格式，包含pageNum-页码，pageSize-每页大小
  getSystemNoticePage(pageNum = 1, pageSize = 10) {
    const params = {
      pageNum,
      pageSize,
      orderByCreateTimeDesc: true // 默认按创建时间倒序排序
    };
    
    console.log('调用getSystemNoticePage API，参数:', params);
    
    return request({
      url: '/notice/system',
      method: 'get',
      params: params
    }).then(response => {
      console.log('getSystemNoticePage API响应:', response);
      return response;
    }).catch(error => {
      console.error('getSystemNoticePage API错误:', error);
      throw error;
    });
  },
  
  // 获取用户回复通知分页列表
  // API: GET /notice/reply
  // 功能：分页获取用户回复通知列表
  // 对接后端NoticeController的getUserReplyNoticePage方法
  // 参数：使用Search对象格式，包含pageNum-页码，pageSize-每页大小
  getUserReplyNoticePage(pageNum = 1, pageSize = 10) {
    const params = {
      pageNum,
      pageSize,
      orderByCreateTimeDesc: true // 默认按创建时间倒序排序
    };
    
    console.log('调用getUserReplyNoticePage API，参数:', params);
    
    return request({
      url: '/notice/reply',
      method: 'get',
      params: params
    }).then(response => {
      console.log('getUserReplyNoticePage API响应:', response);
      return response;
    }).catch(error => {
      console.error('getUserReplyNoticePage API错误:', error);
      throw error;
    });
  },
  
  // 清空系统通知
  // API: DELETE /notice/system
  // 功能：清空当前用户的所有系统通知
  // 对接后端NoticeController的deleteSystemNotice方法
  deleteSystemNotice() {
    console.log('调用deleteSystemNotice API清空系统通知');
    
    return request({
      url: '/notice/system',
      method: 'delete'
    }).then(response => {
      console.log('deleteSystemNotice API响应:', response);
      return response;
    }).catch(error => {
      console.error('deleteSystemNotice API错误:', error);
      throw error;
    });
  },
  
  // 清空用户回复通知
  // API: DELETE /notice/reply
  // 功能：清空当前用户的所有用户回复通知
  // 对接后端NoticeController的deleteUserReplyNotice方法
  deleteUserReplyNotice() {
    console.log('调用deleteUserReplyNotice API清空用户回复通知');
    
    return request({
      url: '/notice/reply',
      method: 'delete'
    }).then(response => {
      console.log('deleteUserReplyNotice API响应:', response);
      return response;
    }).catch(error => {
      console.error('deleteUserReplyNotice API错误:', error);
      throw error;
    });
  }
}

// Category相关API - 分类页专用API，直接使用TopicController的两个接口
export const categoryApi = {
  // 获取分类列表 - 使用TopicController.getAreaList()
  // API: GET /topic/area
  // 功能：获取话题分类列表
  // 返回值格式：[{id: 1, description: "音乐"}, {id: 2, description: "游戏"}]
  getCategoryList() {
    console.log('调用分类页getCategoryList API获取分类列表');
    return request({
      url: '/topic/area',
      method: 'get'
    }).then(response => {
      console.log('分类页getCategoryList API响应:', response);
      // 后端返回的数据格式为[{id: 1, description: "音乐"}, {id: 2, description: "游戏"}]
      // 需要转换为前端需要的格式[{id: 1, name: "音乐"}, {id: 2, name: "游戏"}]
      if (response.data && Array.isArray(response.data)) {
        response.data = response.data.map(category => ({
          id: category.id,
          name: category.description
        }));
      }
      return response;
    }).catch(error => {
      console.error('分类页getCategoryList API错误:', error);
      throw error;
    });
  },
  
  // 根据分类ID获取话题列表 - 使用TopicController.getByAreaId()
  // API: GET /topic/areaId
  // 功能：根据分类ID获取话题列表
  // 参数说明：
  // - categoryId: 分类ID（对应后端areaId）
  // - pageNum: 页码
  // - pageSize: 每页大小
  // - sortType: 排序类型 'hot'（最热）或 'newest'（最新）
  getCategoryTopics(categoryId = 0, pageNum = 1, pageSize = 10, sortType = 'hot') {
    console.log('调用分类页getCategoryTopics API获取话题列表:', { categoryId, pageNum, pageSize, sortType });
    
    // 构建请求参数，对应后端TopicController.getByAreaId()方法的参数
    const params = {
      areaId: categoryId,
      pageNum,
      pageSize,
      orderByCreateTimeDesc: sortType === 'newest' // true表示按最新排序，false表示按最热排序
    };
    
    return request({
      url: '/topic/areaId',
      method: 'get',
      params: params
    }).then(response => {
      console.log('分类页getCategoryTopics API响应:', response);
      return response;
    }).catch(error => {
      console.error('分类页getCategoryTopics API错误:', error);
      throw error;
    });
  }
}

// Topic相关API
export const topicApi = {
  // 获取话题类别列表
  // API: GET /topic/area
  // 功能：获取话题类别列表
  getAreaList() {
    console.log('调用getAreaList API');
    return request({
      url: '/topic/area',
      method: 'get'
    }).then(response => {
      console.log('getAreaList API响应:', response);
      return response;
    }).catch(error => {
      console.error('getAreaList API错误:', error);
      throw error;
    });
  },
  
  // 创建新话题
  // API: PUT /topic
  // 功能：创建新的话题，包含话题名称、简介和图片ID
  createTopic(topicData) {
    // 对接后端TopicController的insertTopic方法
    return request({
      url: '/topic',
      method: 'put',
      data: topicData
    })
  },
  
  // 上传图片
  // API: POST /document/upload/topic
  // 功能：上传图片文件到服务器
  uploadImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request({
      url: '/document/upload/topic',
      method: 'post',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 获取用户创建的话题列表
  // API: GET /topic/user?userId=xxx&sortType=newest&page=1&pageSize=10
  // 功能：获取指定用户创建的话题列表，支持排序和分页
  getUserTopics(userId, sortType = 'newest', page = 1, pageSize = 10) {
    // 对接后端TopicController的getUserTopics方法
    return request({
      url: '/topic/user',
      method: 'get',
      params: {
        userId,
        sortType,
        page,
        pageSize
      }
    })
  },
  
  // 获取我的话题列表
  // API: GET /topic/my?pageNum=1&pageSize=10
  // 功能：获取当前用户创建的话题列表，支持分页
  getMyTopics(pageNum = 1, pageSize = 10) {
    // 对接后端TopicController的getMyTopicList方法
    return request({
      url: '/topic/my',
      method: 'get',
      params: {
        pageNum,
        pageSize
      }
    })
  },
  // 获取话题详情
  // API: GET /topic/{id}
  // 功能：获取指定话题的详细信息，包含相关主体列表
  getTopicDetail(topicId) {
    // 对接后端TopicController的getById方法
    // 返回的TopicDTO包含thingList字段，即相关主体列表
    return request({
      url: `/topic/${topicId}`,
      method: 'get'
    })
  },
  
  // 获取完整的话题信息
  // API: GET /topic/all/{id}
  // 功能：获取话题的完整信息，包含按ID排序的主体列表
  // 对接后端TopicController的getTopicDTO方法
  getTopicDTO(topicId) {
    return request({
      url: `/topic/all/${topicId}`,
      method: 'get'
    })
  },
  
  // 删除话题
  // API: DELETE /topic/{id}
  // 功能：删除指定的话题及其相关主体和评论
  deleteTopic(topicId) {
    // 对接后端TopicController的deleteTopic方法
    return request({
      url: `/topic/${topicId}`,
      method: 'delete'
    })
  },
  
  // 获取用户点赞状态
  // API: GET /like/topic?topicId={topicId}
  // 功能：检查用户是否已点赞该话题
  // 注意：后端会自动从token中获取userId，前端只需传递topicId
  getUserLikeStatus(topicId) {
    // 对接后端TopicUserLikeController的getUserLikeStatus方法
    return request({
      url: '/like/topic',
      method: 'get',
      params: {
        topicId: topicId  // 保持字符串类型，避免精度丢失
      }
    })
  },
  
  // 获取用户收藏状态
  // API: GET /favorite/topic/{id}
  // 功能：检查用户是否已收藏该话题
  // 注意：后端会自动从token中获取userId，前端只需传递话题ID作为路径参数
  getUserFavoriteStatus(topicId) {
    // 对接后端TopicUserFavoriteController的get方法
    return request({
      url: `/favorite/topic/${topicId}`,
      method: 'get'
    })
  },
  
  // 获取话题相关主体列表
  // API: GET /topic/{id}/subjects?page={page}&size={size}
  // 功能：获取与话题相关的主体列表，支持分页
  // 注意：后端TopicDTO已经包含了thingList，所以不需要额外接口
  getTopicSubjects(topicId, page = 1, size = 10) {
    // 直接从话题详情中获取thingList，不需要额外接口
    // 这里返回一个空Promise，实际数据从getTopicDetail中获取
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          code: 200,
          message: 'success',
          data: {
            message: '请使用getTopicDetail获取主体列表'
          },
          hasSuccessed: true
        })
      }, 0)
    })
  },
  
  // 获取主体详情
  // API: GET /thing/{id}
  // 功能：获取指定主体的详细信息
  getThingDetail(thingId) {
    // 对接后端ThingController的get方法
    return request({
      url: `/thing/${thingId}`,
      method: 'get'
    })
  },
  
  // 检查用户对话题的操作状态
  // 功能：检查用户是否已收藏、点赞过该话题
  // 注意：现在使用独立的getUserLikeStatus和getUserFavoriteStatus方法
  checkUserTopicStatus(topicId) {
    // 并发查询点赞和收藏状态
    const likeStatusPromise = this.getUserLikeStatus(topicId)
    const favoriteStatusPromise = this.getUserFavoriteStatus(topicId)
    
    return Promise.all([likeStatusPromise, favoriteStatusPromise])
      .then(([likeResponse, favoriteResponse]) => {
        return {
          data: {
            success: true,
            data: {
              isLiked: likeResponse.data && likeResponse.data.data ? true : false,
              isCollected: favoriteResponse.data && favoriteResponse.data.data ? true : false,
              isReported: false // 后端暂时没有举报接口
            }
          }
        }
      })
      .catch(error => {
        console.error('检查用户状态失败:', error)
        return {
          data: {
            success: false,
            data: {
              isLiked: false,
              isCollected: false,
              isReported: false
            }
          }
        }
      })
  },
  
  // 收藏话题
  // API: POST /favorite/topic/confirm
  // 功能：收藏话题
  // 注意：后端TopicUserFavoriteController的confirmFavorite方法没有使用@RequestBody注解
  // 参数应作为查询参数传递，而不是请求体
  collectTopic(topicId) {
    // 对接后端TopicUserFavoriteController的confirmFavorite方法
    // 后端会自动从token中获取userId，前端只需传递topicId作为查询参数
    return request({
      url: '/favorite/topic/confirm',
      method: 'post',
      params: {
        topicId: topicId  // 作为查询参数传递
      }
    })
  },
  
  // 取消收藏话题
  // API: POST /favorite/topic/cancel
  // 功能：取消收藏话题
  // 注意：后端TopicUserFavoriteController的cancelFavorite方法没有使用@RequestBody注解
  // 参数应作为查询参数传递，而不是请求体
  cancelCollect(topicId) {
    // 对接后端TopicUserFavoriteController的cancelFavorite方法
    // 后端会自动从token中获取userId，前端只需传递topicId作为查询参数
    return request({
      url: '/favorite/topic/cancel',
      method: 'post',
      params: {
        topicId: topicId  // 作为查询参数传递
      }
    })
  },
  
  // 点赞话题
  // API: POST /like/topic/confirm
  // 功能：点赞话题
  // 注意：后端参数没有使用@RequestBody，参数应作为请求参数(query parameters)传递
  likeTopic(topicId) {
    // 对接后端TopicUserLikeController的confirmLike方法
    return request({
      url: '/like/topic/confirm',
      method: 'post',
      params: {
        topicId: topicId  // 保持字符串类型，避免精度丢失
      }
    })
  },
  
  // 取消点赞话题
  // API: POST /like/topic/cancel
  // 功能：取消点赞话题
  // 注意：后端参数没有使用@RequestBody，参数应作为请求参数(query parameters)传递
  cancelLike(topicId) {
    // 对接后端TopicUserLikeController的cancelLike方法
    return request({
      url: '/like/topic/cancel',
      method: 'post',
      params: {
        topicId: topicId  // 保持字符串类型，避免精度丢失
      }
    })
  },
  
  // 获取用户举报状态
  // API: GET /against/{id}
  // 功能：获取用户对指定话题的举报状态
  // 注意：后端会自动从token中获取userId，前端只需传递话题ID
  getUserReportStatus(topicId) {
    // 后端接口只接受路径参数id，不接受userId参数
    // 根据后端代码，id应该是topicId
    return request({
      url: `/against/${topicId}`,
      method: 'get'
    })
  },
  
  // 举报话题
  // API: PUT /against
  // 功能：举报话题（只能举报一次）
  // 对接后端UserAgainstController的against方法
  reportTopic(topicId) {
    // 根据后端UserAgainst类，需要objectId和type参数
    // 对于话题，type应该是3（根据MessageRoutingKeyEnum.TOPIC）
    // 注意：后端没有使用@RequestBody注解，参数应作为请求参数(query parameters)传递
    return request({
      url: '/against',
      method: 'put',
      params: {
        objectId: topicId,  // 举报的话题ID
        type: 3            // 话题类型（根据MessageRoutingKeyEnum.TOPIC）
      }
    })
  },
  
  // 获取我的收藏列表
  // API: GET /favorite/topic?pageNum=1&pageSize=10
  // 功能：获取当前用户收藏的话题列表，支持分页
  // 对接后端TopicUserFavoriteController的selectPage方法
  getMyFavorites(pageNum = 1, pageSize = 10) {
    // 后端接口路径为/favorite/topic，接收Search参数（含pageNum和pageSize）
    // 后端会自动从token中获取userId，前端只需传递分页参数
    return request({
      url: '/favorite/topic',
      method: 'get',
      params: {
        pageNum,
        pageSize
      }
    })
  }
}

// Subject相关API
export const subjectApi = {
  // 添加主体
  // API: POST /thing
  // 功能：添加新主体，通过ThingController的insertOrUpdate方法
  addSubject(subjectsData, topicId) {
    return request({
      url: '/thing',
      method: 'post',
      data: subjectsData, // 直接发送主体数组，不再额外包装
      params: {
        topicId // 添加topicId作为查询参数
      }
    })
  },
  
  // 获取主体详情
  // API: GET /thing/{id}
  // 功能：获取指定主体的详细信息，包含一级评论数据
  // 对接ThingController的getById方法
  getSubjectDetail(thingId) {
    return request({
      url: `/thing/${thingId}`,
      method: 'get'
    })
  },
  
  // 获取主体列表
  // API: GET /thing?pageNum=1&pageSize=10&id=xxx
  // 功能：分页获取指定话题下的主体列表
  // 对接ThingController的selectPage方法
  getSubjectList(pageNum = 1, pageSize = 10, topicId) {
    return request({
      url: '/thing',
      method: 'get',
      params: {
        pageNum,
        pageSize,
        id: topicId  // 后端接收Topic对象，使用id属性而不是topicId
      }
    })
  },
  
  // 获取用户评分
  // API: GET /score?thingId={thingId}
  // 功能：获取当前用户对于主体的评分，返回0代表未评分，正常1-5
  // 对接ThingUserScoreController的getUserScore方法
  getUserScore(thingId) {
    // 后端接口路径为/score，参数通过ThingUserScore对象传递
    // 后端会自动从token中获取userId，前端只需传递thingId
    return request({
      url: '/score',
      method: 'get',
      params: {
        thingId: thingId
      }
    })
  },
  
  // 提交评分
  // API: POST /score
  // 功能：提交或更新用户对主体的评分，评分值1-5
  // 对接ThingUserScoreController的insertOrUpdateScore方法
  submitRating(thingId, score) {
    // 后端接口路径为/score，参数通过ThingUserScore对象传递
    // 后端会自动从token中获取userId，前端只需传递thingId和score
    return request({
      url: '/score',
      method: 'post',
      data: {
        thingId: thingId,
        score: score
      }
    })
  },
  
  // 获取评论列表
  // API: GET /comment/thing/{thingId}
  // 功能：获取主体的评论列表，支持分页和排序
  getComments(thingId, page = 1, size = 10, sort = 'default') {
    return request({
      url: `/comment/thing/${thingId}`,
      method: 'get',
      params: {
        page,
        size,
        sort
      }
    })
  },
  
  // 点赞一级评论
  // API: POST /like/t1Comment/confirm
  // 功能：点赞一级评论，对接后端T1CommentUserLikeController的confirmLike方法
  // 注意：后端参数没有使用@RequestBody，参数应作为请求参数(query parameters)传递
  likeT1Comment(commentId) {
    // 对接后端T1CommentUserLikeController的confirmLike方法
    // 参数：t1CommentId（一级评论ID），后端会自动从token中获取userId
    return request({
      url: '/like/t1Comment/confirm',
      method: 'post',
      params: {
        t1CommentId: commentId  // 保持字符串类型，避免精度丢失
      }
    })
  },
  
  // 取消点赞一级评论
  // API: POST /like/t1Comment/cancel
  // 功能：取消点赞一级评论，对接后端T1CommentUserLikeController的cancelLike方法
  // 注意：后端参数没有使用@RequestBody，参数应作为请求参数(query parameters)传递
  cancelT1CommentLike(commentId) {
    // 对接后端T1CommentUserLikeController的cancelLike方法
    // 参数：t1CommentId（一级评论ID），后端会自动从token中获取userId
    return request({
      url: '/like/t1Comment/cancel',
      method: 'post',
      params: {
        t1CommentId: commentId  // 保持字符串类型，避免精度丢失
      }
    })
  },
  
  // 获取用户举报状态
  // API: GET /against/{id}
  // 功能：获取用户对指定主体的举报状态
  // 注意：后端会自动从token中获取userId，前端只需传递主体ID
  getUserReportStatus(subjectId) {
    // 后端接口只接受路径参数id，不接受userId参数
    // 根据后端代码，id应该是主体ID
    return request({
      url: `/against/${subjectId}`,
      method: 'get'
    })
  },

  // 举报主体
  // API: PUT /against
  // 功能：举报主体（只能举报一次）
  // 对接后端UserAgainstController的against方法
  reportSubject(subjectId) {
    // 根据后端UserAgainst类，需要objectId和type参数
    // 对于主体，type应该是4（根据MessageRoutingKeyEnum.THING）
    // 注意：后端没有使用@RequestBody注解，参数应作为请求参数(query parameters)传递
    return request({
      url: '/against',
      method: 'put',
      params: {
        objectId: subjectId,  // 举报的主体ID
        type: 4             // 主体类型（根据MessageRoutingKeyEnum.THING）
      }
    })
  },

  // 举报评论
  // API: PUT /against
  // 功能：举报评论（只能举报一次）
  // 对接后端UserAgainstController的against方法
  reportComment(commentId) {
    // 根据后端UserAgainst类，需要objectId和type参数
    // 对于一级评论，type应该是5（根据MessageRoutingKeyEnum.T1COMMENT）
    // 注意：后端没有使用@RequestBody注解，参数应作为请求参数(query parameters)传递
    return request({
      url: '/against',
      method: 'put',
      params: {
        objectId: commentId,  // 举报的评论ID
        type: 5             // 一级评论类型（根据MessageRoutingKeyEnum.T1COMMENT）
      }
    })
  },

  // 举报回复
  // API: PUT /against
  // 功能：举报二级评论（只能举报一次）
  // 对接后端UserAgainstController的against方法
  reportReply(replyId) {
    // 根据后端UserAgainst类，需要objectId和type参数
    // 对于二级评论，type应该是6（根据MessageRoutingKeyEnum.T2COMMENT）
    // 注意：后端没有使用@RequestBody注解，参数应作为请求参数(query parameters)传递
    return request({
      url: '/against',
      method: 'put',
      params: {
        objectId: replyId,   // 举报的回复ID
        type: 6             // 二级评论类型（根据MessageRoutingKeyEnum.T2COMMENT）
      }
    })
  },
  
  // 获取评论回复列表
  // API: GET /comment/reply/{commentId}
  // 功能：获取评论的回复列表，支持分页
  getCommentReplies(commentId, page = 1, size = 10) {
    return request({
      url: `/comment/reply/${commentId}`,
      method: 'get',
      params: {
        page,
        size
      }
    })
  },
  
  // 获取一级评论分页列表
   // API: GET /t1comment?id={thingId}&pageNum={pageNum}&pageSize={pageSize}&orderByCreateTimeDesc={orderByCreateTimeDesc}
   // 功能：分页获取指定主体的一级评论列表，对接T1CommentController的selectPage方法
   // 参数说明：orderByCreateTimeDesc=true表示按创建时间倒序（最新排序），false或不传表示默认排序（热度优先）
   getT1Comments(thingId, pageNum = 1, pageSize = 10, orderByCreateTimeDesc = false) {
     return request({
       url: '/t1comment',
       method: 'get',
       params: {
         id: thingId,  // 修正：使用id参数而不是thing.id
         pageNum,
         pageSize,
         orderByCreateTimeDesc: orderByCreateTimeDesc
       }
     })
   },

  // 提交二级评论回复
  // API: PUT /t2comment (T2CommentController的insert方法)
  // 功能：提交二级评论回复，对接后端T2CommentController的insert方法
  // 参数说明：
  // - thingId: 主体ID
  // - t1commentId: 一级评论ID
  // - replyUserId: 被回复的用户ID（回复一级评论时是一级评论的用户ID，回复二级评论时是二级评论的用户ID）
  // - content: 回复内容
  // - replyType: 回复类型，1-回复一级评论，2-回复二级评论
  submitReply(thingId, t1commentId, replyUserId, content, replyType = 1) {
    // 构建请求数据，对应后端BufferT2Comment类的字段
    // 注意：后端会从token中获取userId，前端不需要传递userId参数
    const requestData = {
      thingId,        // 主体ID
      t1commentId,    // 一级评论ID
      replyUserId,    // 被回复的用户ID（回复一级评论时是一级评论的用户ID，回复二级评论时是二级评论的用户ID）
      content,        // 评论内容
      replyType       // 回复类型：1-回复一级评论，2-回复二级评论
    }
    
    return request({
      url: '/t2comment',
      method: 'put',
      data: requestData
    })
  },
  
  // 发表评论
  // API: PUT /t1comment (T1CommentController的insert方法)
  // 功能：对主体发表评论
  submitComment(thingId, content) {
    const userId = localStorage.getItem('userId') || 1 // 假设从localStorage获取用户ID
    
    return request({
      url: '/t1comment',
      method: 'put',
      data: {
        thingId,
        userId,
        content // 后端BufferT1Comment类中评论内容字段名为content
      }
    })
  },
  
  // 获取一级评论详情
  // API: GET /t1comment/{id} (T1CommentController的get方法)
  // 功能：获取指定一级评论的详细信息
  // 对接后端T1CommentController的get方法
  getT1CommentDetail(commentId) {
    return request({
      url: `/t1comment/${commentId}`,
      method: 'get'
    })
  },
  
  // 获取二级评论分页列表
  // API: GET /t2comment?id={t1commentId}&thingId={thingId}&pageNum={pageNum}&pageSize={pageSize}
  // 功能：分页获取指定一级评论的二级评论列表
  // 对接后端T2CommentController的selectPage方法
  // 参数说明：后端T1Comment对象需要id（一级评论ID）和thingId（主体ID）两个字段进行验证
  getT2Comments(t1commentId, thingId, pageNum = 1, pageSize = 10) {
    return request({
      url: '/t2comment',
      method: 'get',
      params: {
        id: t1commentId,  // 一级评论ID
        thingId: thingId, // 主体ID（一级评论所在主体的ID）
        pageNum,
        pageSize
      }
    })
  },
  
  // 获取一级评论分页信息（用于通知跳转）
  // API: GET /t2comment/index/{id}
  // 功能：根据通知信息获取对应的一级评论分页信息，用于跳转到评论详情页面
  // 对接后端T2CommentController的getT1CommentPageInfo方法
  // 参数说明：id - 通知ID，用于获取对应的评论信息
  getT1CommentPageInfo(id) {
    return request({
      url: `/t2comment/index/${id}`,
      method: 'get'
    })
  },
  
  // 分页查询我的一级评论记录
  // API: GET /t1comment/my?pageNum={pageNum}&pageSize={pageSize}
  // 功能：分页获取当前用户发表的一级评论记录
  // 对接后端T1CommentController的selectT1CommentPage方法
  // 参数说明：pageNum-页码，pageSize-每页大小
  getMyT1Comments(pageNum = 1, pageSize = 10) {
    const params = {
      pageNum,
      pageSize,
      orderByCreateTimeDesc: true // 默认按创建时间倒序排序
    }
    
    return request({
      url: '/t1comment/my',
      method: 'get',
      params: params
    })
  },
  
  // 分页查询我的二级评论记录
  // API: GET /t2comment/my?pageNum={pageNum}&pageSize={pageSize}
  // 功能：分页获取当前用户发表的二级评论记录
  // 对接后端T2CommentController的selectT2CommentPage方法
  // 参数说明：pageNum-页码，pageSize-每页大小
  getMyT2Comments(pageNum = 1, pageSize = 10) {
    const params = {
      pageNum,
      pageSize,
      orderByCreateTimeDesc: true // 默认按创建时间倒序排序
    }
    
    return request({
      url: '/t2comment/my',
      method: 'get',
      params: params
    })
  },
  
  // 获取主体分页信息（用于我的评论跳转）
  // API: GET /t1comment/index/{id}
  // 功能：根据一级评论ID获取对应的主体分页信息，用于跳转到主体详情页面
  // 对接后端T1CommentController的getThingPageInfo方法
  // 参数说明：id - 一级评论ID
  getThingPageInfo(commentId) {
    return request({
      url: `/t1comment/index/${commentId}`,
      method: 'get'
    })
  },
  
  // 删除一级评论
  // API: DELETE /t1comment/{id}
  // 功能：删除指定的一级评论，对接后端T1CommentController的delete方法
  // 参数说明：id - 一级评论ID
  deleteT1Comment(commentId) {
    return request({
      url: `/t1comment/${commentId}`,
      method: 'delete'
    })
  },
  
  // 删除二级评论
  // API: DELETE /t2comment/{id}
  // 功能：删除指定的二级评论，对接后端T2CommentController的delete方法
  // 参数说明：id - 二级评论ID
  deleteT2Comment(commentId) {
    return request({
      url: `/t2comment/${commentId}`,
      method: 'delete'
    })
  }
}

// 用户话题浏览历史记录相关API
export const userTopicViewHistoryApi = {
  // 插入或更新用户话题浏览历史记录
  // API: POST /history/{id}
  // 功能：记录用户浏览话题的历史，每次进入话题页时调用
  // 对接后端UserTopicViewHistoryController的insertOrUpdate方法
  insertOrUpdate(topicId) {
    return request({
      url: `/history/${topicId}`,
      method: 'post'
    })
  },
  
  // 插入或更新用户话题浏览历史记录（通过主体ID）
  // API: POST /history/thing/{id}
  // 功能：根据主体ID记录用户浏览话题历史
  // 对接后端UserTopicViewHistoryController的insertOrUpdateByThingId方法
  insertOrUpdateByThingId(thingId) {
    return request({
      url: `/history/thing/${thingId}`,
      method: 'post'
    })
  },
  
  // 获取用户话题浏览历史记录列表
  // API: GET /history?pageNum=1&pageSize=10
  // 功能：获取当前用户的浏览历史记录列表，支持分页
  // 对接后端UserTopicViewHistoryController的list方法
  getHistoryList(pageNum = 1, pageSize = 10) {
    return request({
      url: '/history',
      method: 'get',
      params: {
        pageNum,
        pageSize
      }
    })
  },
  
  // 清空用户话题浏览历史记录
  // API: DELETE /history
  // 功能：清空当前用户的所有浏览历史记录
  // 对接后端UserTopicViewHistoryController的delete方法
  clearHistory() {
    return request({
      url: '/history',
      method: 'delete'
    })
  }
}

// Document相关API
export const documentApi = {
  // 上传话题图片
  // API: PUT /document/topic
  // 功能：上传话题图片到服务器，返回图片信息
  uploadTopicImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request({
      url: '/document/topic',
      method: 'put',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 上传主体图片
  // API: PUT /document/thing
  // 功能：上传主体图片到服务器，返回图片信息
  uploadThingImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request({
      url: '/document/thing',
      method: 'put',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 上传用户头像
  // API: PUT /document/user
  // 功能：上传用户头像到服务器，返回图片信息
  uploadUserImage(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    return request({
      url: '/document/user',
      method: 'put',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // 删除图片 - 调用DocumentController的deleteById方法
  deleteById(id) {
    // RESTful风格接口：DELETE /document/{id}
    return request({
      url: `/document/${id}`,
      method: 'delete'
    });
  }
}

// 导出所有API模块
export default {
  userApi,
  homeApi,
  topicApi,
  subjectApi,
  documentApi,
  userTopicViewHistoryApi
}