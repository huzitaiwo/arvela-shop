export { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";

export {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  writeBatch,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  initializeFirestore,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

export {
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
