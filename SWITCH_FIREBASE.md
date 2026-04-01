# 🚀 How to Deploy to a New Firebase Project

If you are switching to a completely new Firebase project, follow these **two steps** to update the web app and the deployment config.

---

### 📝 Step 1: Update the Web App (`index.html`)

You need to tell the web app to speak to your **new** Firebase Project. 

1. Go to your [Firebase Console](https://console.firebase.google.com/).
2. Select your **New Project**.
3. Click the **Project Settings (齿轮/Gear Icon)** -> **General**.
4. Scroll down to "Your Apps" and look for the **Firebase SDK Snippet** (Configuration).
5. Open `index.html` and replace the `firebaseConfig` block at the bottom of the file with your new code snippet:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_NEW_API_KEY",
    authDomain: "your-new-project.firebaseapp.com",
    databaseURL: "https://your-new-project-default-rtdb.firebaseio.com",
    projectId: "your-new-project",
    storageBucket: "your-new-project.firebasestorage.app",
    messagingSenderId: "your-new-sender-id",
    appId: "your-new-app-id"
};
```

---

### 📤 Step 2: Update the CLI Deployment (`.firebaserc`)

You need to tell the Firebase Command Line to push to the **new** project instead of the old one.

Run this command in your project folder to switch projects:

```bash
firebase use --add
```
*It will list all your Firebase projects. Select your **new** project and give it an alias (like `staging` or `default`).*

Alternatively, open the `.firebaserc` file in your root folder and manually change the project ID:
```json
{
  "projects": {
    "default": "your-new-project-id-here"
  }
}
```

---

### 🌐 Step 3: Enable Realtime Database in your New Project

Before the app works, your new project must have a Realtime Database running.

1. Go to **Realtime Database** in the left sidebar of your Firebase Console.
2. Click **Create Database** (Select a location near you).
3. Start in **Test Mode** or go to the **Rules** tab and set them to:
   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```

---

### 🚀 Step 4: Deploy

Once you've updated both the `index.html` and `.firebaserc`, run:

```bash
firebase deploy
```
