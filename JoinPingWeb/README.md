# JoinPing Web - 仿虎扑评分移动端应用

## 项目简介

JoinPing是一个基于Vue 2开发的移动端Web应用，采用简约的UI设计，提供完整的话题浏览、评分、评论和用户交互功能。项目采用前后端分离架构，前端使用Vue 2选项式API，后端对接SpringBoot 3.4.7服务。

## 技术栈

### 前端技术
- **框架**: Vue 2.6.14 (选项式API)
- **UI组件库**: Vant 2.12.54
- **路由管理**: Vue Router 3.5.4
- **HTTP客户端**: Axios 0.27.2
- **构建工具**: Vue CLI 5.0.0
- **样式**: CSS3 + Flexbox布局

### 后端对接
- **后端框架**: SpringBoot 3.4.7
- **API协议**: RESTful API
- **数据格式**: JSON
- **认证方式**: JWT Token

## 项目特色
- 📱 **移动端优先** - 针对iPhone 12 Pro优化的竖屏适配布局
- 🔄 **完整功能链** - 话题→主体→评论的完整浏览路径
- ⭐ **五星评分系统** - 创新的圆点式评分交互设计
- 💬 **多级评论** - 支持一级评论和二级回复
- 🔔 **实时通知** - WebSocket实现的消息推送
- 📊 **数据统计** - 浏览量、点赞数、收藏数等数据追踪

## 项目结构

```
JoinPingWeb/
├── public/                          # 静态资源
│   └── index.html                   # HTML入口文件
├── src/                             # 源代码目录
│   ├── api/                         # API接口管理
│   │   └── index.js                 # 统一API接口配置
│   ├── assets/                      # 静态资源
│   │   ├── css/                     # 全局样式
│   │   │   └── global.css           # 全局样式文件
│   │   └── images/                  # 图片资源
│   │       ├── back.png             # 返回按钮图标
│   │       ├── category-active.png   # 分类页激活图标
│   │       ├── category.png         # 分类页图标
│   │       ├── default-topic.png     # 默认话题图片
│   │       ├── home-active.png       # 首页激活图标
│   │       ├── home.png             # 首页图标
│   │       ├── notification-*.png   # 通知相关图标
│   │       ├── profile-active.png   # 个人中心激活图标
│   │       ├── profile.png          # 个人中心图标
│   │       ├── search.png           # 搜索图标
│   │       └── topic-placeholder.png # 话题占位图
│   ├── components/                  # 公共组件
│   │   ├── CategorySlider.vue       # 分类滑动选择组件
│   │   ├── CommentLayout.vue        # 评论布局组件
│   │   ├── NotificationBar.vue      # 顶部通知栏
│   │   ├── NotificationBlock.vue    # 通知块组件
│   │   ├── Pagination.vue           # 分页器组件
│   │   ├── RankingSlider.vue        # 排名滑动组件
│   │   ├── ReplyInput.vue           # 回复输入组件
│   │   ├── ReportDialog.vue         # 举报对话框
│   │   ├── SearchBox.vue            # 搜索框组件
│   │   ├── TabBar.vue               # 底部导航栏
│   │   ├── TopicItem.vue            # 话题项组件
│   │   └── TopicList.vue            # 话题列表组件
│   ├── router/                      # 路由配置
│   │   └── index.js                 # 路由配置文件
│   ├── utils/                       # 工具函数
│   │   ├── date.js                  # 日期格式化工具
│   │   ├── image.js                 # 图片处理工具
│   │   ├── pagination-utils.js      # 分页工具
│   │   ├── request.js               # HTTP请求封装
│   │   ├── toast.js                 # 消息提示工具
│   │   ├── websocket-plugin.js      # WebSocket插件
│   │   └── websocket.js              # WebSocket工具
│   ├── views/                       # 页面组件
│   │   ├── Category.vue             # 分类页面
│   │   ├── CommentDetail.vue        # 评论详情页面
│   │   ├── CreateTopic.vue          # 创建话题页面
│   │   ├── EditTopic.vue            # 编辑话题页面
│   │   ├── Home.vue                 # 首页
│   │   ├── Login.vue                # 登录页面
│   │   ├── MyComments.vue           # 我的评论页面
│   │   ├── MyFavorites.vue           # 我的收藏页面
│   │   ├── MyTopics.vue             # 我的话题页面
│   │   ├── NotificationView.vue      # 通知页面
│   │   ├── Profile.vue              # 个人中心页面
│   │   ├── Register.vue             # 注册页面
│   │   ├── SearchView.vue           # 搜索结果页面
│   │   ├── SubjectDetail.vue        # 主体详情页面
│   │   ├── TopicDetail.vue          # 话题详情页面
│   │   └── ViewHistory.vue          # 浏览历史页面
│   ├── App.vue                      # 根组件
│   └── main.js                      # 入口文件
├── .env.development                 # 开发环境变量
├── .env.production                  # 生产环境变量
├── package.json                     # 项目依赖配置
└── vue.config.js                    # Vue配置文件
```

