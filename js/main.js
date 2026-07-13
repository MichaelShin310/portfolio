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

// Cinematic scroll opener: scroll position scrubs the orbit video while the
// frame stays pinned, then the visual shrinks and fades into the page.
// The first 78% of the track drives the orbit; the last 22% is the exit.
(function () {
  var cine = document.getElementById("cine");
  if (!cine) return;

  var media = cine.querySelector(".cine-media");
  var copy = cine.querySelector(".cine-copy");

  // Reduced motion: no scrub, no pin theatrics — just show the poster once.
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  var duration = 0;
  media.addEventListener("loadedmetadata", function () {
    duration = media.duration || 0;
  });
  // Some browsers fire loadedmetadata before this script attaches.
  if (media.readyState >= 1) { duration = media.duration || 0; }

  var SCRUB_END = 0.9;    // portion of the track that plays the film
  var lastTime = -1;
  var ticking = false;

  function update() {
    ticking = false;
    var rect = cine.getBoundingClientRect();
    var total = rect.height - window.innerHeight;
    if (total <= 0) return;
    var p = Math.min(1, Math.max(0, -rect.top / total));

    // Scrub the film through the first part of the scroll.
    if (duration > 0) {
      var t = Math.min(p / SCRUB_END, 1) * duration * 0.999;
      if (Math.abs(t - lastTime) > 0.02) {
        media.currentTime = t;
        lastTime = t;
      }
    }

    // Exit: the film already ends inside the black of the lens, so the
    // handoff is a pure fade into the identical page black. No movement.
    var exit = Math.min(1, Math.max(0, (p - SCRUB_END) / (1 - SCRUB_END)));
    media.style.opacity = String(1 - exit);

    // The caption fades out as soon as scrolling starts.
    copy.style.opacity = String(Math.max(0, 1 - p * 4));
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  media.addEventListener("loadedmetadata", onScroll);
  update();
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
        // Land at the top of the newly opened project, just below the sticky
        // header — not wherever the previous scroll position happened to be.
        var head = document.querySelector(".site-head");
        var offset = (head ? head.getBoundingClientRect().height : 0) + 24;
        var y = item.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    });
  });
})();

// Titleblock: fade out when the footer/colophon is in view so the fixed
// sheet annotation never sits on top of the contact block.
(function () {
  var tb = document.querySelector(".titleblock");
  var foot = document.querySelector(".site-foot");
  if (!tb || !foot) return;
  function check() {
    var r = foot.getBoundingClientRect();
    var overlap = r.top < window.innerHeight - 40;
    tb.style.opacity = overlap ? "0" : "";
  }
  window.addEventListener("scroll", check, { passive: true });
  window.addEventListener("resize", check);
  check();
})();
