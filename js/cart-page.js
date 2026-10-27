import * as cart from "./cart.js";
import { getProductsBySlugs, formatPrice } from "./api.js";
import { esc } from "./ui.js";

const layout = document.querySelector("[data-cart-layout]");
const linesEl = document.querySelector("[data-cart-lines]");
const emptyEl = document.querySelector("[data-cart-empty]");
const subtotalEl = document.querySelector("[data-cart-subtotal]");
const countEl = document.querySelector("[data-cart-count-label]");
const noticeEl = document.querySelector("[data-cart-notice]");
const announceEl = document.querySelector("[data-cart-announce]");
const titleEl = document.querySelector("[data-cart-title]");

let firstRender = true;
let pendingFocus = null; // where keyboard focus should land after the next render

const MAX_QTY = 20;
const MINUS = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>`;
const PLUS = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;

function lineHtml(item, index) {
  const href = `product.html?slug=${encodeURIComponent(item.slug)}`;
  const name = esc(item.name);
  const id = esc(item.id);

  return `
    <li class="cart-line${firstRender ? " cart-line--enter" : ""}" data-line="${id}" style="--i:${index}">
      <a class="cart-line__media" href="${href}" tabindex="-1" aria-hidden="true">
        <img src="${esc(item.image)}" alt="" width="112" height="112">
      </a>
      <div class="cart-line__body">
        <h3 class="cart-line__name"><a href="${href}">${name}</a></h3>
        <p class="cart-line__unit">${formatPrice(item.price)} each</p>
        <button class="cart-line__remove" type="button" data-remove="${id}" aria-label="Remove ${name} from cart">Remove</button>
      </div>
      <div class="qty">
        <button class="qty__btn" type="button" data-dec="${id}" aria-label="Decrease quantity of ${name}"${item.qty <= 1 ? " disabled" : ""}>${MINUS}</button>
        <input class="qty__input" type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="${item.qty}" data-qty="${id}" aria-label="Quantity of ${name}">
        <button class="qty__btn" type="button" data-inc="${id}" aria-label="Increase quantity of ${name}"${item.qty >= MAX_QTY ? " disabled" : ""}>${PLUS}</button>
      </div>
      <data class="cart-line__total" value="${item.price * item.qty}">${formatPrice(item.price * item.qty)}</data>
    </li>`;
}

function restoreFocus() {
  if (!pendingFocus) return;
  const { id, selector, fallbackIndex } = pendingFocus;
  pendingFocus = null;

  let target = id
    ? linesEl.querySelector(`[data-line="${CSS.escape(id)}"] ${selector}`)
    : null;

  if (!target && fallbackIndex !== undefined) {
    const removeButtons = linesEl.querySelectorAll("[data-remove]");
    target =
      removeButtons[Math.min(fallbackIndex, removeButtons.length - 1)] || null;
  }
  (target || titleEl).focus({ preventScroll: true });
}

function render() {
  const items = cart.getItems();
  const empty = items.length === 0;
  const total = cart.count();

  layout.hidden = empty;
  emptyEl.hidden = !empty;
  countEl.textContent = empty
    ? ""
    : `${total} ${total === 1 ? "item" : "items"}`;
  subtotalEl.textContent = formatPrice(cart.subtotal());
  linesEl.innerHTML = items.map(lineHtml).join("");

  firstRender = false;
  restoreFocus();
}

/* ----- Interaction (one delegated listener per event type) ----- */
const findItem = (id) => cart.getItems().find((item) => item.id === id);

linesEl.addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  const remove = e.target.closest("[data-remove]");

  if (inc || dec) {
    const id = (inc || dec).dataset.inc || (inc || dec).dataset.dec;
    const item = findItem(id);
    if (!item) return;
    const qty = item.qty + (inc ? 1 : -1);
    pendingFocus = { id, selector: inc ? "[data-inc]" : "[data-dec]" };
    cart.setQty(id, qty);
    announceEl.textContent = `Quantity of ${item.name} is now ${Math.min(MAX_QTY, Math.max(1, qty))}`;
  }

  if (remove) {
    const id = remove.dataset.remove;
    const item = findItem(id);
    if (!item) return;
    const index = cart.getItems().findIndex((entry) => entry.id === id);
    pendingFocus = { fallbackIndex: index };
    cart.removeItem(id);
    announceEl.textContent = `${item.name} removed from your cart`;
  }
});

linesEl.addEventListener("change", (e) => {
  const input = e.target.closest("[data-qty]");
  if (!input) return;
  const id = input.dataset.qty;
  const item = findItem(id);
  if (!item) return;

  const qty = Math.min(
    MAX_QTY,
    Math.max(1, Math.floor(Number(input.value) || 1)),
  );
  pendingFocus = { id, selector: "[data-qty]" };
  cart.setQty(id, qty);
  announceEl.textContent = `Quantity of ${item.name} is now ${qty}`;
});

document.addEventListener("cart:change", render);

/* ----- Check items against the live catalog ----- */
async function syncWithCatalog() {
  const items = cart.getItems();
  if (!items.length) return;

  try {
    const slugs = [...new Set(items.map((item) => item.slug))];
    const chunks = [];
    for (let i = 0; i < slugs.length; i += 30)
      chunks.push(slugs.slice(i, i + 30)); // Firestore "in" limit

    const products = (await Promise.all(chunks.map(getProductsBySlugs))).flat();
    const removed = cart.syncCatalog(products);

    if (removed.length) {
      noticeEl.textContent = `${removed.join(", ")} ${removed.length === 1 ? "is" : "are"} no longer available and ${removed.length === 1 ? "was" : "were"} removed from your cart.`;
      noticeEl.hidden = false;
    }
  } catch {
    noticeEl.textContent =
      "We couldn't confirm current prices. They'll be checked again at checkout.";
    noticeEl.hidden = false;
  }
}

render();
syncWithCatalog();
