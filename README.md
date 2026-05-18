# 🎨 ImageGen AI — GPT Image Generation Web App

A full-stack web application for AI image generation using OpenAI's `gpt-image-1` model, with user authentication, chat-style history, and MySQL persistence.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Backend | Node.js + Express |
| Database | MySQL 8+ |
| AI | OpenAI gpt-image-1 |
| Auth | JWT + bcrypt |
| Storage | Local filesystem (`/uploads`) |

---

## 📁 Project Structure

```
image-gen-app/
├── backend/
│   ├── config/
│   │   └── database.js       # MySQL pool + auto table creation
│   ├── middleware/
│   │   └── auth.js           # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js           # POST /api/auth/register, /login, GET /me
│   │   ├── images.js         # POST /api/images/generate
│   │   └── conversations.js  # GET/DELETE/PATCH /api/conversations
│   ├── uploads/              # Generated images stored here
│   ├── server.js             # Express entry point
│   ├── .env.example          # Environment template
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx   # Conversation list + user menu
    │   │   └── Message.jsx   # Message bubble + image display
    │   ├── hooks/
    │   │   └── useAuth.jsx   # Auth context + provider
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   └── ChatPage.jsx  # Main chat interface
    │   ├── utils/
    │   │   └── api.js        # Axios instance + API methods
    │   ├── styles/
    │   │   └── global.css    # ChatGPT-inspired dark theme
    │   ├── App.jsx           # Router + auth guards
    │   └── main.jsx
    ├── public/
    │   └── favicon.svg
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8+
- OpenAI API key (with access to gpt-image-1)

---

### 1. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=3001
JWT_SECRET=your_long_random_secret_here
OPENAI_API_KEY=sk-your-openai-key-here
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=image_gen_db
FRONTEND_URL=http://localhost:5173
```

Start MySQL, then run:

```bash
npm run dev
```

The server will:
- Auto-create the `image_gen_db` database
- Auto-create `users`, `conversations`, and `messages` tables
- Start on http://localhost:3001

---

### 2. Set up the Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173

---

## 🗄️ Database Schema

### `users`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | |
| username | VARCHAR(50) UNIQUE | |
| email | VARCHAR(100) UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt hashed |
| created_at | TIMESTAMP | |

### `conversations`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | |
| user_id | INT FK → users | |
| title | VARCHAR(255) | Auto-set from first prompt |
| created_at, updated_at | TIMESTAMP | |

### `messages`
| Column | Type | Description |
|--------|------|-------------|
| id | INT PK AUTO_INCREMENT | |
| conversation_id | INT FK | |
| user_id | INT FK | |
| role | ENUM('user','assistant') | |
| content | TEXT | Message text |
| image_url | VARCHAR(500) | Full URL to generated image |
| image_prompt | TEXT | Original prompt used |
| model_used | VARCHAR(100) | e.g. `gpt-image-1` |
| created_at | TIMESTAMP | |

---

## 🔌 API Endpoints

### Auth
```
POST /api/auth/register   { username, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         → current user info
```

### Images
```
POST /api/images/generate  { prompt, conversationId?, size? }
```

### Conversations
```
GET    /api/conversations
GET    /api/conversations/:id/messages
DELETE /api/conversations/:id
PATCH  /api/conversations/:id  { title }
```

### Static Files
```
GET /uploads/:filename   → Serves generated images
```

---

## 🎨 Features

- **User Auth** — Register, login, JWT-secured sessions (7 days)
- **Image Generation** — Full gpt-image-1 integration with size selection
- **Local Storage** — Images saved as PNG to `/uploads` folder
- **MySQL Persistence** — Image URLs, prompts, and all messages stored in DB
- **Chat History** — Full conversation history with sidebar navigation
- **Responsive UI** — ChatGPT-inspired dark theme
- **Image Actions** — Full-size lightbox view, one-click download

---

## 🚀 Production Deployment

### Backend
```bash
npm start   # uses NODE_ENV=production
```

For production, consider:
- Nginx reverse proxy in front of Express
- Serve `/uploads` via Nginx for better performance
- Use PM2 for process management: `pm2 start server.js`

### Frontend
```bash
npm run build   # outputs to dist/
```

Serve the `dist/` folder via Nginx or any static host.

Update `vite.config.js` proxy or set `VITE_API_URL` env var for the API base URL.

---

## 🛡️ Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens expire after 7 days
- Input validation on all endpoints
- CORS restricted to configured frontend URL
- Prompts validated for length before API calls
