import { formatPrice } from "./api.js";

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
