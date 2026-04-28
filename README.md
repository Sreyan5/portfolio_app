# Sreyan Mandal — Portfolio v3.0

> Full-stack portfolio with admin CMS, REST API, and JSON database.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# → http://localhost:3000
```

## 📁 File Structure

```
C/
├── sreyan_portfolio.html   ← Main single-page portfolio (frontend)
├── server.js               ← Express.js backend server
├── api-client.js           ← Frontend API wrapper (included in HTML)
├── package.json            ← Node.js project config
├── README.md               ← This file
├── db/
│   └── data.json           ← JSON flat-file database
└── uploads/                ← Uploaded images (auto-created)
```

## 🔌 API Endpoints

### Public (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/portfolio` | Get all portfolio data |
| `GET` | `/api/certificates` | Get certificates list |
| `POST` | `/api/contact` | Send a visitor message |
| `POST` | `/api/analytics/visit` | Track a page visit |

### Admin (Requires `x-admin-token` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Authenticate & get token |
| `PUT` | `/api/admin/portfolio` | Update portfolio content |
| `POST` | `/api/admin/certificates` | Add a certificate |
| `DELETE` | `/api/admin/certificates/:id` | Remove a certificate |
| `GET` | `/api/admin/messages` | View visitor messages |
| `DELETE` | `/api/admin/messages/:id` | Delete a message |
| `PATCH` | `/api/admin/messages/:id/read` | Mark message read |
| `GET` | `/api/admin/analytics` | View visit analytics |
| `POST` | `/api/admin/upload` | Upload an image |
| `GET` | `/api/admin/export` | Download full DB backup |

## 🔐 Admin Access

- **On the site:** Press `Ctrl+Shift+A` or triple-click bottom-left corner
- **Credentials:** `sreyan` / `bbit@2024`
- **Token-based auth:** Login returns a base64 token stored in sessionStorage

## 🗄️ Database

The `db/data.json` file stores everything:
- Portfolio content (hero, sidebar, skills, projects, timeline, blog)
- Certificates
- Visitor contact messages
- Visit analytics
- Admin credentials

**Backup:** Use `GET /api/admin/export` to download the full DB.

## ⚡ Features

- ✅ Single-file HTML frontend with cyberpunk aesthetics
- ✅ Blur-to-clear scroll reveal animations
- ✅ Admin CMS with live-edit capability
- ✅ Certificate scrolling reel with CRUD
- ✅ Contact form → stored in database
- ✅ Visitor analytics tracking
- ✅ Image upload support
- ✅ Canvas particle background
- ✅ Custom cursor + hover effects
- ✅ Fully responsive design

## 📋 1st Year Student Note

As a 1st year B.Tech CSE student, the portfolio reflects current learning progress.
Skill levels and project descriptions are realistic — not inflated.
