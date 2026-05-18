# 🎨 ImageGen AI — GPT 图片生成 Web 应用

一个全栈 AI 图片生成 Web 应用，使用 OpenAI `gpt-image-1` 模型，支持用户注册登录、聊天式历史记录、MySQL 持久化存储。

---

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + Vite + React Router |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8 |
| AI | OpenAI gpt-image-1 |
| 认证 | JWT + bcrypt |
| 存储 | 本地文件系统（uploads，Docker Volume 持久化）|
| 部署 | Docker Compose + Nginx 反向代理 |

---

## 📁 项目结构

```
image-gen-app/
├── .env.example                  # 环境变量模板（根目录）
├── docker-compose.yml
├── nginx/
│   └── default.conf              # Nginx 反向代理配置
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   ├── server.js
│   ├── config/database.js
│   ├── middleware/auth.js
│   ├── routes/auth.js
│   ├── routes/images.js
│   ├── routes/conversations.js
│   └── uploads/
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx-spa.conf
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx / main.jsx
        ├── hooks/useAuth.jsx
        ├── utils/api.js
        ├── styles/global.css
        ├── components/Sidebar.jsx
        ├── components/Message.jsx
        ├── pages/LoginPage.jsx
        ├── pages/RegisterPage.jsx
        └── pages/ChatPage.jsx
```

---

## 🐳 Docker Compose 启动（推荐）

### 前提条件
- Docker & Docker Compose v2+
- OpenAI API Key（需有 gpt-image-1 访问权限）

### 1. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env`，至少填写以下三项：

```env
OPENAI_API_KEY=sk-你的OpenAI密钥
JWT_SECRET=任意长随机字符串
DB_PASSWORD=自定义MySQL密码
```

### 2. 一键启动

```bash
docker compose up -d --build
```

### 3. 打开浏览器

```
http://localhost
```

---

## 🧩 服务架构

```
浏览器
  └── :80  Nginx（反向代理）
              ├── /api/*     → backend:3001（Node.js）
              ├── /uploads/* → backend:3001（静态图片）
              └── /*         → frontend:80（React SPA）
                                   ↕
                              mysql:3306（内网）
```

---

## 📋 常用命令

```bash
docker compose ps                    # 查看服务状态
docker compose logs -f backend       # 查看后端日志
docker compose logs -f               # 查看全部日志
docker compose down                  # 停止（保留数据）
docker compose down -v               # 停止并清除所有数据（慎用）
docker compose up -d --build         # 代码修改后重新构建
```

---

## ⚙️ 环境变量

| 变量 | 必填 | 说明 | 默认值 |
|------|------|------|--------|
| OPENAI_API_KEY | ✅ | OpenAI API 密钥 | — |
| JWT_SECRET | ✅ | JWT 签名密钥 | — |
| DB_PASSWORD | ✅ | MySQL root 密码 | — |
| DB_NAME | | 数据库名 | image_gen_db |
| FRONTEND_URL | | CORS 允许来源 | http://localhost |
| APP_PORT | | 对外暴露端口 | 80 |

---

## 💻 本地开发模式（不用 Docker）

需要 Node.js 18+ 和本地 MySQL 8+。

```bash
# 后端
cd backend && npm install
cp .env.example .env   # 编辑，DB_HOST=localhost
npm run dev            # http://localhost:3001

# 前端（另开终端）
cd frontend && npm install
npm run dev            # http://localhost:5173
```

