# 🔥 Firebase Setup Guide for WBCS Tracker

## Complete Step-by-Step Instructions

### ✅ Prerequisites
- Google Account (Gmail)
- 10-15 minutes of time
- Your `index.html` file ready

---

## 📋 Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Click **"Add project"** or **"Create a project"**

2. **Project Setup**
   - **Project name**: Enter `WBCS-Tracker` (or any name you prefer)
   - Click **Continue**
   - **Google Analytics**: Toggle OFF (not needed for this project)
   - Click **Create project**
   - Wait 30 seconds for project creation
   - Click **Continue**

---

## 📋 Step 2: Register Your Web App

1. **Add Web App**
   - On the project dashboard, click the **Web icon** `</>`
   - App nickname: Enter `WBCS Web App`
   - ❌ **DO NOT** check "Firebase Hosting" (we're using GitHub Pages)
   - Click **Register app**

2. **Copy Firebase Configuration**
   - You'll see a code block like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
     authDomain: "wbcs-tracker-xxxxx.firebaseapp.com",
     projectId: "wbcs-tracker-xxxxx",
     storageBucket: "wbcs-tracker-xxxxx.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdefghijklmnop"
   };
   ```
   - **COPY THIS ENTIRE CONFIG** (you'll need it soon)
   - Click **Continue to console**

---

## 📋 Step 3: Enable Authentication

1. **Navigate to Authentication**
   - In the left sidebar, click **"Build"** → **"Authentication"**
   - Click **"Get started"**

2. **Enable Email/Password Sign-in**
   - Click on **"Sign-in method"** tab
   - Click on **"Email/Password"** row
   - Toggle **Enable** to ON
   - Click **Save**

3. **Verify**
   - You should see "Email/Password" with status: **Enabled**

---

## 📋 Step 4: Enable Firestore Database

1. **Navigate to Firestore**
   - In the left sidebar, click **"Build"** → **"Firestore Database"**
   - Click **"Create database"**

2. **Security Rules**
   - Select **"Start in production mode"** (we'll set custom rules)
   - Click **Next**

3. **Location**
   - Choose closest region to you:
     - **India**: Select `asia-south1 (Mumbai)`
     - **US**: Select `us-central1 (Iowa)`
   - Click **Enable**
   - Wait 1-2 minutes for database creation

4. **Set Security Rules**
   - Click on **"Rules"** tab
   - Replace ALL existing rules with this:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
   - Click **Publish**
   - This ensures users can only access their own data

---

## 📋 Step 5: Update Your HTML File

1. **Open `index.html`** in your text editor

2. **Find the Firebase Config Section** (around line 1085)
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY_HERE",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

3. **Replace with YOUR config** from Step 2
   - Copy your actual values from Firebase Console
   - Replace each `YOUR_XXX_HERE` with actual values
   - **Keep the quotes!**

4. **Example (with fake values):**
   ```javascript
   const firebaseConfig = {
       apiKey: "AIzaSyDxVq123abcXYZ789-mockApiKey12345",
       authDomain: "wbcs-tracker-12ab.firebaseapp.com",
       projectId: "wbcs-tracker-12ab",
       storageBucket: "wbcs-tracker-12ab.appspot.com",
       messagingSenderId: "987654321098",
       appId: "1:987654321098:web:abc123def456ghi789"
   };
   ```

5. **Save the file**

---

## 📋 Step 6: Deploy to GitHub Pages

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Repository name: `wbcs-tracker`
   - Public or Private: Your choice
   - Click **Create repository**

2. **Upload Files**
   - Click **"uploading an existing file"**
   - Drag and drop your `index.html`
   - Commit message: `Initial commit`
   - Click **Commit changes**

3. **Enable GitHub Pages**
   - Go to repository **Settings**
   - Scroll to **Pages** (left sidebar)
   - Source: Select **main** branch
   - Folder: **/ (root)**
   - Click **Save**
   - Wait 1-2 minutes

4. **Get Your URL**
   - You'll see: "Your site is published at `https://username.github.io/wbcs-tracker/`"
   - **Copy this URL**

---

## 📋 Step 7: Add Authorized Domain in Firebase

1. **Go to Firebase Console** → Your Project

2. **Navigate to Authentication**
   - Click **"Build"** → **"Authentication"**
   - Click **"Settings"** tab
   - Scroll to **"Authorized domains"**

