import { getProduct, getProducts, formatPrice } from "./api.js";
import * as cart from "./cart.js";
import { esc, productCard, bindQuickAdd, CATEGORY_NAMES } from "./ui.js";

const root = document.querySelector("[data-product]");
const crumbCategory = document.querySelector("[data-crumb-category]");
const crumbCurrent = document.querySelector("[data-crumb-current]");
const related = document.querySelector("[data-related]");
const relatedGrid = document.querySelector("[data-related-grid]");
const relatedStatus = document.querySelector("[data-related-status]");

const slug = new URLSearchParams(location.search).get("slug");
const MAX_QTY = 20;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ----- Empty and error states ----- */
function showState({ title, text, href, label }) {
  root.setAttribute("aria-busy", "false");
  root.className = "";
  root.innerHTML = `
    <div class="state">
      <h1 class="state__title">${esc(title)}</h1>
      <p class="state__text">${esc(text)}</p>
      <a class="btn btn--dark btn--sm" href="${href}">${esc(label)}</a>
    </div>`;
  crumbCurrent.textContent = title;
}

const showMissing = () =>
  showState({
    title: "Piece not found",
    text: "We couldn't find that piece. It may have been removed, or the link is incorrect.",
    href: "shop.html",
    label: "Back to the shop",
  });

const showError = () =>
  showState({
    title: "Something went wrong",
    text: "We couldn't load this piece. Check your connection and try again.",
    href: location.href,
    label: "Try again",
  });

/* ----- Page metadata ----- */
function setMeta(product, images) {
  document.title = `${product.name} | Arvela`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", product.description || "");

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    image: images.map((src) => new URL(src, location.href).href),
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: Number(product.price),
      url: location.href,
      availability:
        product.inStock === false
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
    },
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}

/* ----- Render ----- */
function render(product) {
  const images = (
    Array.isArray(product.images) && product.images.length
      ? product.images
      : [product.image]
  ).filter(Boolean);
  const soldOut = product.inStock === false;
  const categoryName = CATEGORY_NAMES[product.category];
  const details = Array.isArray(product.details)
    ? product.details.filter((d) => d?.title && d?.text)
    : [];

  setMeta(product, images);
  crumbCurrent.textContent = product.name;
  if (categoryName) {
    crumbCategory.innerHTML = `<a href="shop.html?category=${esc(product.category)}">${esc(categoryName)}</a>`;
    crumbCategory.hidden = false;
  }

  const thumbs =
    images.length > 1
      ? `<div class="product__thumbs" role="group" aria-label="Product images">
        ${images
          .map(
            (src, i) => `
          <button class="product__thumb" type="button" data-thumb="${i}" aria-pressed="${i === 0}" aria-label="Show image ${i + 1} of ${images.length}">
            <img src="${esc(src)}" alt="" width="96" height="96">
          </button>`,
          )
          .join("")}
      </div>`
      : "";

  const buy = soldOut
    ? `<p class="product__sold">Currently sold out</p>`
    : `<div class="product__buy">
        <div class="qty">
          <button class="qty__btn" type="button" data-qty-dec aria-label="Decrease quantity" disabled>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>
          </button>
          <input class="qty__input" type="number" inputmode="numeric" min="1" max="${MAX_QTY}" value="1" data-qty aria-label="Quantity">
          <button class="qty__btn" type="button" data-qty-inc aria-label="Increase quantity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
          </button>
        </div>
        <button class="btn btn--dark product__add" type="button" data-add-btn></button>
      </div>
      <p class="product__added" data-added hidden>Added to your cart. <a href="cart.html">View cart</a></p>`;

  const accordion = details.length
    ? `<div class="accordion">
        ${details
          .map(
            (d) => `
          <details class="accordion__item">
            <summary class="accordion__summary">${esc(d.title)}</summary>
            <div class="accordion__body"><p>${esc(d.text)}</p></div>
          </details>`,
          )
          .join("")}
      </div>`
    : "";

  root.setAttribute("aria-busy", "false");
  root.innerHTML = `
    <div class="product__gallery">
      <figure class="product__stage">
        <img data-stage src="${esc(images[0])}" alt="${esc(product.name)}" width="800" height="800" fetchpriority="high">
      </figure>
      ${thumbs}
    </div>
    <div class="product__info">
      ${categoryName ? `<a class="product__cat" href="shop.html?category=${esc(product.category)}">${esc(categoryName)}</a>` : ""}
      <h1 class="section-title section-title--md product__title">${esc(product.name)}</h1>
      <p class="product__price"><data value="${Number(product.price)}">${formatPrice(product.price)}</data></p>
      <p class="product__desc">${esc(product.description)}</p>
      ${buy}
      <p class="sr-only" role="status" data-product-status></p>
      ${accordion}
    </div>`;

  wireGallery(product, images);
  if (!soldOut) wireBuy(product);
}

