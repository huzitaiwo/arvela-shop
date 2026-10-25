import { initializeApp, getFirestore, getAuth } from "./vendor.js";

const firebaseConfig = {
  apiKey: "AIzaSyApBud5tWiFnX7d5Gfen751no-f-0LT1eM",
  authDomain: "arvela-store.firebaseapp.com",
  projectId: "arvela-store",
  storageBucket: "arvela-store.firebasestorage.app",
  messagingSenderId: "884498774884",
  appId: "1:884498774884:web:0156f249bdaa5526abd871",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
