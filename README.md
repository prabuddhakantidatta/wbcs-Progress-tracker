# WBCS 2026 - Interactive Prep Tracker

A comprehensive study preparation tracker for WBCS (West Bengal Civil Service) 2026 examination with MongoDB backend for data persistence.

## 🌟 Features

- **User Authentication**: Secure login/registration with JWT tokens
- **Dashboard**: Real-time progress tracking with visual statistics
- **Subject Management**: Add, edit, and organize subjects
- **Task Scheduling**: Day-wise study schedule with January-March 2026 blueprint
- **Test Tracker**: Record and analyze mock test performance
- **Study Timer**: Built-in session timer with session logging
- **Dark Mode**: Toggle between light and dark themes
- **Data Backup**: Export/import data as JSON
- **Admin Panel**: Manage blueprints, subjects, and routines (admin users only)
- **Cloud Sync**: All data stored in MongoDB, accessible from any device

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB (local installation or MongoDB Atlas cloud)
- npm or yarn

### Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB connection string and JWT secret.

4. **Start MongoDB** (if using local installation)
   ```bash
   mongod
   ```

5. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

6. **Open the application**
   
   Navigate to `http://localhost:5000` in your browser.

### Default Admin Credentials

After first run, the database is seeded with:
- **Email**: admin@wbcs.com
- **Password**: admin123

⚠️ **Change these credentials in production!**

## 📁 Project Structure

```
wbcs-tracker/
├── index.html        # Frontend application (single-page)
├── server.js         # Express.js backend with MongoDB
├── package.json      # Node.js dependencies
├── .env.example      # Environment variables template
├── .env              # Your local environment config (create from example)
└── README.md         # This file
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Data (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/data` | Get all shared data (subjects, tasks, tests, routines) |
| PUT | `/api/data` | Update shared data (admin only) |

### User Progress (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/progress` | Get user's progress |
| PUT | `/api/progress` | Save user's progress |

### Subjects (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subjects` | List all subjects |
| POST | `/api/subjects` | Create subject (admin) |
| PUT | `/api/subjects/:id` | Update subject (admin) |
| DELETE | `/api/subjects/:id` | Delete subject (admin) |

### Tasks (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (filter by month/subject) |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

### Tests (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tests` | List all tests |
| POST | `/api/tests` | Create test (admin) |
| PUT | `/api/tests/:id` | Update test (admin) |

### Routines (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routines` | Get all routines |
| PUT | `/api/routines/:type` | Update routine (admin) |

### Analytics (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics` | Get user analytics |

## 🗄️ MongoDB Collections

- **users** - User accounts with authentication data
- **userprogresses** - Per-user progress tracking (completed tasks, test scores, notes)
- **subjects** - Study subjects (shared/admin managed)
- **tasks** - Study schedule tasks (shared/admin managed)
- **tests** - Mock test schedule (shared/admin managed)
- **routines** - Daily routines (weekday, saturday, sunday)
- **settings** - Global application settings

## 🔒 Security Features

- Password hashing with bcrypt (12 rounds)
- JWT token-based authentication (30-day expiry)
- Admin-only routes for data management
- CORS enabled for cross-origin requests
- Input validation on all endpoints

## 🌐 Deployment + Integration (MongoDB + Firebase)

This app already supports **MongoDB persistence** via the Node/Express backend (`server.js`). Firebase can be used in two common ways:

1) **Firebase Hosting (recommended)** for the frontend (fast CDN + custom domain)
2) **Firebase Authentication (optional)** for sign-in, while still storing study data in MongoDB

Below is the end-to-end process.

---

## 1) MongoDB Atlas Setup (Required)

1. Create a free MongoDB Atlas cluster: https://www.mongodb.com/atlas
2. Create a DB user (Database Access → Add New Database User)
3. Whitelist IPs (Network Access):
   - For development: `0.0.0.0/0` (not recommended for production)
   - For production: add the IP range of your hosting provider (Render/Railway/etc.)
4. Copy your connection URI (Connect → Drivers), for example:
   ```
   mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/wbcs_tracker?retryWrites=true&w=majority
   ```

---

## 2) Local Integration Test (Backend + Frontend)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env`:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env`:
   - `MONGODB_URI=<your atlas uri>`
   - `JWT_SECRET=<long random secret>`
   - `PORT=5000`
4. Start server:
   ```bash
   npm start
   ```