/* ----- Gallery ----- */
function wireGallery(product, images) {
  const stage = root.querySelector("[data-stage]");
  const thumbs = [...root.querySelectorAll("[data-thumb]")];
  let active = 0;

  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", async () => {
      const index = Number(thumb.dataset.thumb);
      if (index === active) return;
      active = index;
      thumbs.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === thumb)),
      );

      stage.classList.add("is-swapping");
      const next = new Image();
      next.src = images[index];
      await Promise.all([
        next.decode().catch(() => {}),
        wait(reduceMotion ? 0 : 200),
      ]);
      if (active !== index) return;
      stage.src = images[index];
      stage.alt = `${product.name}, image ${index + 1} of ${images.length}`;
      stage.classList.remove("is-swapping");
    });
  });
}

/* ----- Quantity + add to cart ----- */
function wireBuy(product) {
  const input = root.querySelector("[data-qty]");
  const dec = root.querySelector("[data-qty-dec]");
  const inc = root.querySelector("[data-qty-inc]");
  const addBtn = root.querySelector("[data-add-btn]");
  const added = root.querySelector("[data-added]");
  const status = root.querySelector("[data-product-status]");
  let resetTimer = 0;

  const clamp = (n) =>
    Math.min(MAX_QTY, Math.max(1, Math.floor(Number(n) || 1)));
  const label = () =>
    `Add to cart · ${formatPrice(product.price * Number(input.value))}`;

  function setQty(n) {
    input.value = clamp(n);
    dec.disabled = Number(input.value) <= 1;
    inc.disabled = Number(input.value) >= MAX_QTY;
    if (!addBtn.classList.contains("is-added")) addBtn.textContent = label();
  }

  dec.addEventListener("click", () => setQty(Number(input.value) - 1));
  inc.addEventListener("click", () => setQty(Number(input.value) + 1));
  input.addEventListener("change", () => setQty(input.value));

  addBtn.addEventListener("click", () => {
    const qty = clamp(input.value);
    cart.addItem(
      {
        id: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
      },
      qty,
    );

    clearTimeout(resetTimer);
    addBtn.classList.add("is-added");
    addBtn.textContent = "Added to cart ✓";
    added.hidden = false;
    status.textContent = `${qty} × ${product.name} added to your cart`;

    resetTimer = setTimeout(() => {
      addBtn.classList.remove("is-added");
      addBtn.textContent = label();
    }, 1800);
  });

  setQty(1);
}

/* ----- Related products ----- */
async function loadRelated(product) {
  try {
    const sameCategory = await getProducts({
      category: product.category,
      max: 6,
    });
    let list = sameCategory.filter((item) => item.id !== product.id);

    if (list.length < 4) {
      const others = await getProducts({ max: 8 });
      const seen = new Set([product.id, ...list.map((item) => item.id)]);
      list = [...list, ...others.filter((item) => !seen.has(item.id))];
    }
    list = list.slice(0, 4);
    if (!list.length) return;

    relatedGrid.innerHTML = list
      .map((item, i) => productCard(item, i))
      .join("");
    bindQuickAdd(
      relatedGrid,
      (id) => list.find((item) => item.id === id),
      relatedStatus,
    );
    related.hidden = false;
  } catch {
    /* Related products are optional, so the page works without them */
  }
}

/* ----- Start ----- */
async function init() {
  if (!slug) return showMissing();
  try {
    const product = await getProduct(slug);
    if (!product) return showMissing();
    render(product);
    loadRelated(product);
  } catch {
    showError();
  }
}

init();
