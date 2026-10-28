import { formatPrice } from "./api.js";
import * as cart from "./cart.js";

export const CATEGORY_NAMES = {
  "": "All",
  "chair-sofa": "Chair & Sofa",
  "table-desk": "Table & Desk",
  "shelf-accessories": "Shelf & Accessories",
  "light-lamp": "Light & Lamp",
};

export const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

const PLUS = `<svg class="icon-plus" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>`;
const CHECK = `<svg class="icon-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

export function productCard(product, index = 0) {
  const href = `product.html?slug=${encodeURIComponent(product.slug)}`;
  const soldOut = product.inStock === false;

  const action = soldOut
    ? `<span class="product-card__badge">Sold out</span>`
    : `<button class="product-card__add" type="button" data-add="${esc(product.id)}" aria-label="Add ${esc(product.name)} to cart">${PLUS}${CHECK}</button>`;

  return `
    <li>
      <article class="product-card" style="--i:${index}">
        <div class="product-card__media">
          <img src="${esc(product.image)}" alt="" width="400" height="400" loading="${index < 4 ? "eager" : "lazy"}">
          ${action}
        </div>
        <div class="product-card__info">
          <h3 class="product-card__name"><a class="product-card__link" href="${href}">${esc(product.name)}</a></h3>
          <data class="product-card__price" value="${Number(product.price)}">${formatPrice(product.price)}</data>
          <p class="product-card__desc">${esc(product.description)}</p>
        </div>
      </article>
    </li>`;
}

export function skeletonCard() {
  return `
    <li aria-hidden="true">
      <div class="product-card product-card--skeleton">
        <div class="product-card__media"></div>
        <div class="product-card__info">
          <span class="skeleton-line"></span>
          <span class="skeleton-line skeleton-line--short"></span>
        </div>
      </div>
    </li>`;
}

/* One quick-add handler for every product grid */
export function bindQuickAdd(container, findProduct, announceEl) {
  container.addEventListener("click", (e) => {
    const button = e.target.closest("[data-add]");
    if (!button) return;

    const product = findProduct(button.dataset.add);
    if (!product) return;

    cart.addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
    });

    button.classList.add("is-added");
    if (announceEl) announceEl.textContent = `${product.name} added to cart`;
    setTimeout(() => button.classList.remove("is-added"), 1600);
  });
}

export const ARTICLE_CATEGORIES = {
  "home-organization": "Home Organization",
  "small-spaces": "Small Spaces",
  "furniture-guide": "Furniture Guide",
};

export function formatDate(timestamp) {
  const date = timestamp?.toDate?.();
  return date
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(date)
    : "";
}

export function articleCard(article, index = 0) {
  const href = `article.html?slug=${encodeURIComponent(article.slug)}`;
  return `
    <li>
      <article class="article-card" style="--ratio: 4 / 3; --i:${index}">
        <div class="article-card__media">
          <img src="${esc(article.image)}" alt="" width="640" height="480" loading="${index < 3 ? "eager" : "lazy"}">
        </div>
        <h3 class="article-card__title"><a class="article-card__link" href="${href}">${esc(article.title)}</a></h3>
        <p class="article-card__text">${esc(article.excerpt)}</p>
        <p class="article-card__meta">
          <span class="article-card__tag">${esc(ARTICLE_CATEGORIES[article.category] || "")}</span>
          <svg class="article-card__arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
        </p>
      </article>
    </li>`;
}
