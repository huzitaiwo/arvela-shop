import { getArticles } from "./api.js";
import { articleCard, ARTICLE_CATEGORIES } from "./ui.js";

const grid = document.querySelector("[data-grid]");
const countEl = document.querySelector("[data-count]");
const announce = document.querySelector("[data-announce]");
const stateEl = document.querySelector("[data-state]");
const filters = [...document.querySelectorAll("[data-category]")];

const state = { category: "", all: [] };

const skeleton = () => `
  <li aria-hidden="true">
    <div class="article-card article-card--skeleton" style="--ratio: 4 / 3">
      <div class="article-card__media"></div>
    </div>
  </li>`;

function showState({ title, text, action, onAction }) {
  stateEl.querySelector("[data-state-title]").textContent = title;
  stateEl.querySelector("[data-state-text]").textContent = text;
  const button = stateEl.querySelector("[data-state-action]");
  button.textContent = action;
  button.onclick = onAction;
  stateEl.hidden = false;
}

function render() {
  const list = state.category
    ? state.all.filter((a) => a.category === state.category)
    : state.all;
  const label = ARTICLE_CATEGORIES[state.category] || "All topics";

  stateEl.hidden = true;
  grid.setAttribute("aria-busy", "false");
  countEl.textContent = `${label} · ${list.length} ${list.length === 1 ? "article" : "articles"}`;
  announce.textContent = `${list.length} ${list.length === 1 ? "article" : "articles"} shown`;

  if (!list.length) {
    grid.replaceChildren();
    showState({
      title: "No articles yet",
      text: "We haven't published anything in this topic yet. Try another one.",
      action: "Show all articles",
      onAction: () => setFilter(""),
    });
    return;
  }
  grid.innerHTML = list.map((article, i) => articleCard(article, i)).join("");
}

function syncControls() {
  filters.forEach((btn) =>
    btn.setAttribute(
      "aria-pressed",
      String(btn.dataset.category === state.category),
    ),
  );
}

function setFilter(category) {
  state.category = category;
  syncControls();
  const url = new URL(location.href);
  if (category) url.searchParams.set("category", category);
  else url.searchParams.delete("category");
  history.replaceState(null, "", url);
  render();
}

filters.forEach((btn) =>
  btn.addEventListener("click", () => setFilter(btn.dataset.category)),
);

async function load() {
  stateEl.hidden = true;
  countEl.textContent = "Loading…";
  grid.setAttribute("aria-busy", "true");
  grid.innerHTML = Array.from({ length: 3 }, skeleton).join("");

  try {
    state.all = await getArticles();
    render();
  } catch {
    grid.replaceChildren();
    grid.setAttribute("aria-busy", "false");
    countEl.textContent = "";
    showState({
      title: "Something went wrong",
      text: "We couldn't load the articles. Check your connection and try again.",
      action: "Try again",
      onAction: load,
    });
  }
}

const requested = new URLSearchParams(location.search).get("category");
state.category = ARTICLE_CATEGORIES[requested] ? requested : "";
syncControls();
load();
