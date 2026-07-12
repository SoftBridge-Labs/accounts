# Single Sign-On (SSO) Integration Guide

This guide explains how external and third-party applications can delegate user login to the SoftBridge Accounts system using the secure popup login flow.

## Overview

The SSO flow is designed to be simple and secure:
1. Register your application in the **Developer Portal** (`https://account.softbridgelabs.in/developer`) to receive a unique `client_id`, `client_secret`, and register your `allowed_origins`.
2. The client application opens the SoftBridge Accounts login page in a popup window:
   `https://account.softbridgelabs.in/login/popup?client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&origin=<CLIENT_ORIGIN>`
3. The Accounts app validates the `client_id` and `client_secret` to ensure they are registered and authorized.
4. The user authenticates (or is automatically detected if they are already logged in).
5. The Accounts app posts the authentication data back to the client application via `window.opener.postMessage`.
6. The popup window closes automatically.

---

## Domain Restrictions

To prevent unauthorized token extraction, the initiating `origin` must match one of:
- The registered **Allowed Origins** for your application's `client_id` / `client_secret` in the Developer Portal.
- (Default fallback for internal apps) Hostnames ending with `.softbridgelabs.in` or `localhost`.

## Integration Guides

The SoftBridge Accounts SSO flow supports multiple platforms. Choose the guide for your target platform below.

### 1. Web Integration

For standard web applications (React, Vue, Vanilla JS), the recommended approach is to use a popup window and the `window.postMessage` API.

```javascript
// 1. Define the Accounts URL and your Client credentials
const ACCOUNTS_URL = "https://account.softbridgelabs.in"; // or local dev URL
const CLIENT_ID = "sb_your_client_id_here"; // Obtain from Developer Portal
const CLIENT_SECRET = "sbsec_your_client_secret_here"; // Obtain from Developer Portal

// 2. Open the login popup
function triggerSoftBridgeLogin() {
  const currentOrigin = window.location.origin;
  const popupWidth = 450;
  const popupHeight = 600;
  const left = window.screen.width / 2 - popupWidth / 2;
  const top = window.screen.height / 2 - popupHeight / 2;

  const loginPopup = window.open(
    `${ACCOUNTS_URL}/login/popup?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&origin=${encodeURIComponent(currentOrigin)}`,
    "SoftBridgeLoginPopup",
    `width=${popupWidth},height=${popupHeight},top=${top},left=${left},resizable=yes,scrollbars=yes`
  );

  if (!loginPopup) {
    alert("Please enable popups to sign in with your SoftBridge Account.");
    return;
  }

  // 3. Set up the message listener
  const messageListener = (event) => {
    // Crucial: Validate that the message is coming from the trusted Accounts origin
    if (event.origin !== ACCOUNTS_URL) return;

    const authData = event.data;
    if (authData && authData.success) {
      console.log("Authenticated User Profile:", authData.user);
      console.log("Firebase ID Token:", authData.idToken);

      // Log the user into your application (e.g., store token, set session)
      handleSuccessfulLogin(authData);

      // Clean up the event listener
      window.removeEventListener("message", messageListener);
    }
  };

  window.addEventListener("message", messageListener);
}

function handleSuccessfulLogin(authData) {
  // Your custom login persistence logic goes here
}
```

### 2. Desktop Integration

For Desktop applications (e.g., Electron, Tauri, Qt), the recommended approach is to use the `redirect_uri` query parameter combined with a local loopback server or custom URI scheme.

1. Register your app in the Developer Portal and add a **Redirect URI** (e.g., `http://127.0.0.1:8080/callback` or `myapp://oauth/callback`).
2. Open the system default browser to the SoftBridge login page:
   `https://account.softbridgelabs.in/login/popup?client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&redirect_uri=<YOUR_REDIRECT_URI>`
3. After successful login, the SoftBridge server will redirect the browser to your `redirect_uri`, appending the `idToken` and `user` data as query parameters.
4. Your application intercepts the redirect, extracts the tokens from the URL parameters, and completes the login process.

### 3. Android Integration

For native Android applications, use a custom URI scheme combined with Android App Links or Custom Tabs.

1. Register your app in the Developer Portal and add your custom **Redirect URI** (e.g., `in.softbridgelabs.forms://oauth/callback`).
2. In your Android app, configure an `IntentFilter` in your `AndroidManifest.xml` to intercept the custom scheme:
   ```xml
   <intent-filter>
       <action android:name="android.intent.action.VIEW" />
       <category android:name="android.intent.category.DEFAULT" />
       <category android:name="android.intent.category.BROWSABLE" />
       <data android:scheme="in.softbridgelabs.forms" android:host="oauth" android:path="/callback" />
   </intent-filter>
   ```
3. Launch the login flow using `CustomTabsIntent` or standard `Intent(Intent.ACTION_VIEW)`:
   ```kotlin
   val url = "https://account.softbridgelabs.in/login/popup?client_id=<CLIENT_ID>&client_secret=<CLIENT_SECRET>&redirect_uri=in.softbridgelabs.forms://oauth/callback"
   val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
   startActivity(intent)
   ```
4. When the user completes the login, the browser will automatically redirect to `in.softbridgelabs.forms://oauth/callback?idToken=TOKEN&user=JSON`. 
5. Your target Activity will receive this Intent. Extract the `idToken` and `user` values from the `intent.data` URI query parameters.

---

## Response Payload Structure

The authentication data returned by SoftBridge Accounts (whether via `postMessage.data` on Web, or query parameters in Desktop/Android) will have the following structure:

```json
{
  "success": true,
  "user": {
    "uid": "user-firebase-uid",
    "email": "user@softbridgelabs.in",
    "name": "John Doe",
    "premium": true
  },
  "idToken": "firebase-id-token-string"
}
```

- **`success`**: `true` indicates successful login.
- **`user.uid`**: The unique identifier of the user in the Firebase authentication system.
- **`user.email`**: The verified email address.
- **`user.name`**: The user's name or display name.
- **`user.premium`**: Boolean indicating if the user has an active premium subscription.
- **`idToken`**: A cryptographically signed Firebase ID token. You can verify this token on your backend server using the Firebase Admin SDK to securely verify the user's identity.
