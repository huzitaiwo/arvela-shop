const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

/* ----- Product switcher ----- */
const options = [...document.querySelectorAll("[data-hero-option]")];
const heroImage = document.querySelector("[data-hero-image]");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function selectOption(option) {
  if (!heroImage || option.getAttribute("aria-checked") === "true") return;

  options.forEach((item) => {
    const active = item === option;
    item.setAttribute("aria-checked", String(active));
    item.tabIndex = active ? 0 : -1;
  });

  const next = new Image();
  next.src = option.dataset.image;

  heroImage.classList.add("is-swapping");
  await Promise.all([
    next.decode().catch(() => {}),
    wait(reduceMotion ? 0 : 250),
  ]);

  heroImage.src = option.dataset.image;
  heroImage.alt = option.dataset.alt || "";
  heroImage.classList.remove("is-swapping");
}

options.forEach((option, index) => {
  option.addEventListener("click", () => selectOption(option));
  option.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[
      e.key
    ];
    if (!step) return;
    e.preventDefault();
    const target = options[(index + step + options.length) % options.length];
    target.focus();
    selectOption(target);
  });
});

/* ----- Count-up stats ----- */
const counters = document.querySelectorAll(".hero [data-count]");

function runCounter(el) {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  if (reduceMotion) {
    el.textContent = target + suffix;
    return;
  }

  const duration = 1800;
  const start = performance.now();
  const tick = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

counters.forEach((el) => {
  el.textContent = "0" + (el.dataset.suffix || "");
  setTimeout(() => runCounter(el), reduceMotion ? 0 : 700);
});

/* Stats below the fold count up when they scroll into view */
const viewCounters = document.querySelectorAll("[data-count-view]");

if (viewCounters.length && "IntersectionObserver" in window && !reduceMotion) {
  viewCounters.forEach(
    (el) => (el.textContent = "0" + (el.dataset.suffix || "")),
  );

  const countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        countObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  viewCounters.forEach((el) => countObserver.observe(el));
}

/* ----- Scroll parallax (headline + chairs) ----- */
const hero = document.querySelector(".hero");

if (hero && !reduceMotion) {
  let ticking = false;

  const update = () => {
    const shift = Math.min(window.scrollY, hero.offsetHeight);
    hero.style.setProperty("--hero-shift", `${shift}px`);
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true },
  );
}

/* ----- Image parallax ([data-parallax]) ----- */
const parallaxEls = [...document.querySelectorAll("[data-parallax]")];

if (parallaxEls.length && !reduceMotion && "IntersectionObserver" in window) {
  const inView = new Set();
  let parallaxTicking = false;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      });
      updateParallax();
    },
    { rootMargin: "20% 0px" },
  );
  parallaxEls.forEach((el) => io.observe(el));

  function updateParallax() {
    inView.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const progress =
        (rect.top + rect.height / 2 - innerHeight / 2) /
        (innerHeight / 2 + rect.height / 2);
      el.style.setProperty("--parallax", `${(progress * -8).toFixed(2)}%`);
      el.style.setProperty("--float", `${(progress * -90).toFixed(1)}px`);
    });
    parallaxTicking = false;
  }

  window.addEventListener(
    "scroll",
    () => {
      if (!parallaxTicking) {
        requestAnimationFrame(updateParallax);
        parallaxTicking = true;
      }
    },
    { passive: true },
  );
}

/* ----- Product list cursor ([data-product-list]) ----- */
document.querySelectorAll("[data-product-list]").forEach((list) => {
  const cursor = list.querySelector("[data-row-cursor]");
  const finePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)",
  ).matches;
  if (!cursor || !finePointer || reduceMotion) return;

  let targetX = 0,
    targetY = 0,
    x = 0,
    y = 0,
    frame = 0;

  const loop = () => {
    x += (targetX - x) * 0.18;
    y += (targetY - y) * 0.18;
    cursor.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    frame =
      Math.abs(targetX - x) > 0.3 || Math.abs(targetY - y) > 0.3
        ? requestAnimationFrame(loop)
        : 0;
  };

  const track = (e) => {
    const rect = list.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    if (!frame) frame = requestAnimationFrame(loop);
  };

  list.querySelectorAll(".product-row").forEach((row) => {
    row.addEventListener("pointerenter", (e) => {
      const rect = list.getBoundingClientRect();
      if (!cursor.classList.contains("is-active")) {
        x = targetX = e.clientX - rect.left;
        y = targetY = e.clientY - rect.top;
        cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      }
      cursor.classList.add("is-active");
    });
    row.addEventListener("pointerleave", () =>
      cursor.classList.remove("is-active"),
    );
  });

  list.addEventListener("pointermove", track);
});

/* ----- Testimonials ([data-reviews]) ----- */
const reviews = document.querySelector("[data-reviews]");

if (reviews) {
  const tabs = [...reviews.querySelectorAll('[role="tab"]')];
  const panel = reviews.querySelector('[role="tabpanel"]');
  const image = reviews.querySelector("[data-review-image]");
  const quote = reviews.querySelector("[data-review-quote]");
  const cite = reviews.querySelector("[data-review-cite]");
  let current = 0;
  let timer = 0;
  let stopped = false;

  const renderQuote = (text) => {
    const p = document.createElement("p");
    const words = text.split(" ");
    words.forEach((word, i) => {
      const span = document.createElement("span");
      span.className = "word";
      span.style.setProperty("--w", i);
      span.textContent = word;
      p.append(span);
      if (i < words.length - 1) p.append(" ");
    });
    quote.classList.remove("is-revealed");
    quote.replaceChildren(p);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => quote.classList.add("is-revealed")),
    );
  };

  async function select(index, { focus = false } = {}) {
    current = index;
    const tab = tabs[index];

    tabs.forEach((item, i) => {
      item.setAttribute("aria-selected", String(i === index));
      item.tabIndex = i === index ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", tab.id);
    cite.textContent = `${tab.dataset.name}, ${tab.dataset.city}`;
    renderQuote(tab.dataset.quote);
    if (focus) tab.focus();

    image.classList.add("is-swapping");
    const next = new Image();
    next.src = tab.dataset.image;
    await Promise.all([
      next.decode().catch(() => {}),
      wait(reduceMotion ? 0 : 250),
    ]);
    if (current !== index) return;
    image.src = tab.dataset.image;
    image.alt = `Portrait of ${tab.dataset.name}`;
    image.classList.remove("is-swapping");
  }

  const start = () => {
    if (stopped || reduceMotion || timer) return;
    timer = setInterval(() => select((current + 1) % tabs.length), 7000);
  };
  const pause = () => {
    clearInterval(timer);
    timer = 0;
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      stopped = true;
      pause();
      select(index);
    });
    tab.addEventListener("keydown", (e) => {
      const last = tabs.length - 1;
      const target = {
        ArrowDown: index === last ? 0 : index + 1,
        ArrowRight: index === last ? 0 : index + 1,
        ArrowUp: index === 0 ? last : index - 1,
        ArrowLeft: index === 0 ? last : index - 1,
        Home: 0,
        End: last,
      }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      stopped = true;
      pause();
      select(target, { focus: true });
    });
  });

  reviews.addEventListener("pointerenter", pause);
  reviews.addEventListener("pointerleave", start);
  reviews.addEventListener("focusin", pause);
  reviews.addEventListener("focusout", start);

  if ("IntersectionObserver" in window) {
    let first = true;
    new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (first) {
              first = false;
              renderQuote(tabs[0].dataset.quote);
            }
            start();
          } else {
            pause();
          }
        });
      },
      { threshold: 0.4 },
    ).observe(reviews);
  }
}
