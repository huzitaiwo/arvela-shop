import { getProducts } from "./api.js";
import {
  productCard,
  skeletonCard,
  bindQuickAdd,
  CATEGORY_NAMES,
} from "./ui.js";

const PAGE_SIZE = 8;

const grid = document.querySelector("[data-shop-grid]");
const countEl = document.querySelector("[data-shop-count]");
const sortEl = document.querySelector("[data-shop-sort]");
const moreBtn = document.querySelector("[data-shop-more]");
const announce = document.querySelector("[data-shop-announce]");
const stateEl = document.querySelector("[data-shop-state]");
const filters = [...document.querySelectorAll("[data-category]")];

const state = {
  category: "",
  sort: "newest",
  featured: false,
  all: [],
  shown: 0,
  token: 0,
};

/* ----- URL <-> state ----- */
function readUrl() {
  const params = new URLSearchParams(location.search);
  const category = params.get("category") || "";
  const sort = params.get("sort") || "";

  state.category = category in CATEGORY_NAMES ? category : "";
  state.featured = sort === "best"; // footer "Best Sellers" link
  state.sort = ["price-asc", "price-desc"].includes(sort) ? sort : "newest";
}

function writeUrl() {
  const params = new URLSearchParams();
  if (state.category) params.set("category", state.category);
  if (state.featured) params.set("sort", "best");
  else if (state.sort !== "newest") params.set("sort", state.sort);
  const query = params.toString();
  history.replaceState(null, "", query ? `?${query}` : location.pathname);
}

function syncControls() {
  filters.forEach((btn) =>
    btn.setAttribute(
      "aria-pressed",
      String(btn.dataset.category === state.category),
    ),
  );
  sortEl.value = state.sort;
}

/* ----- Rendering ----- */
const showSkeleton = () => {
  grid.innerHTML = Array.from({ length: PAGE_SIZE }, skeletonCard).join("");
  grid.setAttribute("aria-busy", "true");
};

function showState({ title, text, action, onAction }) {
  stateEl.querySelector("[data-state-title]").textContent = title;
  stateEl.querySelector("[data-state-text]").textContent = text;
  const button = stateEl.querySelector("[data-state-action]");
  button.textContent = action;
  button.onclick = onAction;
  stateEl.hidden = false;
}

function updateCount() {
  const total = state.all.length;
  const label = state.featured
    ? "Best sellers"
    : CATEGORY_NAMES[state.category];
  countEl.textContent = `${label} · ${total} ${total === 1 ? "piece" : "pieces"}`;
  announce.textContent = `${total} ${total === 1 ? "piece" : "pieces"} shown`;
}

function renderMore() {
  const batch = state.all.slice(state.shown, state.shown + PAGE_SIZE);
  grid.insertAdjacentHTML(
    "beforeend",
    batch.map((product, i) => productCard(product, i)).join(""),
  );
  state.shown += batch.length;
  moreBtn.hidden = state.shown >= state.all.length;
}

async function load() {
  const token = ++state.token;
  stateEl.hidden = true;
  moreBtn.hidden = true;
  countEl.textContent = "Loading…";
  showSkeleton();

  try {
    const products = await getProducts({
      category: state.category || undefined,
      featured: state.featured,
      sort: state.sort,
      max: 60,
    });
    if (token !== state.token) return;

    state.all = products;
    state.shown = 0;
    grid.replaceChildren();
    grid.setAttribute("aria-busy", "false");
    updateCount();

    if (!products.length) {
      showState({
        title: "No pieces found",
        text: "We couldn't find anything in this category yet. Try browsing everything instead.",
        action: "Show all pieces",
        onAction: () => setFilter(""),
      });
      return;
    }
    renderMore();
  } catch {
    if (token !== state.token) return;
    grid.replaceChildren();
    grid.setAttribute("aria-busy", "false");
    countEl.textContent = "";
    showState({
      title: "Something went wrong",
      text: "We couldn't load the collection. Check your connection and try again.",
      action: "Try again",
      onAction: load,
    });
  }
}

/* ----- Interaction ----- */
function setFilter(category) {
  state.category = category;
  state.featured = false;
  syncControls();
  writeUrl();
  load();
}

filters.forEach((btn) =>
  btn.addEventListener("click", () => setFilter(btn.dataset.category)),
);

sortEl.addEventListener("change", () => {
  state.sort = sortEl.value;
  state.featured = false;
  writeUrl();
  load();
});

moreBtn.addEventListener("click", () => {
  const firstNew = state.shown;
  renderMore();
  grid
    .querySelectorAll(".product-card__link")
    [firstNew]?.focus({ preventScroll: true });
});

bindQuickAdd(grid, (id) => state.all.find((item) => item.id === id), announce);

readUrl();
syncControls();
load();
