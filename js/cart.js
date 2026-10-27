import { db } from "./firebase.js";
import { doc, getDoc, setDoc, serverTimestamp } from "./vendor.js";

const KEY = "arvela:cart";
const MAX_QTY = 20;

let items = read();
let uid = null;
let syncTimer = 0;

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export const getItems = () => items.map((item) => ({ ...item }));
export const count = () => items.reduce((sum, item) => sum + item.qty, 0);
export const subtotal = () =>
  items.reduce((sum, item) => sum + item.price * item.qty, 0);

function updateBadge() {
  const n = count();
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = n > 99 ? "99+" : String(n);
    el.hidden = n === 0;
  });
  document.querySelectorAll(".icon-btn[href='cart.html']").forEach((link) => {
    link.setAttribute(
      "aria-label",
      n ? `Cart, ${n} item${n === 1 ? "" : "s"}` : "Cart",
    );
  });
}

function emit() {
  updateBadge();
  document.dispatchEvent(
    new CustomEvent("cart:change", {
      detail: { items: getItems(), count: count(), subtotal: subtotal() },
    }),
  );
}

function syncRemote() {
  if (!uid) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    setDoc(doc(db, "carts", uid), {
      items,
      updatedAt: serverTimestamp(),
    }).catch(() => {});
  }, 600);
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable */
  }
  syncRemote();
  emit();
}

const clampQty = (qty) =>
  Math.max(1, Math.min(MAX_QTY, Math.floor(Number(qty) || 1)));

export function addItem({ id, slug, name, price, image }, qty = 1) {
  const existing = items.find((item) => item.id === id);
  if (existing) existing.qty = clampQty(existing.qty + qty);
  else
    items.push({
      id,
      slug,
      name,
      price: Number(price),
      image,
      qty: clampQty(qty),
    });
  persist();
}

export function setQty(id, qty) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;
  if (qty < 1) return removeItem(id);
  item.qty = clampQty(qty);
  persist();
}

export function removeItem(id) {
  items = items.filter((item) => item.id !== id);
  persist();
}

export function clear() {
  items = [];
  persist();
}

// Refresh prices and names from the live catalog.
// Items that no longer exist, or are sold out, are removed. Returns their names.
export function syncCatalog(products) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  const removed = [];
  let changed = false;

  items = items.filter((item) => {
    const live = bySlug.get(item.slug);
    if (!live || live.inStock === false) {
      removed.push(item.name);
      changed = true;
      return false;
    }
    if (
      live.price !== item.price ||
      live.name !== item.name ||
      live.image !== item.image
    ) {
      item.price = live.price;
      item.name = live.name;
      item.image = live.image;
      changed = true;
    }
    return true;
  });

  if (changed) persist();
  return removed;
}

export function init() {
  updateBadge();
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY) return;
    items = read();
    emit();
  });
}

// Called whenever the signed-in user changes
export async function setUser(user) {
  if (!user) {
    if (uid) {
      uid = null;
      items = [];
      persist();
    } // don't leave a cart on a shared device
    return;
  }

  uid = user.uid;
  try {
    const snap = await getDoc(doc(db, "carts", uid));
    const remote = snap.exists() ? snap.data().items || [] : [];
    const merged = new Map(remote.map((item) => [item.id, item]));
    items.forEach((item) => {
      const other = merged.get(item.id);
      merged.set(
        item.id,
        other ? { ...item, qty: Math.max(item.qty, other.qty) } : item,
      );
    });
    items = [...merged.values()];
  } catch {
    /* keep the local cart if the read fails */
  }
  persist();
}