## 功能模块

### 1. 用户认证模块
- **登录/注册**: 支持手机号密码登录和注册
- **测试账号**: 手机号 `12312312312`，密码 `123123`
- **Token管理**: 自动管理JWT Token的存储和刷新

### 2. 首页模块
- **通知系统**: 顶部通知栏显示系统消息和用户通知
- **搜索功能**: 支持话题搜索和结果排序
- **分类浏览**: 近期最热、近期最受期待等分类展示
- **话题推荐**: 智能推荐热门话题列表

### 3. 话题模块
- **话题列表**: 分页展示所有话题，支持排序和筛选
- **话题详情**: 展示话题完整信息、相关主体列表
- **话题操作**: 收藏、点赞、举报功能
- **话题管理**: 用户可创建、编辑自己的话题

### 4. 主体模块
- **主体详情**: 展示主体信息、评分统计
- **评分系统**: 五星圆点式评分，支持修改评分
- **评论功能**: 支持对主体进行评论和回复
- **举报机制**: 支持对主体和评论进行举报

### 5. 评论模块
- **多级评论**: 支持一级评论和二级回复
- **评论审核**: 评论发布后进入审核流程
- **评论管理**: 用户可查看和管理自己的评论
- **互动功能**: 支持评论点赞和举报

### 6. 个人中心模块
- **用户信息**: 展示用户基本信息和统计数据
- **我的话题**: 管理用户创建的话题
- **我的收藏**: 查看用户收藏的话题和主体
- **我的评论**: 管理用户的评论记录
- **浏览历史**: 查看用户的浏览记录
- **通知中心**: 查看系统通知和用户互动通知

## 页面层级结构

```
登录页 → 首页
    ↓
话题列表页 → 话题详情页 → 主体详情页 → 评论详情页
    ↓        ↓           ↓           ↓
搜索结果页  编辑话题页   评分页面    回复评论页
    ↓
分类页面 → 个人中心页 → 我的话题/收藏/评论/历史
```

## 设计规范

