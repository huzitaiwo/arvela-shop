import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "./vendor.js";

const productsCol = collection(db, "products");

export const formatPrice = (value) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

const withId = (snap) => ({ id: snap.id, ...snap.data() });

/* ----- Products ----- */
// sort: "newest" | "price-asc" | "price-desc"
export async function getProducts({
  category,
  featured,
  sort = "newest",
  max = 24,
} = {}) {
  const order = {
    newest: ["createdAt", "desc"],
    "price-asc": ["price", "asc"],
    "price-desc": ["price", "desc"],
  }[sort] || ["createdAt", "desc"];

  const constraints = [];
  if (category) constraints.push(where("category", "==", category));
  if (featured) constraints.push(where("featured", "==", true));
  constraints.push(orderBy(...order), limit(max));

  const snap = await getDocs(query(productsCol, ...constraints));
  return snap.docs.map(withId);
}

export async function getProduct(slug) {
  const snap = await getDocs(
    query(productsCol, where("slug", "==", slug), limit(1)),
  );
  return snap.empty ? null : withId(snap.docs[0]);
}

export async function getProductsBySlugs(slugs) {
  if (!slugs.length) return [];
  const snap = await getDocs(
    query(productsCol, where("slug", "in", slugs.slice(0, 30))),
  );
  return snap.docs.map(withId);
}

/* ----- Newsletter ----- */
// Returns "ok" or "exists". The email is the document id, so duplicates are impossible.
export async function subscribeNewsletter(email, source = "footer") {
  const clean = email.trim().toLowerCase();
  try {
    await setDoc(doc(db, "subscribers", clean), {
      email: clean,
      source,
      createdAt: serverTimestamp(),
    });
    return "ok";
  } catch (error) {
    // Re-subscribing is an update, which the rules deny
    if (error.code === "permission-denied") return "exists";
    throw error;
  }
}

/* ----- Contact form ----- */
export async function sendMessage({ name, email, message }) {
  await addDoc(collection(db, "messages"), {
    name: name.trim(),
    email: email.trim().toLowerCase(),
    message: message.trim(),
    createdAt: serverTimestamp(),
  });
}

/* ----- Orders ----- */
export async function placeOrder({ uid, items, customer, note = "" }) {
  const lines = items.map(({ id, slug, name, price, qty }) => ({
    id,
    slug,
    name,
    price,
    qty,
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const ref = await addDoc(collection(db, "orders"), {
    uid,
    lines,
    subtotal,
    customer,
    note,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