3. **Add GitHub Pages Domain**
   - Click **"Add domain"**
   - Enter: `username.github.io` (replace `username` with YOUR GitHub username)
   - Click **Add**

4. **Verify**
   - You should see your domain in the list

---

## 🎉 Step 8: Test Your App

1. **Open Your GitHub Pages URL**
   - Example: `https://yourusername.github.io/wbcs-tracker/`

2. **You Should See**
   - Beautiful loading screen
   - Then: "Create New Account" or "Login" buttons

3. **Create Test Account**
   - Click **"Create New Account"**
   - Email: `your.email@gmail.com`
   - Password: `test1234`
   - Confirm password
   - Click **Create Account**

4. **Success!**
   - ✅ Account created
   - ✅ App loads with your email shown
   - ✅ Start using the tracker!

---

## 🧪 Test Password Recovery

1. **Logout** (click 🔒 Logout button)

2. **Click "Login to Existing Account"**

3. **Enter your email** (don't enter password yet)

4. **Click "Forgot Password?"**

5. **Click "Send password reset email"**

6. **Check your email inbox**
   - You should receive email from Firebase
   - Click the reset link
   - Enter new password
   - Done!

---

## 📊 Firebase Free Tier Limits

### ✅ What You Get FREE Forever:

| Service | Free Limit | Your Usage (Estimate) |
|---------|-----------|----------------------|
| **Authentication** | Unlimited users | 1 user (you) ✅ |
| **Firestore Reads** | 50,000/day | ~100/day ✅ |
| **Firestore Writes** | 20,000/day | ~50/day ✅ |
| **Storage** | 1 GB | ~1 MB ✅ |
| **Email Sends** | Unlimited | ~5/month ✅ |

**Verdict**: You'll use less than 1% of free limits! 🎉

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use a strong password (8+ characters, mix of letters/numbers)
- ✅ Use a real email address (for password recovery)
- ✅ Export JSON backups regularly
- ✅ Keep your Firebase config in the code (it's safe - it's meant to be public)
- ✅ Use different passwords for different accounts

### ❌ DON'T:
- ❌ Share your password with anyone
- ❌ Delete your Firebase project (you'll lose all data)
- ❌ Modify Firestore security rules (they're secure as-is)
- ❌ Use "password123" or similar weak passwords

---

## 🛠️ Troubleshooting

### Problem: "Firebase not configured" alert

**Solution**:
1. Make sure you replaced ALL placeholders in firebaseConfig
2. Check for typos in config values
3. Ensure quotes are present: `apiKey: "value"` not `apiKey: value`

---

### Problem: "Permission denied" when loading data

**Solution**:
1. Check Firestore Rules are set correctly (Step 4.4)
2. Make sure you're logged in
3. Try logout and login again

---

### Problem: Password reset email not received

**Solution**:
1. Check spam/junk folder
2. Wait 5 minutes (sometimes delayed)
3. Verify email address is correct
4. Check Firebase Console → Authentication → Users (your email should be listed)

---

### Problem: GitHub Pages not working

**Solution**:
1. Wait 5 minutes after enabling (it takes time)
2. Clear browser cache and try again
3. Check repository is Public (not Private)
4. Verify file is named exactly `index.html` (lowercase)

---

## 📞 Need Help?

### Firebase Documentation:
- Authentication: https://firebase.google.com/docs/auth/web/start
- Firestore: https://firebase.google.com/docs/firestore/quickstart

### GitHub Pages:
- Guide: https://docs.github.com/en/pages

---

## ✅ Final Checklist

Before going live, verify:

- [ ] Firebase project created
- [ ] Web app registered
- [ ] Firebase config added to index.html
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Firestore rules set correctly
- [ ] GitHub repository created
- [ ] index.html uploaded
- [ ] GitHub Pages enabled
- [ ] GitHub domain added to Firebase authorized domains
- [ ] Test account created successfully
- [ ] Password reset tested
- [ ] Data saving/loading works
- [ ] Logout/Login works

---

## 🎯 Summary

You now have:
- ✅ **Secure authentication** with email/password
- ✅ **Password recovery** via email
- ✅ **Cloud backup** of all your progress
- ✅ **Access from anywhere** (any device with internet)
- ✅ **100% FREE** forever
- ✅ **Professional-grade** security

**Congratulations! Your WBCS Tracker is now live with Firebase! 🎉🔥**

---

**Last Updated**: 2024
**Firebase Version**: 10.7.1
**Status**: Production Ready ✅
