import { watchAuth, logOut } from "./auth.js";
import { getMyOrders, formatPrice } from "./api.js";
import { esc } from "./ui.js";

const loadingEl = document.querySelector("[data-account-loading]");
const accountEl = document.querySelector("[data-account]");
const greetingEl = document.querySelector("[data-greeting]");
const emailEl = document.querySelector("[data-email]");
const signOutBtn = document.querySelector("[data-signout]");
const ordersEl = document.querySelector("[data-orders]");
const ordersLoading = document.querySelector("[data-orders-loading]");
const emptyEl = document.querySelector("[data-orders-empty]");
const errorEl = document.querySelector("[data-orders-error]");
const retryBtn = document.querySelector("[data-orders-retry]");

const STATUS = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

let currentUid = null;
let signingOut = false;

const firstName = (user) =>
  (user.displayName || user.email.split("@")[0]).trim().split(/\s+/)[0];

function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  return date
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date)
    : "Just now";
}

function orderHtml(order, index) {
  const lines = (order.lines || [])
    .map(
      (line) => `
      <li>
        <span>${esc(line.name)} × ${Number(line.qty)}</span>
        <data value="${line.price * line.qty}">${formatPrice(line.price * line.qty)}</data>
      </li>`,
    )
    .join("");

  const status = STATUS[order.status] ? order.status : "pending";

  return `
    <li class="order" style="--i:${index}">
      <header class="order__head">
        <div>
          <h3 class="order__id">Order #${esc(order.id.slice(0, 8).toUpperCase())}</h3>
          <p class="order__date">${formatDate(order.createdAt)}</p>
        </div>
        <span class="order__status" data-status="${status}">${STATUS[status]}</span>
      </header>
      <ul class="order__lines">${lines}</ul>
      <p class="order__total"><span>Total</span><data value="${Number(order.subtotal)}">${formatPrice(order.subtotal)}</data></p>
    </li>`;
}

async function loadOrders() {
  ordersLoading.hidden = false;
  emptyEl.hidden = true;
  errorEl.hidden = true;
  ordersEl.replaceChildren();

  try {
    const orders = await getMyOrders(currentUid);
    ordersLoading.hidden = true;
    if (!orders.length) {
      emptyEl.hidden = false;
      return;
    }
    ordersEl.innerHTML = orders.map(orderHtml).join("");
  } catch {
    ordersLoading.hidden = true;
    errorEl.hidden = false;
  }
}

watchAuth((user) => {
  if (!user) {
    if (!signingOut) location.replace("login.html?next=account.html");
    return;
  }
  if (currentUid === user.uid) return;

  currentUid = user.uid;
  greetingEl.textContent = `Hello, ${firstName(user)}`;
  emailEl.textContent = user.email;
  loadingEl.hidden = true;
  accountEl.hidden = false;
  loadOrders();
});

retryBtn.addEventListener("click", loadOrders);

signOutBtn.addEventListener("click", async () => {
  signingOut = true;
  signOutBtn.disabled = true;
  try {
    await logOut();
    location.href = "index.html";
  } catch {
    signingOut = false;
    signOutBtn.disabled = false;
  }
});
