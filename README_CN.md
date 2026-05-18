# 🎨 ImageGen AI — GPT 图像生成网页应用

一个完整的全栈 Web 应用，使用 OpenAI 的 `gpt-image-1` 模型进行 AI 图像生成，支持用户认证、聊天式历史记录，以及 MySQL 数据持久化。

---

## 🏗️ 技术栈

| 层级 | 技术 |
|-------|-----------|
| 前端 | React 18 + Vite + React Router |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8+ |
| AI | OpenAI gpt-image-1 |
| 认证 | JWT + bcrypt |
| 存储 | 本地文件系统 (`/uploads`) |

---

## 📁 项目结构

```
image-gen-app/
├── backend/
│   ├── config/
│   │   └── database.js       # MySQL 连接池 + 自动建表
│   ├── middleware/
│   │   └── auth.js           # JWT 验证中间件
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/register, /login, GET /me
│   │   ├── images.js         # POST /api/images/generate
│   │   └── conversations.js  # GET/DELETE/PATCH /api/conversations
│   ├── uploads/              # 存储生成的图片
│   ├── server.js             # Express 入口文件
│   ├── .env.example          # 环境变量模板
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx   # 对话列表 + 用户菜单
    │   │   └── Message.jsx   # 消息气泡 + 图片展示
    │   ├── hooks/
    │   │   └── useAuth.jsx   # 认证上下文 + Provider
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── ChatPage.jsx  # 主聊天界面
    │   ├── utils/
    │   │   └── api.js        # Axios 实例 + API 方法
    │   ├── styles/
    │   │   └── global.css    # ChatGPT 风格暗黑主题
    │   ├── App.jsx           # 路由 + 认证保护
    │   └── main.jsx
    ├── public/
    │   └── favicon.svg
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ 快速开始

### 前置条件
- Node.js 18+
- MySQL 8+
- OpenAI API Key（需支持 gpt-image-1）

---

### 1. 设置后端

```bash
cd backend
npm install
cp .env.example .env
```

编辑 `.env`，填写你的凭证：

```env
PORT=3001
JWT_SECRET=你的随机长字符串
OPENAI_API_KEY=sk-你的-openai-key
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=image_gen_db
FRONTEND_URL=http://localhost:5173
```

启动 MySQL，然后运行：

```bash
npm run dev
```

服务器将会：
- 自动创建 `image_gen_db` 数据库
- 自动创建 `users`、`conversations` 和 `messages` 表
- 启动服务于 http://localhost:3001

---

### 2. 设置前端

```bash
cd frontend
npm install
npm run dev
```

访问 http://localhost:5173

---

## 🗄️ 数据库结构

### `users`
| 列 | 类型 | 描述 |
|--------|------|------|
| id | INT PK AUTO_INCREMENT | 用户 ID |
| username | VARCHAR(50) UNIQUE | 用户名 |
| email | VARCHAR(100) UNIQUE | 邮箱 |
| password_hash | VARCHAR(255) | bcrypt 加密后的密码 |
| created_at | TIMESTAMP | 创建时间 |

### `conversations`
| 列 | 类型 | 描述 |
|--------|------|------|
| id | INT PK AUTO_INCREMENT | 对话 ID |
| user_id | INT FK → users | 用户 ID |
| title | VARCHAR(255) | 从首个 prompt 自动生成标题 |
| created_at, updated_at | TIMESTAMP | 创建/更新时间 |

### `messages`
| 列 | 类型 | 描述 |
|--------|------|------|
| id | INT PK AUTO_INCREMENT | 消息 ID |
| conversation_id | INT FK | 对话 ID |
| user_id | INT FK | 用户 ID |
| role | ENUM('user','assistant') | 消息角色 |
| content | TEXT | 消息文本 |
| image_url | VARCHAR(500) | 生成图片完整 URL |
| image_prompt | TEXT | 原始 prompt |
| model_used | VARCHAR(100) | 使用的模型，例如 `gpt-image-1` |
| created_at | TIMESTAMP | 创建时间 |

---

## 🔌 API 接口

### 认证
```
POST /api/auth/register   { username, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → 当前用户信息
```

### 图片生成
```
POST /api/images/generate  { prompt, conversationId?, size? }
```

### 对话
```
GET    /api/conversations
GET    /api/conversations/:id/messages
DELETE /api/conversations/:id
PATCH  /api/conversations/:id  { title }
```

### 静态文件
```
GET /uploads/:filename   → 提供生成的图片
```

---

## 🎨 功能

- **用户认证** — 注册、登录，JWT 会话（7 天）
- **图像生成** — 完整 gpt-image-1 集成，可选择尺寸
- **本地存储** — PNG 格式保存在 `/uploads` 文件夹
- **MySQL 持久化** — 保存图片 URL、prompt 和所有消息
- **聊天历史** — 完整对话历史，侧边栏导航
- **响应式 UI** — ChatGPT 风格暗黑主题
- **图片操作** — 全尺寸查看、单击下载

---

## 🚀 生产部署

### 后端
```bash
npm start   # 使用 NODE_ENV=production
```

生产环境建议：
- 在 Express 前使用 Nginx 反向代理
- 通过 Nginx 提供 `/uploads`，提升性能
- 使用 PM2 管理进程：`pm2 start server.js`

### 前端
```bash
npm run build   # 输出到 dist/
```

使用 Nginx 或任意静态服务器提供 `dist/` 文件夹。

更新 `vite.config.js` 的代理或设置 `VITE_API_URL` 环境变量以指向 API 基础 URL。

---

## 🛡️ 安全说明

- 密码使用 bcrypt 加密（12 轮）
- JWT token 7 天过期
- 所有接口输入均验证
- CORS 限制为配置的前端 URL
- 调用 API 前验证 prompt 长度

