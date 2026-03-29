# SoftBridge Accounts

Unified account portal for SoftBridge Labs, built with Next.js App Router, React 19, and Firebase Auth.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file with the required public values:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.softbridgelabs.in
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

## API Reference

Base URL: `https://api.softbridgelabs.in`

### 1. Register User

Endpoint: `POST /softbridge/register`

Body:

```json
{
	"email": "user@example.com",
	"password": "strong-password",
	"name": "John Doe"
}
```

### 2. Login User

Endpoint: `POST /softbridge/login`

Body:

```json
{
	"email": "user@example.com",
	"password": "strong-password"
}
```

### 3. Forgot Password

Triggers a password reset email via Firebase.

Endpoint: `POST /softbridge/forgot-password`

Body:

```json
{
	"email": "user@example.com"
}
```

### 4. Security Alerts (Email)

Send custom security alerts to users using the Resend service.

Endpoint: `POST /softbridge/alert-email`

Body:

```json
{
	"email": "user@example.com",
	"type": "login",
	"details": "New login from Chrome on Windows"
}
```

Supported types: `login`, `password_change`, `premium_activated`.

### 5. Premium Membership Activation

Activates premium status for a user for a specific duration.

Endpoint: `POST /softbridge/premium/activate`

Body:

```json
{
	"uid": "firebase_uid",
	"durationDays": 30
}
```

### 6. Public Profile

Fetch restricted profile details for any user.

Endpoint: `GET /softbridge/profile/:uid`

### 7. Account Management (Full)

Initializes or performs a full update of the SoftBridge account.

Endpoint: `POST /softbridge/account`

Body:

```json
{
	"uid": "firebase_uid",
	"name": "John Doe",
	"email": "john@example.com",
	"phone": "+1234567890",
	"avatar_url": "https://...",
	"birthday": "1990-01-01",
	"gender": "Male",
	"bio": "Developer at SoftBridge Labs"
}
```

### 8. Partial Profile Update

Updates specific fields without affecting others.

Endpoint: `PATCH /softbridge/account`

Body:

```json
{
	"uid": "firebase_uid",
	"bio": "Updated bio text"
}
```

### 9. Get Account Status and Help

Fetches the profile info, premium status, and optional setup guidance.

Endpoint: `GET /softbridge/account`

Query parameters:

- `uid` (required): User unique ID.
- `setupHelp` (optional): Set to `true` to receive onboarding steps.

### 10. Security and Activity

Review recent actions performed on your account.

Endpoint: `GET /softbridge/activity`

Query parameter: `uid`

### 11. Auth Redirect Utility

A helper route that redirects any hit to the unified account dashboard.

Endpoint: `GET /softbridge/auth-redirect`

Redirects to: `https://account.softbridgelabs.in`

### 12. Data and Privacy (Delete Account)

Permanently removes account data from SQL systems.

Endpoint: `DELETE /softbridge/account`

Body:

```json
{
	"uid": "firebase_uid"
}
```

## Scripts

- `npm run dev` - start local development server
- `npm run build` - build for production
- `npm run start` - run production server
- `npm run lint` - run ESLint