### 颜色规范
- **主色调**: 红色 (#ff3b30) - 用于选中状态、重要按钮
- **背景色**: 白色 (#ffffff) - 页面背景
- **文字色**: 黑色 (#000000) - 主要文字
- **辅助色**: 蓝色 (#007aff) - 链接、搜索框边框
- **提示色**: 黄色 (#ffcc00) - 通知文字
- **禁用色**: 灰色 (#f5f5f5) - 禁用状态、通知背景

### 布局规范
- **屏幕适配**: 针对iPhone 12 Pro (390x844)优化
- **字体大小**: 标题16px，正文14px，小字12px
- **间距标准**: 使用8px为基准的间距系统
- **圆角设计**: 统一使用8px圆角
- **阴影效果**: 轻微阴影提升层次感

### 交互规范
- **点击反馈**: 所有可点击元素都有视觉反馈
- **滑动操作**: 支持左右滑动切换分类
- **下拉刷新**: 列表页面支持下拉刷新
- **无限滚动**: 长列表支持无限滚动加载
- **加载状态**: 所有异步操作都有加载提示

## 安装与运行

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖
```bash
cd JoinPingWeb
npm install
```

### 开发环境运行
```bash
npm run serve
```
访问地址: http://localhost:8080

### 生产环境构建
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

## API接口规范

### 请求格式
所有API请求以 `http://localhost:8080/` 开头

### 响应格式
**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "hasSuccessed": true
}
```

**失败响应**:
```json
{
  "code": 500,
  "message": "error",
  "data": {},
  "hasSuccessed": false
}
```

**分页响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "total": 0,
    "current": 1,
    "size": 10,
    "pages": 0,
    "hasPrevious": false,
    "hasNext": false
  },
  "hasSuccessed": true
}
```

### 主要API接口

#### 用户相关
- `POST /api/user/login` - 用户登录
- `POST /api/user/register` - 用户注册
- `GET /api/user/info` - 获取用户信息
- `GET /api/user/notifications` - 获取用户通知

#### 话题相关
- `GET /api/topic/list` - 获取话题列表
- `GET /api/topic/{id}` - 获取话题详情
- `POST /api/topic/create` - 创建话题
- `PUT /api/topic/{id}` - 编辑话题
- `POST /api/topic/{id}/like` - 点赞话题
- `POST /api/topic/{id}/collect` - 收藏话题

#### 主体相关
- `GET /api/subject/{id}` - 获取主体详情
- `POST /api/subject/{id}/rate` - 对主体评分
- `GET /api/subject/{id}/comments` - 获取主体评论

#### 评论相关
- `POST /api/comment` - 发布评论
- `GET /api/comment/{id}/replies` - 获取评论回复
- `POST /api/comment/{id}/like` - 点赞评论

## 开发规范

### 代码规范
- 使用Vue 2选项式API，禁止使用TypeScript
- 强制要求详细注释，复杂逻辑需先用注释列出多种方案
- 注重组件复用，封装通用组件
- 代码嵌套不超过4层，主动降低模块耦合度
- CSS颜色使用纯色数值，细节由用户调整

### 数据规范
- 使用模拟数据开发，用注释描述完整数据结构
- 关键业务逻辑留白并用TODO标记
- 禁止生成测试代码或测试数据
- 所有数据交互必须通过API调用

### 组件规范
- 组件命名使用PascalCase
- 组件文件与组件名保持一致
- 组件props使用camelCase
- 事件命名使用kebab-case

## 部署说明

### 开发环境部署
1. 确保后端服务在 `http://localhost:8080` 运行
2. 前端项目运行 `npm run serve`
3. 访问 `http://localhost:8080` 开始测试

### 生产环境部署
1. 运行 `npm run build` 构建项目
2. 将 `dist` 目录部署到Web服务器
3. 配置Nginx或Apache代理后端API

## 注意事项

### 重要规则
1. **禁止修改后端代码** - 后端服务已单独在IDEA启动
2. **每次启动从登录页开始** - 项目设计为从登录页开始流程
3. **API调用规范** - 所有请求必须添加 `http://localhost:8080/` 前缀
4. **测试账号** - 使用手机号 `12312312312`，密码 `123123` 进行测试

### 开发注意事项
1. 写前端前先查看后端接口文档
2. 所有API调用需注释标注服务功能
3. 使用模拟数据时需用注释描述完整数据结构
4. 关键业务逻辑需用TODO标记留白
5. 禁止生成测试页面，所有测试直接在项目前端页面进行

## 许可证

MIT License

## 更新日志

### v1.0.0 (当前版本)
- ✅ 完整实现用户认证系统
- ✅ 首页功能模块完成
- ✅ 话题浏览和评分系统
- ✅ 多级评论功能
- ✅ 个人中心完整功能
- ✅ WebSocket实时通知
- ✅ 响应式移动端适配

## 技术支持

如有技术问题或功能建议，请联系开发团队。

---

**JoinPing Web** - 让评分更简单，让交流更有趣！