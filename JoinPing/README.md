# JoinPing(酱评)
## 项目介绍
### 一、灵感来源：
    本项目受“虎扑”的评分板块启发，实现了一个可针对热点趣闻打分评论的论坛系统。采用单体架构，集成多种中间件。
### 二、可扩展点
1. 对图片的审核 
当前项目对用户上传图片完全无审核。
2. 更强大的大模型（调用官网收费接口）
当前项目所用大模型为1.5b的deepseek-r1，正确率较差，幻觉严重。10条文本中审核正确率只有60%，且响应时间也较长，普遍在2-5秒。
3. 点赞的通知
用户行为中只有评论才能发送通知，点赞是完全匿名的。
4. 热度的综合计算算法
热度的判断依据就是简单的点赞。
5. 更强大的限流
当前只是在每个controller方法上加一个AOP对请求进行拦截。
6. 更强大的并发控制
当前并发利用mysql的唯一约束，靠报错来控制。
7. 用户密码加盐
8. 对用户所填手机号码的校验
9. 对举报的人工受理
当前举报只是再调用一遍AI审核，审核的提示词以及内容和创建被举报对象时一样，未做举报原因归类。

## 项目架构
    本项目分为四个核心板块：话题 -> 主体 -> 一级评论 -> 二级评论。其余皆为围绕这四个板块衍生的功能。以话题为始网状展开：一个话题对应多个主体，其中一个主体对应多条一级评论，一条一级评论又对应多条二级评论。
### 核心框架
- **Spring Boot 3.4.7** - 主框架
- **Java 17** - 开发语言
- **MAVEN 3.9.6** - 依赖管理工具
- **Sa-Token 1.44.0** - 权限认证框架
### 数据持久化
- **MySQL 8.0** - 主数据库
- **MyBatis-Plus 3.5.7** - ORM 框架
- **PageHelper 2.1.0** - 分页插件
### 中间件
- **Redis 6.0+** - 缓存和会话管理
- **Elasticsearch 7.12.1** - 搜索引擎
- **RabbitMQ 3.8** - 消息队列
- **Redisson 3.16.0** - 分布式锁
### 工具库
- **Hutool 5.8.26** - 工具集
- **Lombok** - 代码简化
### 项目结构

```
com.example.joinping/
├── Initializer/              # 初始化组件
│   ├── BloomFilterInitializer.java      # 布隆过滤器初始化
│   └── ElasticsearchIndexInitializer.java # ES索引初始化
├── aop/                      # 切面编程
│   ├── anotation/            # 自定义注解
│   └── aspect/               # 切面实现
├── background/               # 后台任务
│   ├── GlobalExceptionHandler.java      # 全局异常处理
│   ├── RabbitMQListener.java            # MQ消息监听
│   └── schedule/             # 定时任务
├── config/                   # 配置类
│   ├── ElasticsearchConfig.java         # ES配置
│   ├── JacksonConfig.java               # JSON配置
│   ├── MybatisPlusConfig.java           # MyBatis配置
│   ├── RabbitMQConfig.java              # MQ配置
│   ├── RedisConfig.java                 # Redis配置
│   ├── SaTokenConfig.java               # 权限配置
│   ├── WebConfig.java                   # Web配置
│   └── WebSocketConfig.java             # WebSocket配置
├── constant/                 # 常量定义
├── controller/               # 控制器层
├── entity/                   # 实体类
│   ├── common/               # 通用实体
│   ├── dto/                  # 数据传输对象
│   ├── extra/                # 扩展实体
│   ├── pojo/                 # 持久化对象
│   ├── relaPojo/             # 关系对象
│   └── vo/                   # 视图对象
├── enums/                    # 枚举类
├── mapper/                   # 数据访问层
├── service/                  # 业务逻辑层
└── utils/                    # 工具类
```

## 核心业务模块
### 1. 用户模块 (User)
- 用户注册、登录、认证
- 用户信息管理

### 2. 话题模块 (Topic)
- 话题创建、编辑、删除
- 话题点赞、收藏
- 话题浏览历史

### 3. 主体模块 (Thing)
- 主体创建、评分
- 评分统计
- 主体详情展示

