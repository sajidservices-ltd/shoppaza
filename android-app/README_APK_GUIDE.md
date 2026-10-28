# Shoppaza Official Android APK & App Package Guide
**Entity**: SAJID SERVICES LTD (Companies House SC874640)  
**Domain**: https://shoppaza.com  

---

### Method 1: Instant Direct Install (Zero Setup • Works on any Android Phone)
Shoppaza is configured as a high-performance **Progressive Web App (PWA)** with a Service Worker, manifest, and icons:
1. Open **https://shoppaza.com** on your Android smartphone using Google Chrome or Samsung Internet.
2. A banner will appear at the bottom: **"Shoppaza App - Install for Android & Mobile"** (or click the 3 dots in Chrome > **"Install app"**).
3. Tap **Install**.
4. Android will automatically compile and place the native **Shoppaza APK icon** on your home screen and app drawer. It launches full-screen with fast offline caching!

---

### Method 2: Download Standalone .APK / .AAB File (Google PWABuilder • 1 Minute)
To download a standalone `.apk` installer file for distribution or Google Play Store:
1. Open **[https://www.pwabuilder.com](https://www.pwabuilder.com)** in your browser.
2. Enter the store URL: `https://shoppaza.com` and click **Start**.
3. PWABuilder will scan `manifest.json` and score the app 100/100 (PWA Ready).
4. Click **"Package for Android"**.
5. Click **"Generate Package / Download APK"**.
6. You will receive the compiled standalone `shoppaza.apk` ready to install directly on any phone or upload to Google Play!

---

### Method 3: Android Studio Local Build (Developer Source Code)
The complete Android project is included in this folder:
1. Open **Android Studio**.
2. Click **Open** and select the folder: `G:\My Drive\no open\shoppoza\android-app`.
3. Let Gradle sync dependencies.
4. From the top menu, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Android Studio will generate the signed/debug `.apk` file in `app/build/outputs/apk/`.
