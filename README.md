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

## 🌐 Deployment

### MongoDB Atlas (Cloud)

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Get your connection string
3. Update `MONGODB_URI` in `.env`

### Hosting Options

- **Heroku**: Add MongoDB Atlas addon, deploy with Git
- **Railway**: Connect to MongoDB Atlas, deploy from GitHub
- **Render**: Free tier available, add environment variables
- **DigitalOcean**: App Platform with MongoDB integration
- **AWS/GCP/Azure**: Use managed MongoDB services

### Production Checklist

- [ ] Change default admin credentials
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up database backups
- [ ] Add rate limiting
- [ ] Enable logging

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
