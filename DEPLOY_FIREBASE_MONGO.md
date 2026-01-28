# Deploy WBCS Prep Tracker (MongoDB + GitHub + Firebase Authentication)

This guide explains how to deploy this project with:

- **MongoDB Atlas** for data storage
- **GitHub** for source control
- **Firebase Authentication** for sign-in (Email/Password or Google)
- **Deployment** options:
  - **Split deploy (recommended):** Frontend on **Firebase Hosting**, backend on **Render/Railway/Fly.io**
  - **Single deploy:** Backend serves the SPA + API from one Node service

> Note: Your current frontend may be configured to bypass login (local/offline mode). This guide shows how to **enable Firebase sign-in** cleanly.

---

## 0) Prerequisites

- Node.js **18+**
- Git installed
- A MongoDB Atlas account
- A Firebase project
- A hosting platform account (Render/Railway/Fly)

---

## 1) Push the project to GitHub

```bash
git init
git add .
git commit -m "Initial commit"

git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```

---

## 2) Setup MongoDB Atlas

1. Create a cluster: https://cloud.mongodb.com
2. Create a DB user: **Database Access → Add New Database User**
3. Allow IP access:
   - For quick testing: **Network Access → Add IP Address → 0.0.0.0/0**
   - Production: restrict to your backend host IP/range
4. Get the connection string:

Example:
```
mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/wbcs_tracker?retryWrites=true&w=majority
```

---

## 3) Create Firebase Project + Enable Authentication

1. Create project: https://console.firebase.google.com/
2. Enable Auth:
   - **Authentication → Sign-in method → Email/Password** (enable)
   - (Optional) enable **Google**
3. Create a Web App:
   - **Project Settings → Your apps → Web app**
   - Copy the Firebase config for frontend

### 3.1 Generate a Firebase Admin Service Account (for backend)

1. Firebase Console → **Project settings → Service accounts**
2. Click **Generate new private key**
3. Download JSON file (keep private)

You’ll use this in backend environment variables.

---

## 4) Choose a deployment architecture

### Option A (Recommended): Split Deploy

- Frontend: **Firebase Hosting**
- Backend: **Render/Railway/Fly.io**
- MongoDB Atlas: external
- Auth: Firebase Auth (frontend) + firebase-admin verification (backend)

Pros: best performance, clean separation, scalable

### Option B: Single Deploy

- Deploy Node backend only; it serves:
  - `/` → `index.html`
  - `/api/*` → API

Pros: simplest, no cross-origin issues

---

## 5) Backend: Enable Firebase Authentication (server-side)

### 5.1 Install dependency

In `package.json` we use:

- `firebase-admin`

Install locally:
```bash
npm install
```

### 5.2 Add environment variables

On your backend host (Render/Railway/Fly), set:

- `MONGODB_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = long random string (if you still use JWT anywhere)
- `PORT` = 5000 (or platform default)

For Firebase Admin:

**Option 1 (recommended):** store service account JSON as a single env var:

- `FIREBASE_SERVICE_ACCOUNT_JSON` = the full JSON contents

Example (Render environment variable value):
```json
{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"..."}
```

**Option 2:** store as a file on the host and point to it:

- `GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json`


### 5.3 Server changes you need (high-level)

To use Firebase Auth instead of the built-in email/password endpoints, update the backend to:

1. Initialize firebase-admin:
   - `admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })`
2. Create auth middleware that:
   - reads `Authorization: Bearer <FIREBASE_ID_TOKEN>`
   - `await admin.auth().verifyIdToken(token)`
   - finds/creates a MongoDB user record for that Firebase user
   - attaches it to `req.user`

Then you can protect routes the same way as JWT.

#### Minimal pattern

- Frontend sends Firebase ID token on every API request.
- Backend verifies token and maps it to MongoDB user.
- Data is stored per user exactly like today.

---

## 6) Frontend: Firebase sign-in flow (high-level)

### 6.1 Add Firebase Web SDK

Include Firebase scripts in `index.html` and initialize with your Firebase config.

### 6.2 Sign-in

- Email/password:
  - `firebase.auth().signInWithEmailAndPassword(email, password)`
- Google:
  - `firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider())`

### 6.3 Send token to backend

After login:

```js
const idToken = await firebase.auth().currentUser.getIdToken();
localStorage.setItem('wbcs_token', idToken);
```

In your API calls:

```js
headers: { Authorization: `Bearer ${idToken}` }
```

> IMPORTANT: If your backend currently expects **JWT tokens**, you must update it to verify Firebase tokens (Section 5).

---

## 7) Deploy Backend (Render example)

1. Create a new **Web Service** in Render from your GitHub repo
2. Build command:
   - `npm install`
3. Start command:
   - `npm start`
4. Add environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET` (if used)
   - `FIREBASE_SERVICE_ACCOUNT_JSON`
   - `NODE_ENV=production`

After deploy, your backend URL will look like:

- `https://your-app.onrender.com`
- API: `https://your-app.onrender.com/api`


### CORS note
If frontend is hosted on Firebase and backend elsewhere, ensure CORS allows your Firebase domain.

---

## 8) Deploy Frontend on Firebase Hosting

### 8.1 Install Firebase CLI

```bash
npm i -g firebase-tools
firebase login
```

### 8.2 Initialize Hosting

From project root:

```bash
firebase init hosting
```

Choose:
- Public directory: `.`
- Configure as SPA: **Yes** (rewrite all to `index.html`)

### 8.3 Deploy

```bash
firebase deploy
```

---

## 9) Point frontend to backend API (Soft-coded API)

If frontend and backend are on different domains:

Open your deployed site → DevTools Console → run:

```js
localStorage.setItem('wbcs_api_base', 'https://YOUR_BACKEND_DOMAIN/api');
location.reload();
```

Your frontend should now call the correct backend.

---

## 10) Production checklist

- [ ] Restrict MongoDB IP allowlist
- [ ] Keep Firebase service account secret safe
- [ ] Enable HTTPS (Firebase/Render provide)
- [ ] Add rate limiting + validation (recommended)
- [ ] Backups for MongoDB Atlas

---

## 11) Troubleshooting

### “Unexpected token … not valid JSON”
Usually means frontend is hitting the wrong `/api/*` endpoint (receiving HTML/404 text). Fix by setting `wbcs_api_base`.

### “Server connection failed”
Backend not deployed/running or blocked by CORS. Check backend logs and CORS config.

### Firebase login works but API returns 401
Backend is still verifying JWT, not Firebase ID tokens. Implement Firebase token verification in backend (Section 5).

---

## 12) Recommended final architecture (best practice)

- **Firebase Hosting**: static SPA
- **Firebase Auth**: identity
- **Render/Railway/Fly**: Node API + MongoDB
- **MongoDB Atlas**: database

Flow:
1. User logs in via Firebase
2. Frontend obtains Firebase ID token
3. Frontend calls Node API with `Authorization: Bearer <ID_TOKEN>`
4. Node verifies token via firebase-admin
5. Node reads/writes user’s progress to MongoDB

---

If you want, I can also update the actual code (`server.js` + `index.html`) to fully switch the app to Firebase Auth (no demo mode), while keeping all data persisted per-user in MongoDB.