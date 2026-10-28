const NAV_LINKS = [
  { label: "Home", href: "index.html" },
  { label: "Shop", href: "shop.html" },
  { label: "Inspiration", href: "inspiration.html" },
  { label: "About Us", href: "about.html" },
  { label: "Support", href: "support.html" },
];

const ICONS = {
  cart: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>`,
  arrow: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`,
  menu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"/></svg>`,
  close: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>`,
};

const currentPage = location.pathname.split("/").pop() || "index.html";

const navItems = (linkClass) =>
  NAV_LINKS.map(
    ({ label, href }, i) => `
      <li style="--i:${i}">
        <a class="${linkClass}" href="${href}"${href === currentPage ? ' aria-current="page"' : ""}>${label}</a>
      </li>`,
  ).join("");

const headerTemplate = `
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="site-header__inner container">
      <a class="site-header__logo" href="index.html" aria-label="Arvela, home">Arvela</a>
      <nav class="site-nav" aria-label="Primary"><ul>${navItems("site-nav__link")}</ul></nav>
      <div class="site-header__actions">
        <a class="icon-btn" href="cart.html" aria-label="Cart">
          ${ICONS.cart}
          <span class="cart-count" data-cart-count hidden>0</span>
        </a>
        <a class="avatar" href="account.html" aria-label="Account">
          <img src="assets/images/avatar-handsome.png" alt="" width="28" height="28">
        </a>
        <button class="menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Open menu">${ICONS.menu}</button>
      </div>
    </div>
  </header>
  <div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" inert>
    <div class="mobile-menu__head">
      <span class="site-header__logo">Arvela</span>
      <button class="icon-btn" type="button" data-menu-close aria-label="Close menu">${ICONS.close}</button>
    </div>
    <ul class="mobile-menu__list">${navItems("mobile-menu__link")}</ul>
    <div class="mobile-menu__foot">
      <a href="cart.html">Cart</a>
      <a href="account.html">Account</a>
    </div>
  </div>`;

const ctaTemplate = `
  <section class="cta" aria-labelledby="cta-title">
    <div class="cta__inner container">
      <h2 class="cta__title" id="cta-title" data-reveal>Ready to Create Your Dream Space?</h2>
      <div class="cta__stack" data-reveal>
        <span class="cta__card" style="--n:0"><img src="assets/images/cta-card-1.jpg" alt="" width="160" height="160" loading="lazy"></span>
        <span class="cta__card" style="--n:1"><img src="assets/images/cta-card-2.jpg" alt="" width="160" height="160" loading="lazy"></span>
        <span class="cta__card" style="--n:2"><img src="assets/images/cta-card-3.jpg" alt="" width="160" height="160" loading="lazy"></span>
        <span class="cta__card" style="--n:3"><img src="assets/images/cta-card-4.jpg" alt="" width="160" height="160" loading="lazy"></span>
        <a class="cta__card cta__tile" style="--n:4" href="shop.html">
          <span>Let&rsquo;s<br>Shop Now</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>
        </a>
      </div>
      <p class="cta__text" data-reveal style="--i:2">Start building your beautifully nested home with Arvela today.</p>
    </div>
  </section>`;

const footerTemplate = `
  <footer class="site-footer">
    <div class="site-footer__top container">
      <p class="site-footer__brand">Arvela</p>
      <p class="site-footer__tagline">Clean Designs. Warm Homes. Perfectly Nested.</p>
    </div>

    <div class="site-footer__mid container">
      <div class="site-footer__cols">
        <nav class="site-footer__col" aria-labelledby="footer-discover">
          <h2 class="site-footer__heading" id="footer-discover">Discover</h2>
          <ul>
            <li><a href="shop.html">Shop</a></li>
            <li><a href="inspiration.html">Inspiration</a></li>
            <li><a href="shop.html?sort=new">New Arrivals</a></li>
            <li><a href="shop.html?sort=best">Best Sellers</a></li>
          </ul>
        </nav>
        <nav class="site-footer__col" aria-labelledby="footer-company">
          <h2 class="site-footer__heading" id="footer-company">Company</h2>
          <ul>
            <li><a href="about.html">About Us</a></li>
            <li><a href="about.html#story">Our Story</a></li>
            <li><a href="privacy.html">Privacy Policy</a></li>
            <li><a href="terms.html">Terms of Service</a></li>
          </ul>
        </nav>
        <nav class="site-footer__col" aria-labelledby="footer-support">
          <h2 class="site-footer__heading" id="footer-support">Support</h2>
          <ul>
            <li><a href="support.html#contact">Contact Us</a></li>
            <li><a href="support.html#faqs">FAQs</a></li>
            <li><a href="support.html#shipping">Shipping &amp; Returns</a></li>
            <li><a href="support.html#assembly">Assembly Guides</a></li>
          </ul>
        </nav>
      </div>

      <p class="site-footer__copy">
        <span class="site-footer__line">&copy;<span data-year></span> Arvela.</span>
        <span class="site-footer__line">All Rights Reserved.</span>
      </p>
    </div>

    <div class="site-footer__bottom">
      <h2 class="site-footer__invite">Get Inspired Daily</h2>

      <div class="site-footer__side">
        <ul class="site-footer__social" aria-label="Social media">
          <li><a href="https://www.instagram.com/" target="_blank" rel="noopener">Instagram</a></li>
          <li><a href="https://www.pinterest.com/" target="_blank" rel="noopener">Pinterest</a></li>
          <li><a href="https://www.tiktok.com/" target="_blank" rel="noopener">TikTok</a></li>
        </ul>
        <div class="site-footer__join">
          <p>Join our community for exclusive updates, design tips, and special offers.</p>
          <form class="newsletter" data-newsletter novalidate>
            <label class="sr-only" for="newsletter-email">Email address</label>
            <input id="newsletter-email" name="email" type="email" placeholder="Enter your email here" autocomplete="email" required>
            <button class="btn btn--dark btn--sm" type="submit">Subscribe</button>
          </form>
          <p class="newsletter__msg" role="status" data-newsletter-msg></p>
        </div>
      </div>

      <div class="site-footer__art">
        <img src="assets/images/footer-table.png" alt="" width="448" height="320" loading="lazy">
      </div>
    </div>
  </footer>`;

function mountMenu() {
  const openBtn = document.querySelector(".menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!openBtn || !menu) return;

  const focusable = () => [...menu.querySelectorAll("a[href], button")];

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    openBtn.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("no-scroll", open);
    if (open) focusable()[0]?.focus();
    else openBtn.focus();
  };

  openBtn.addEventListener("click", () => setOpen(true));
  menu
    .querySelector("[data-menu-close]")
    .addEventListener("click", () => setOpen(false));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (e) => {
    if (!menu.classList.contains("is-open")) return;
    if (e.key === "Escape") return setOpen(false);
    if (e.key !== "Tab") return;
    const items = focusable();
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  window.matchMedia("(min-width: 56.3em)").addEventListener("change", (e) => {
    if (e.matches && menu.classList.contains("is-open")) setOpen(false);
  });
}

function mountNewsletter() {
  const form = document.querySelector("[data-newsletter]");
  const msg = document.querySelector("[data-newsletter-msg]");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = form.elements.email;
    const button = form.querySelector("button[type='submit']");

    if (!input.value.trim() || !input.checkValidity()) {
      msg.textContent = "Please enter a valid email address.";
      return;
    }
    if (!window.ArvelaAPI?.subscribe) {
      msg.textContent =
        "Subscriptions are unavailable right now. Please try again later.";
      return;
    }

    button.disabled = true;
    try {
      const result = await window.ArvelaAPI.subscribe(input.value);
      msg.textContent =
        result === "exists"
          ? "You're already subscribed."
          : "Thanks for subscribing.";
      if (result === "ok") form.reset();
    } catch {
      msg.textContent = "Something went wrong. Please try again.";
    } finally {
      button.disabled = false;
    }
  });
}

function mountComponents() {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (header) header.innerHTML = headerTemplate;
  if (footer) footer.innerHTML = footerTemplate;
  document
    .querySelectorAll("[data-year]")
    .forEach((el) => (el.textContent = new Date().getFullYear()));
  mountMenu();
  mountNewsletter();
}

mountComponents();
