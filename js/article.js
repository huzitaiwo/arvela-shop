import { getArticle, getArticles } from "./api.js";
import { esc, articleCard, formatDate, ARTICLE_CATEGORIES } from "./ui.js";

const root = document.querySelector("[data-article]");
const crumb = document.querySelector("[data-crumb-current]");
const more = document.querySelector("[data-more]");
const moreGrid = document.querySelector("[data-more-grid]");

const slug = new URLSearchParams(location.search).get("slug");

function showState({ title, text, href, label }) {
  root.setAttribute("aria-busy", "false");
  root.innerHTML = `
    <div class="state">
      <h1 class="state__title">${esc(title)}</h1>
      <p class="state__text">${esc(text)}</p>
      <a class="btn btn--dark btn--sm" href="${href}">${esc(label)}</a>
    </div>`;
  crumb.textContent = title;
}

const showMissing = () =>
  showState({
    title: "Article not found",
    text: "We couldn't find that article. It may have been moved, or the link is incorrect.",
    href: "inspiration.html",
    label: "Back to Inspiration",
  });

const showError = () =>
  showState({
    title: "Something went wrong",
    text: "We couldn't load this article. Check your connection and try again.",
    href: location.href,
    label: "Try again",
  });

function blockHtml(block) {
  const text = esc(block.text);
  if (block.type === "h2") return `<h2>${text}</h2>`;
  if (block.type === "quote") return `<blockquote><p>${text}</p></blockquote>`;
  return `<p>${text}</p>`;
}

function setMeta(article) {
  document.title = `${article.title} | Arvela`;
  document
    .querySelector('meta[name="description"]')
    ?.setAttribute("content", article.excerpt || "");

  const published = article.publishedAt?.toDate?.();
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: [new URL(article.image, location.href).href],
    ...(published && { datePublished: published.toISOString() }),
    author: { "@type": "Person", name: article.author },
    publisher: { "@type": "Organization", name: "Arvela" },
  };
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.append(script);
}

function render(article) {
  const categoryName = ARTICLE_CATEGORIES[article.category];
  const date = formatDate(article.publishedAt);
  const body = Array.isArray(article.body) ? article.body : [];

  setMeta(article);
  crumb.textContent = article.title;

  root.setAttribute("aria-busy", "false");
  root.innerHTML = `
    <header class="article__head">
      ${categoryName ? `<a class="article__cat" href="inspiration.html?category=${esc(article.category)}">${esc(categoryName)}</a>` : ""}
      <h1 class="section-title article__title">${esc(article.title)}</h1>
      <p class="article__meta">
        ${article.author ? `<span>By ${esc(article.author)}</span>` : ""}
        ${date ? `<time datetime="${esc(article.publishedAt.toDate().toISOString().slice(0, 10))}">${esc(date)}</time>` : ""}
        ${article.readTime ? `<span>${Number(article.readTime)} min read</span>` : ""}
      </p>
    </header>
    <figure class="article__hero">
      <img src="${esc(article.image)}" alt="" width="1280" height="720" fetchpriority="high">
    </figure>
    <div class="article__body prose">${body.map(blockHtml).join("")}</div>
    <footer class="article__footer">
      <a class="link-arrow" href="inspiration.html">
        All articles
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
      </a>
      <a class="btn btn--dark btn--sm" href="shop.html">
        Shop the collection
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
      </a>
    </footer>`;
}

async function loadMore(article) {
  try {
    const others = (await getArticles()).filter(
      (item) => item.id !== article.id,
    );
    // Same topic first, then the rest
    others.sort(
      (a, b) =>
        Number(b.category === article.category) -
        Number(a.category === article.category),
    );
    const list = others.slice(0, 3);
    if (!list.length) return;

    moreGrid.innerHTML = list.map((item, i) => articleCard(item, i)).join("");
    more.hidden = false;
  } catch {
    /* Related articles are optional, so the page works without them */
  }
}

async function init() {
  if (!slug) return showMissing();
  try {
    const article = await getArticle(slug);
    if (!article) return showMissing();
    render(article);
    loadMore(article);
  } catch {
    showError();
  }
}

init();
