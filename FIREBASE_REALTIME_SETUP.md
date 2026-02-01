# Firebase Realtime Database Setup Guide (WBCS 2026 Tracker)

This project is now configured to use **Firebase Realtime Database** for all data storage (no backend required).

## ✅ 1) Enable Realtime Database

1. Go to **Firebase Console** → Your Project.
2. In the left menu, open **Build → Realtime Database**.
3. Click **Create Database**.
4. Choose a region and start in **Test Mode** for quick setup.

> Later, change rules for production.

---

## ✅ 2) Update Security Rules

Go to **Realtime Database → Rules** and use:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

This ensures only authenticated users can read/write.

---

## ✅ 3) Confirm Firebase Config in `index.html`

Make sure your Firebase config matches your project:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## ✅ 4) Data Structure Used by the App

The app writes to the following Realtime DB paths:

```
/wbcsApp/shared
/wbcsUsers/{uid}
```

Example schema:

```json
{
  "wbcsApp": {
    "shared": {
      "subjects": [],
      "tasks": [],
      "tests": [],
      "routines": {}
    }
  },
  "wbcsUsers": {
    "UID123": {
      "email": "user@email.com",
      "name": "User",
      "userAppData": { ... },
      "userProgress": { ... }
    }
  }
}
```

---

## ✅ 5) Enable Email/Password Auth

Firebase Console → **Authentication → Sign-in method** → Enable **Email/Password**.

---

## ✅ 6) Run the App

Open `index.html` in your browser (or host it). The app will:

- Authenticate users with Firebase Auth
- Read/write schedules in **Realtime Database**
- Keep data consistent across devices

---

If you want:
- Admin roles
- More restricted rules
- Migration from Firestore

Ask and I’ll add them.