### 4. 评论模块 (Comment)
- 一级评论 (T1Comment)
- 二级评论 (T2Comment)
- 评论点赞、回复

### 5. 搜索模块 (Search)
- 全文搜索 (Elasticsearch)
- 搜索结果排序
- 搜索建议

### 6. 通知模块 (Notice)
- 系统通知
- 消息推送 (WebSocket)
- 通知管理

### 7. 文件模块 (Document)
- 图片上传、展示

## 技术提炼
1. 构建基于 RabbitMQ 的异步审核流水线：调用 Ollama 本地大模型（deepseek-r1）进行智能初筛，调用 Elasticsearch 的 ik 分词器拆分文本，搭配布隆过滤器和哈希表实现敏感词的精准二次过滤。
2. 基于 Elasticsearch 构建话题检索索引库，通过“话题名+主体名”的多字段策略建立倒排索引，实现用户输入内容的毫秒级匹配 与相关话题ID召回，最终根据ID从 MySQL 完成数据的精准查询。
3. 利用 Redis 搭配分布式锁构建热门话题的双缓存，保障首页高频访问的性能。通过 Schedule 定时任务搭配消息队列每小时从 MySQL 查询近7天热度TOP10话题构建 ZSet 排行榜。引入 lua 脚本将对热榜话题的点赞等 CAS 操作原子化。
4. 集成 Sa-Token 实现轻量化用户权限控制。使用 WebSocket 确保在线用户能实时感知系统互动。使用基于注解的AOP搭配用户粒度的分布式互斥锁对请求接口进行归类限流。

## 运行须知
确保mysql,redis,es,mq,大模型都已启动。

**相关环境指令**

查看所有容器（已停止和运行）

docker ps -a

删除所有已停止的容器（不删除数据卷）

docker container prune

删除已停止容器

docker rm [id]

删除正在运行的容器

docker rm -f [id]

删除容器和其关联的数据卷

docker rm -v [id]

1.所需网络

docker network create jp-net

**2.所需容器**

**_mq配置容器_**

docker run -e RABBITMQ_DEFAULT_USER=joinping -e RABBITMQ_DEFAULT_PASS=123456 -v mq-plugins:/plugins -v mq-data:/var/lib/rabbitmq --name mq --hostname mq -p 15672:15672 -p 5672:5672 --network jp-net -d rabbitmq:3.8-management

**_es配置容器_**

docker run -d --name es -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" -e "discovery.type=single-node" -v es-data:/usr/share/elasticsearch/data -v es-plugins:/usr/share/elasticsearch/plugins --privileged --network jp-net -p 9200:9200 -p 9300:9300 elasticsearch:7.12.1

_**es可视化工具，用于浏览器端向es发请求**_

docker run -d --name kb -e ELASTICSEARCH_HOSTS=http://es:9200 --network=jp-net -p 5601:5601 kibana:7.12.1

**_Ollama准备_**

ollama run deepseek-r1:1.5b


----------------
----------------
----------------
梦到哪句说哪句环节
----------------
----------------
----------------
1.采用缓冲表，用户不知缓冲表的存在。新建话题-主体-一级评论-二级评论时都是先往缓冲表插入数据，等审核通过了再通过id定位缓冲表记录复制给正式表。

2.由于SpringBoot不支持通过元注解进行AOP拦截，即我用一个父注解标注不同子注解，切面拦截父注解来实现子注解的拦截。但进行分布式限流时确实有多个类别，难道为每个类别都些一个切面类吗？解决办法就是注解内用枚举作为参数。定义不同的枚举来实现同一个注解不同的实现。

3.所有Rela表的增删改操作都是对同一条记录进行的，不是传统的逻辑删除删一条，下次insert一条新的，而是删一条，下次insert时就update一下把status从1改为0。

4.所有关联用户表查询用户头像/昵称的select语句中，都无视用户表的status，确保用户注销后仍能获取其头像与昵称。

5.话题页内主体排序按创建时间顺序，主体页内一级评论可按热度/最新，一级评论页内二级评论按创建时间顺序。主体和二级评论不可点赞。所有举报都只能举报一次。