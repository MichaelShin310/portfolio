// Scroll-reveal: one signature move, repeated. Nothing bounces.
// Implemented as a synchronous sweep (not IntersectionObserver) so content
// is never gated. Observers and rAF don't fire in hidden/embedded pages.
(function () {
  var els = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  function sweep() {
    els = els.filter(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.96) {
        // Hidden/embedded pages pause CSS transitions, so show final state.
        if (document.hidden) { el.style.transition = "none"; }
        el.classList.add("in");
        return false;
      }
      return true;
    });
    return els.length;
  }

  // Above-the-fold content shows immediately, before first paint.
  sweep();

  window.addEventListener("scroll", sweep, { passive: true });
  window.addEventListener("resize", sweep);
  document.addEventListener("visibilitychange", sweep);
})();

// Architecture accordion: one project open at a time. Opening a project
// closes whichever is currently open.
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll(".arch-item"));
  if (!items.length) return;

  function setOpen(item, open) {
    item.classList.toggle("open", open);
    var btn = item.querySelector(".arch-toggle");
    if (btn) { btn.setAttribute("aria-expanded", open ? "true" : "false"); }
  }

  items.forEach(function (item) {
    var btn = item.querySelector(".arch-toggle");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var wasOpen = item.classList.contains("open");
      items.forEach(function (other) { setOpen(other, false); });
      if (!wasOpen) {
        setOpen(item, true);
        // Keep the opened row in view when a taller row above it collapses.
        item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });
})();
