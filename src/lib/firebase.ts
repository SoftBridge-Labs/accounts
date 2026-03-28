import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Safe Identity Initialization: Prevents build-failure during SSG/Netlify deployment
// where environment variables might be temporarily unavailable or placeholder strings.

// Helper to check for actual set environment variables (avoid literal "undefined" strings)
const isValidConfig = (config: typeof firebaseConfig) => {
  return (
    config.apiKey && 
    config.apiKey !== "undefined" && 
    config.apiKey !== "" &&
    config.authDomain && 
    config.authDomain !== "undefined"
  );
};

let app;
let auth: any;

try {
  if (isValidConfig(firebaseConfig)) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
  } else {
    // Return mock for Build Time / Server Side if keys are missing
    auth = {
      currentUser: null,
      onAuthStateChanged: () => () => {},
      signOut: async () => {},
    } as any;
  }
} catch (error) {
  console.warn("Identity Provider Initialization Node deferred:", error);
  auth = {
    currentUser: null,
    onAuthStateChanged: () => () => {},
    signOut: async () => {},
  } as any;
}

export { auth };
