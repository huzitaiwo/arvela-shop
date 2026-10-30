(() => {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const items = [...document.querySelectorAll("[data-count-view]")];

  function run(el) {
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
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4))) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (!items.length || reduceMotion || !("IntersectionObserver" in window))
    return;

  items.forEach((el) => (el.textContent = "0" + (el.dataset.suffix || "")));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        run(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  items.forEach((el) => observer.observe(el));
})();