5. Open:
   - http://localhost:5000

The Express server serves the SPA and exposes the API at `/api/*`.

---

## 3) Deploy the Backend (MongoDB + API)

You have two good patterns:

### Option A (Simplest): Single deployment (Backend serves Frontend)
Deploy the entire project as one Node service. This is the easiest because the frontend auto-uses `window.location.origin + /api`.

**Render** example:
1. Create a new **Web Service** from your GitHub repo
2. Environment:
   - Runtime: Node
   - Build Command: `npm install`
   - Start Command: `npm start`
3. Add environment variables in Render dashboard:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `NODE_ENV=production`
4. Deploy

Visit:
- `https://YOUR_RENDER_URL/` (app)
- `https://YOUR_RENDER_URL/api` (API)


### Option B: Split deployment (Frontend on Firebase Hosting, Backend elsewhere)
Deploy backend to Render/Railway/Fly.io, and host the SPA on Firebase Hosting.

When split, you must point the frontend to your backend API.

This app supports a **soft-coded API URL override**:
```js
localStorage.setItem('wbcs_api_base', 'https://YOUR_BACKEND_DOMAIN/api');
location.reload();
```
(You can run this once from the browser console on your deployed frontend.)

**CORS:** if you deploy split-origin, configure CORS in `server.js` to allow your Firebase hosting domain.

---

## 4) Deploy Frontend to Firebase Hosting (Recommended CDN)

### 4.1 Install Firebase tools
```bash
npm i -g firebase-tools
firebase login
```

### 4.2 Initialize Firebase Hosting
From the project folder:
```bash
firebase init hosting
```
Choose:
- Public directory: `.` (because `index.html` is at project root)
- Configure as SPA: **Yes** (rewrite all to `index.html`)

It will create `firebase.json`.

### 4.3 Deploy
```bash
firebase deploy
```

### 4.4 Point frontend to your backend API
Open your deployed Firebase site, open DevTools Console, run:
```js
localStorage.setItem('wbcs_api_base', 'https://YOUR_BACKEND_DOMAIN/api');
location.reload();
```

---

## 5) Optional: Firebase Authentication + MongoDB (Advanced)

If you want Firebase Auth UI/OTP/Google login etc., a typical architecture is:

- **Firebase Auth** = identity provider
- **Node/Express** verifies Firebase ID token
- **MongoDB** stores blueprint + per-user progress keyed by Firebase UID

### High-level steps
1. Create Firebase project
2. Enable Auth providers (Email/Password, Google, etc.)
3. Add Firebase client SDK to frontend and sign-in via Firebase
4. On backend:
   - Install `firebase-admin`
   - Verify `Authorization: Bearer <FIREBASE_ID_TOKEN>`
   - Map `uid/email/name` to a MongoDB `User` record
   - Store progress in MongoDB per user

### Notes
- If you do Firebase Auth, you typically remove the app’s `/api/auth/login` + `/api/auth/register` (or keep them as a fallback).
- Firebase Hosting pairs nicely with Firebase Auth.

---

## 6) Production Checklist

- [ ] Change default admin credentials
- [ ] Use a strong `JWT_SECRET` (32+ chars)
- [ ] Restrict MongoDB IP access (do NOT keep 0.0.0.0/0)
- [ ] Configure CORS to only allow your production domains
- [ ] Enable HTTPS (Render/Firebase provide this by default)
- [ ] Backups/monitoring for MongoDB Atlas
- [ ] Add rate limiting + request validation (recommended)


## 📱 Offline Support

The frontend includes localStorage fallback for offline usage. When the server is unavailable:
- Data is stored locally
- Syncs automatically when connection restored
- Use "Sync" button to manually sync

## 🛠️ Customization

### Adding New Subjects
1. Login as admin
2. Go to Admin Panel → Manage Subjects
3. Click "Add New Subject"

### Modifying Blueprints
1. Login as admin
2. Go to Admin Panel → Manage Monthly Blueprints
3. Select month and add/edit tasks

### Changing Routines
1. Login as admin
2. Go to Admin Panel → Manage Routines
3. Edit weekday/weekend schedules

## 📄 License

MIT License - Feel free to use and modify for your exam preparation needs.

## 🤝 Contributing

Contributions welcome! Please open an issue or pull request.

## 📞 Support

For issues or feature requests, please create an issue in the repository.

---

**Good luck with your WBCS 2026 preparation! 🎯**
