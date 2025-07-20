// lib/firebaseClient.ts (or utils/firebaseClient.ts)
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOm09FH8jTkhT_x-hHZAPLv9MtUNt7cB4",
  authDomain: "iris-76997.firebaseapp.com",
  projectId: "iris-76997",
  storageBucket: "iris-76997.appspot.com", // <-- FIXED: should be .appspot.com
  messagingSenderId: "759986177143",
  appId: "1:759986177143:web:9c855c4b3430b4c421b272",
  measurementId: "G-F3DBWKVLC4"
};

// Initialize Firebase (prevent re-initialization in Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Export auth and storage for use in your app
export const auth = getAuth(app);
export const storage = getStorage(app);