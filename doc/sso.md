# Single Sign-On (SSO) Integration Guide

This guide explains how external SoftBridge applications can delegate user login to the SoftBridge Accounts system using the secure popup login flow.

## Overview

The SSO flow is designed to be simple and secure:
1. The client application opens the SoftBridge Accounts login page in a popup window:
   `https://accounts.softbridgelabs.in/login/popup?origin=<CLIENT_ORIGIN>`
2. The Accounts app validates the `origin` query parameter to ensure it is authorized.
3. The user authenticates (or is automatically detected if they are already logged in).
4. The Accounts app posts the authentication data back to the client application via `window.opener.postMessage`.
5. The popup window closes automatically.

---

## Domain Restrictions

To prevent unauthorized token extraction, only the following origins are permitted to initiate and receive authentication payloads:
- Hostnames ending with `.softbridgelabs.in` (e.g., `https://console.softbridgelabs.in`)
- Exactly `softbridgelabs.in`
- `localhost` with any port or protocol (e.g., `http://localhost:3000`)

---

## Client Integration Code Sample

Below is an example of how you can implement the login popup and message listener in your React or Vanilla JavaScript application:

```javascript
// 1. Define the Accounts URL
const ACCOUNTS_URL = "https://accounts.softbridgelabs.in"; // or local dev URL

// 2. Open the login popup
function triggerSoftBridgeLogin() {
  const currentOrigin = window.location.origin;
  const popupWidth = 450;
  const popupHeight = 600;
  const left = window.screen.width / 2 - popupWidth / 2;
  const top = window.screen.height / 2 - popupHeight / 2;

  const loginPopup = window.open(
    `${ACCOUNTS_URL}/login/popup?origin=${encodeURIComponent(currentOrigin)}`,
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

---

## Response Payload Structure

The `postMessage` data sent back from the Accounts app has the following JSON structure:

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
