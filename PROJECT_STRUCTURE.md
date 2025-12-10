# 项目结构说明

## 目录结构

```
Blog-Platform/
├── .editorconfig              # 编辑器配置
├── .env.example               # 环境变量示例
├── .eslint.config.ts          # ESLint 配置
├── .gitignore                 # Git 忽略文件
├── .npmrc                     # npm 配置
├── .prettierrc               # Prettier 配置
├── README.md                  # 项目说明文档
├── document.md               # 技术文档
├── package.json              # 项目配置和依赖
├── package-lock.json         # 依赖锁定文件
├── vite.config.ts            # Vite 构建配置
├── tsconfig*.json            # TypeScript 配置
├── vitest.config.ts          # 测试配置
├── vitest.setup.ts           # 测试初始化
│
├── db/                       # 数据库相关
│   └── migrations/           # 数据库迁移脚本
│       ├── 001_init.sql
│       └── 002_seed_test_data.sql
│
├── dist/                     # 构建产物目录
├── public/                   # 静态资源目录
├── coverage/                 # 测试覆盖率报告
│
├── server/                   # 服务端代码
│   ├── index.ts             # 服务端入口
│   ├── app.ts               # Express 应用配置
│   ├── config/              # 配置相关
│   │   ├── env.ts           # 环境变量配置
│   │   └── context.ts       # 依赖注入上下文
│   ├── api/                 # API 路由层
│   │   ├── index.ts         # 路由聚合
│   │   ├── articlesRouter.ts # 文章路由
│   │   ├── controllers/     # 控制器
│   │   │   └── articlesController.ts
│   │   └── validators/      # 数据验证
│   │       └── articleSchemas.ts
│   ├── middleware/          # 中间件
│   │   ├── errorHandler.ts  # 错误处理
│   │   └── notFound.ts      # 404 处理
│   ├── services/            # 业务逻辑层
│   │   └── articleService.ts
│   ├── repositories/        # 数据访问层
│   │   ├── articleRepository.ts
│   │   └── userRepository.ts
│   ├── db/                  # 数据库连接
│   │   └── pool.ts
│   ├── ssr/                 # 服务端渲染相关
│   │   ├── middleware.ts    # SSR 中间件
│   │   ├── resolveInitialState.ts # 初始状态解析
│   │   └── template.ts      # HTML 模板
│   ├── scripts/             # 运维脚本
│   │   └── run-migrations.ts
│   └── utils/               # 工具函数
│       └── slug.ts          # slug 生成工具
│
├── shared/                   # 前后端共享代码
│   └── types/               # 共享类型定义
│
└── src/                      # 前端源代码
    ├── App.tsx              # 根组件
    ├── entries/             # 入口文件
    │   ├── client.tsx       # 客户端入口
    │   └── server.tsx       # 服务端入口
    ├── components/          # 可复用组件
    │   └── ArticleCard.tsx  # 文章卡片组件
    ├── hooks/               # 自定义 Hooks
    │   └── useArticlesApi.ts # API 调用 Hook
    ├── routes/              # 页面组件
    │   ├── ArticleListPage.tsx   # 文章列表页
    │   ├── ArticleDetailPage.tsx # 文章详情页
    │   ├── ArticleCreatePage.tsx # 创建文章页
    │   ├── ErrorPage.tsx         # 错误页面
    │   └── NotFoundPage.tsx      # 404 页面
    ├── state/               # 状态管理
    │   └── InitialDataContext.tsx # 初始数据上下文
    └── styles/              # 样式文件
        └── global.css       # 全局样式
```

## 架构分层

### 1. 数据访问层 (Repository)
- 位于 `server/repositories/`
- 负责与数据库直接交互
- 封装 SQL 查询和结果映射

### 2. 业务逻辑层 (Service)
- 位于 `server/services/`
- 实现核心业务逻辑
- 协调多个 Repository 的操作

### 3. 控制器层 (Controller)
- 位于 `server/api/controllers/`
- 处理 HTTP 请求和响应
- 调用 Service 层处理业务

### 4. 路由层 (Router)
- 位于 `server/api/`
- 定义 API 路由和中间件
- 路由参数验证

### 5. 前端组件层
- 位于 `src/` 目录
- 页面组件 (`routes/`)
- 可复用组件 (`components/`)
- 自定义 Hooks (`hooks/`)

## 开发规范

### 命名约定
- 文件命名：PascalCase (组件) / camelCase (工具函数)
- 目录命名：kebab-case
- 变量命名：camelCase

### 代码组织
- 每个功能模块独立文件夹
- 相关文件就近放置
- 共享代码放在 `shared/`

### 提交规范
- feat: 新功能
- fix: 修复 bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

## 构建流程

1. **开发模式**: `npm run dev`
2. **构建生产**: `npm run build`
3. **代码检查**: `npm run lint`
4. **代码格式化**: `npm run format`
5. **测试**: `npm run test`