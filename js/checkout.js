import * as cart from "./cart.js";
import { watchAuth } from "./auth.js";
import { getProductsBySlugs, placeOrder, formatPrice } from "./api.js";
import { esc } from "./ui.js";
import { showAlert, hideAlert, clearErrors, validateForm } from "./forms.js";

const views = [...document.querySelectorAll("[data-view]")];
const form = document.getElementById("checkout-form");
const statusEl = document.querySelector("[data-status]");
const linesEl = document.querySelector("[data-lines]");
const subtotalEl = document.querySelector("[data-subtotal]");
const placeBtn = document.querySelector("[data-place]");

let user = null;
let placed = false;
let busy = false;

const show = (name) =>
  views.forEach((el) => (el.hidden = el.dataset.view !== name));

/* ----- Summary ----- */
function lineHtml(item) {
  return `
    <li class="summary__line">
      <img src="${esc(item.image)}" alt="" width="56" height="56">
      <div>
        <p class="summary__name">${esc(item.name)}</p>
        <p class="summary__meta">Qty ${item.qty}</p>
      </div>
      <data value="${item.price * item.qty}">${formatPrice(item.price * item.qty)}</data>
    </li>`;
}

function render() {
  if (placed) return;
  const items = cart.getItems();

  if (!user) return show("loading");
  if (!items.length) return show("empty");

  show("form");
  linesEl.innerHTML = items.map(lineHtml).join("");
  subtotalEl.textContent = formatPrice(cart.subtotal());
  if (!busy)
    placeBtn.textContent = `Place order · ${formatPrice(cart.subtotal())}`;
}

function prefill() {
  if (!form.elements.name.value)
    form.elements.name.value = user.displayName || "";
  if (!form.elements.email.value) form.elements.email.value = user.email || "";
}

function setBusy(value) {
  busy = value;
  placeBtn.disabled = value;
  placeBtn.textContent = value
    ? "Placing order…"
    : `Place order · ${formatPrice(cart.subtotal())}`;
}

/* ----- Confirmation ----- */
function showDone(orderId, customer) {
  const title = document.querySelector("[data-done-title]");
  title.textContent = `Thank you, ${customer.name.split(/\s+/)[0]}`;
  document.querySelector("[data-done-order]").textContent =
    `Order #${orderId.slice(0, 8).toUpperCase()}`;
  document.querySelector("[data-done-text]").textContent =
    `We've received your order and will email ${customer.email} to confirm delivery and payment details.`;
  document.title = "Order placed | Arvela";
  show("done");
  title.focus();
  window.scrollTo({ top: 0 });
}

/* ----- Submit ----- */
async function checkPrices(items) {
  const slugs = [...new Set(items.map((item) => item.slug))];
  const chunks = [];
  for (let i = 0; i < slugs.length; i += 30)
    chunks.push(slugs.slice(i, i + 30)); // Firestore "in" limit
  const live = (await Promise.all(chunks.map(getProductsBySlugs))).flat();
  const bySlug = new Map(live.map((product) => [product.slug, product]));

  const changed = items.some((item) => {
    const product = bySlug.get(item.slug);
    return (
      !product || product.inStock === false || product.price !== item.price
    );
  });
  return { changed, live };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (busy || placed) return;

  hideAlert(statusEl);
  if (!validateForm(form)) return;
  if (!user) return location.assign("login.html?next=checkout.html");

  setBusy(true);
  try {
    const items = cart.getItems();
    if (!items.length) return render();

    const { changed, live } = await checkPrices(items);
    if (changed) {
      cart.syncCatalog(live);
      showAlert(
        statusEl,
        "Some prices or items changed since you added them. We've updated your order. Please review it and place it again.",
        "error",
      );
      statusEl.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    const data = Object.fromEntries(new FormData(form));
    const customer = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      region: data.region.trim(),
      postcode: (data.postcode || "").trim(),
      country: data.country.trim(),
    };

    const orderId = await placeOrder({
      uid: user.uid,
      items: cart.getItems(),
      customer,
      note: (data.note || "").trim(),
    });

    placed = true;
    cart.clear();
    showDone(orderId, customer);
  } catch {
    showAlert(
      statusEl,
      "We couldn't place your order. Check your connection and try again. Nothing was charged.",
      "error",
    );
  } finally {
    setBusy(false);
  }
});

form.addEventListener("input", (e) => {
  if (
    e.target.getAttribute("aria-invalid") === "true" &&
    e.target.checkValidity()
  ) {
    e.target.removeAttribute("aria-invalid");
    form
      .querySelector(`[data-error-for="${e.target.name}"]`)
      ?.replaceChildren();
  }
});

/* ----- Start ----- */
document.addEventListener("cart:change", render);

watchAuth((current) => {
  if (!current) {
    if (!placed) location.replace("login.html?next=checkout.html");
    return;
  }
  user = current;
  prefill();
  render();
});

clearErrors(form);
