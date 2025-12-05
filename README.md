## SSR 博客平台

基于 React 18、Express 与 MySQL 构建的同构博客系统示例，首页与详情页采用服务端渲染（SSR）以提升首屏加载速度与 SEO 表现，同时提供完整的文章增删改查 API 与数据库设计。

### 功能亮点
- **SSR 文章列表与详情**：服务器预渲染路由，客户端完成 hydration 并保持交互能力。
- **RESTful API**：`/api/articles` 提供列表、详情（支持 ID 与 slug）、新增、更新及逻辑/物理删除。
- **MySQL 数据建模**：包含用户、文章、标签及关联表，提供基础索引与示例迁移脚本。
- **前端交互**：分页、标签筛选、详情浏览等基础能力，统一使用 React Router。
- **工程能力**：TypeScript 全覆盖、Vite 构建、Vitest 测试、ESLint/Prettier 规范。

### 系统要求
- Node.js >= 18
- MySQL >= 5.7 或 MariaDB >= 10.3
- npm >= 8 或 yarn >= 1.22

### 技术栈
- **前端**：React 18、React Router、Vite（SSR + SWC）、Ant Design 5、Day.js
- **后端**：Express、mysql2/promise、Zod、Node.js (>= 18)
- **工具链**：TypeScript、Vitest、ESLint、Prettier、tsx、globby

### 项目结构
```
├── db
│   └── migrations/            # SQL 迁移脚本
├── public/                    # 静态资源占位目录
├── server
│   ├── api/                   # REST 路由与控制器
│   ├── config/                # 环境变量、依赖上下文
│   ├── db/                    # 连接池定义
│   ├── middleware/            # 通用中间件
│   ├── repositories/          # 数据访问层
│   ├── scripts/               # 运维脚本（迁移）
│   ├── services/              # 业务逻辑层
│   └── ssr/                   # SSR 中间件与数据获取
├── shared/                    # 前后端共享 TypeScript 类型
├── src
│   ├── components/            # 复用组件
│   ├── entries/               # 客户端/服务端入口
│   ├── hooks/                 # 自定义 hooks
│   ├── routes/                # 页面组件
│   ├── state/                 # 初始数据上下文
│   └── styles/                # 全局样式
├── package.json
└── vite.config.ts
```

### 本地开发
1. **安装依赖**
	```bash
	npm install
	```

2. **配置环境变量**
	```bash
	cp .env.example .env
	# 根据实际数据库环境调整 .env 内容
	```
	环境变量说明：
	- `NODE_ENV`: 运行环境 (development/test/production)
	- `PORT`: 服务端口，默认 5174
	- `MYSQL_HOST`: MySQL 主机地址
	- `MYSQL_PORT`: MySQL 端口号，默认 3306
	- `MYSQL_USER`: MySQL 用户名
	- `MYSQL_PASSWORD`: MySQL 密码
	- `MYSQL_DATABASE`: MySQL 数据库名
	- `MYSQL_CONNECTION_LIMIT`: MySQL 连接池大小限制，默认 10

3. **初始化数据库**
	```bash
	npm run dev:db
	```

4. **启动开发模式（带 SSR 与 Vite HMR）**
	```bash
	npm run dev
	```
	- Express SSR 服务默认监听 `http://localhost:5174`
	- Vite 以中间件形式提供 HMR，无需单独启动

### 构建与部署
1. **生产构建**（客户端 + SSR Bundle）
	```bash
	npm run build
	```
	- 产物位于 `dist/client`（静态资源）与 `dist/ssr`（服务器渲染入口）
	- 服务端代码位于 `dist/server`

2. **启动生产服务**
	```bash
	npm run start
	```

### 目录结构说明
```
├── db/                        # 数据库相关文件
│   └── migrations/            # SQL 迁移脚本
├── dist/                      # 构建产物目录
│   ├── client/                # 客户端构建产物（静态资源）
│   ├── server/                # 服务端构建产物
│   └── ssr/                   # SSR 构建产物
├── public/                    # 静态资源占位目录
├── server/                    # 服务端代码
│   ├── api/                   # REST 路由与控制器
│   ├── config/                # 环境变量、依赖上下文
│   ├── db/                    # 连接池定义
│   ├── middleware/            # 通用中间件
│   ├── repositories/          # 数据访问层
│   ├── scripts/               # 运维脚本（迁移）
│   ├── services/              # 业务逻辑层
│   └── ssr/                   # SSR 中间件与数据获取
├── shared/                    # 前后端共享 TypeScript 类型
├── src/                       # 客户端源代码
│   ├── components/            # 可复用组件
│   ├── entries/               # 客户端/服务端入口
│   ├── hooks/                 # 自定义 hooks
│   ├── routes/                # 页面组件
│   ├── state/                 # 初始数据上下文
│   └── styles/                # 全局样式
├── .env.example               # 环境变量示例配置
├── .gitignore                 # Git 忽略文件配置
├── package.json               # 项目依赖和脚本配置
├── tsconfig*.json             # TypeScript 配置文件
└── vite.config.ts             # Vite 构建配置
```

### API 速览
| 方法 | 路径 | 描述 |
| ---- | ---- | ---- |
| GET  | `/api/articles` | 分页查询文章，支持 `page`、`pageSize`、`tag`、`sort`、`order`、`search` 等查询参数 |
| GET  | `/api/articles/:id` | 根据 ID 获取文章详情 |
| GET  | `/api/articles/slug/:slug` | 根据 slug 获取文章详情 |
| POST | `/api/articles` | 新增文章（包含标签、状态、发布时间等字段） |
| PUT  | `/api/articles/:id` | 更新文章内容与标签 |
| DELETE | `/api/articles/:id` | 按 ID 删除（默认逻辑删除，可通过 `?hard=true` 物理删除） |
| DELETE | `/api/articles?ids=1,2` | 批量删除 |

API 输入输出通过 Zod 校验，错误将返回 400 状态码，JSON 结构包含 `message` 与可选 `details`。

### 数据库模型
- `users`：作者信息（示例迁移写入默认作者）
- `articles`：文章主体，包含 slug、阅读时长、状态、发布时间、逻辑删除标记等字段
- `tags`：标签字典，自动维护唯一 slug
- `article_tags`：文章-标签关联表

迁移脚本位于 `db/migrations/001_init.sql`，可根据需要追加更多迁移文件，命名推荐 `NNN_description.sql`。

### SSR 渲染流程
1. Express 中间件在服务端解析路由，根据 URL 调用对应的数据服务。
2. 生成的初始状态注入到 React `InitialDataProvider`，服务端使用 `StaticRouter` 渲染 HTML。
3. 客户端入口通过 `hydrateRoot` 完成 hydration，并复用同一份初始数据。
4. 之后的路由切换与交互通过浏览器端 React Router 与 API 完成。

### 后续扩展建议
- 集成 Markdown 编辑与服务端渲染（例如使用 `mdx` 或 `remark`）。
- 增加用户登录、后台管理与权限控制。
- 引入缓存层（Redis）优化热门文章读取性能。
- 使用 `react-query` 等数据层方案统一客户端数据请求与缓存。

欢迎根据业务需求二次开发并完善部署流程。若有问题，建议优先确认数据库连接、环境变量及迁移是否成功执行。
