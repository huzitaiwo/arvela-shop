import * as api from "./api.js";
import * as cart from "./cart.js";
import { watchAuth } from "./auth.js";

window.ArvelaAPI = { ...api, cart, subscribe: api.subscribeNewsletter };

cart.init();
watchAuth((user) => cart.setUser(user));

/* Keep the static homepage rows in sync with live prices and names */
async function syncProductRows() {
  const rows = [...document.querySelectorAll(".product-row[href*='slug=']")];
  if (!rows.length) return;

  try {
    const slugOf = (row) => new URL(row.href).searchParams.get("slug");
    const products = await api.getProductsBySlugs(rows.map(slugOf));
    const bySlug = new Map(products.map((p) => [p.slug, p]));

    rows.forEach((row) => {
      const product = bySlug.get(slugOf(row));
      if (!product) return;
      const price = row.querySelector(".product-row__price");
      price.textContent = api.formatPrice(product.price);
      price.value = product.price;
      row.querySelector(".product-row__name").textContent = product.name;
      row.querySelector(".product-row__desc").textContent = product.description;
    });
  } catch {
    /* the static markup stays as the fallback */
  }
}

syncProductRows();
