import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  doc,
  setDoc,
  serverTimestamp,
} from "./vendor.js";

function markHeader(user) {
  document.body.dataset.auth = user ? "in" : "out";
  const avatar = document.querySelector(".avatar");
  if (!avatar) return;
  avatar.href = user ? "account.html" : "login.html";
  avatar.setAttribute("aria-label", user ? "Your account" : "Sign in");
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, (user) => {
    markHeader(user);
    callback?.(user);
  });
}

export async function signUp({ name, email, password }) {
  const { user } = await createUserWithEmailAndPassword(
    auth,
    email.trim(),
    password,
  );
  await updateProfile(user, { displayName: name.trim() });
  await setDoc(doc(db, "users", user.uid), {
    name: name.trim(),
    email: user.email,
    createdAt: serverTimestamp(),
  });
  return user;
}

export const signIn = ({ email, password }) =>
  signInWithEmailAndPassword(auth, email.trim(), password).then(
    ({ user }) => user,
  );

export async function signInWithGoogle() {
  const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
  await setDoc(
    doc(db, "users", user.uid),
    {
      name: user.displayName || "",
      email: user.email,
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
  return user;
}

export const logOut = () => signOut(auth);
export const resetPassword = (email) =>
  sendPasswordResetEmail(auth, email.trim());

export function friendlyAuthError(error) {
  const messages = {
    "auth/invalid-credential": "That email and password don't match.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/email-already-in-use": "An account with that email already exists.",
    "auth/weak-password": "Use at least 6 characters for your password.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user": "Sign-in was cancelled.",
    "auth/network-request-failed":
      "Network problem. Check your connection and try again.",
  };
  return messages[error?.code] || "Something went wrong. Please try again.";
}
