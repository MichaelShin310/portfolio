/* ================================================================
   INNER PAGES — the same motion language as the homepage

   The homepage is one continuous camera move; these pages are the
   documents you arrive at. They share the grammar rather than the
   choreography: the same smooth scroll, the same single arrive move,
   the same magnetic links, the same idea that images sit further back
   than the words about them.

   ADDITIVE, exactly as on the homepage. `.motion` goes on <html> only
   once GSAP is confirmed and reduced motion has not been asked for,
   and every hidden start-state in the stylesheet is scoped to it. With
   this file absent or the CDN blocked, these pages are plain, complete
   documents.

   The architecture accordion lives outside that guard — it is
   navigation, not decoration, so it must work regardless.
   ================================================================ */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = typeof window.gsap !== "undefined" &&
                typeof window.ScrollTrigger !== "undefined";

  /* ---------------- Architecture accordion ----------------
     One project open at a time. Runs with or without GSAP. */
  (function accordion() {
    var items = Array.prototype.slice.call(document.querySelectorAll(".arch-item"));
    if (!items.length) return;

    function setOpen(item, open) {
      item.classList.toggle("open", open);
      var btn = item.querySelector(".arch-toggle");
      if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    }

    items.forEach(function (item) {
      var btn = item.querySelector(".arch-toggle");
      if (!btn) return;

      btn.addEventListener("click", function () {
        var wasOpen = item.classList.contains("open");
        items.forEach(function (other) { setOpen(other, false); });
        if (wasOpen) return;

        setOpen(item, true);

        // Land at the top of the newly opened project, just below the
        // sticky header — not wherever the previous scroll happened to be.
        var head = document.querySelector(".site-head");
        var offset = (head ? head.getBoundingClientRect().height : 0) + 24;
        var y = item.getBoundingClientRect().top + window.pageYOffset - offset;

        if (window.__lenis) window.__lenis.scrollTo(y);
        else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });

        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      });
    });
  })();

  if (!hasGsap || reduced) return;

  root.classList.add("motion");
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Smooth scroll ----------------
     Same settings as the homepage, so moving between the two does not
     feel like moving between two different websites. */
  if (typeof window.Lenis !== "undefined") {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------- Primitive: arrive ----------------
     One move, repeated. Identical easing and trigger point to the
     homepage's arrive(). */
  gsap.utils.toArray(".reveal").forEach(function (el) {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 1.1,
      ease: "expo.out",
      scrollTrigger: { trigger: el, start: "top 86%" }
    });
  });

  /* ---------------- Primitive: depth ----------------
     Photographs and renders drift slower than the page, so they read as
     sitting behind it. Skipped on `.contain` frames, which hold logos and
     full drawings: those are scaled to fit and must not be cropped. */
  gsap.utils.toArray(".ph.has-img:not(.contain) img").forEach(function (img) {
    // Deliberately slight. Most of these frames are product screenshots that
    // are already cover-cropped, and the scale needed to hide the travel eats
    // the UI they exist to show. Enough to read as depth, not enough to cost
    // content.
    gsap.fromTo(img,
      { yPercent: -2, scale: 1.05 },
      {
        yPercent: 2, scale: 1.05, ease: "none",
        scrollTrigger: {
          trigger: img.closest(".ph"),
          start: "top bottom",
          end: "bottom top",
          scrub: 0.8
        }
      });
  });

  /* The case-study hero plate gets a touch more of it. */
  gsap.utils.toArray(".case-hero .ph.has-img:not(.contain) img").forEach(function (img) {
    gsap.fromTo(img,
      { scale: 1.16 },
      {
        scale: 1.02, ease: "none",
        scrollTrigger: { trigger: ".case-hero", start: "top top", end: "bottom top", scrub: 0.8 }
      });
  });

  /* ---------------- Primitive: magnetic ----------------
     Applied by selector rather than by markup, so the inner pages did
     not need editing to gain it. Pointer devices only. */
  if (fine) {
    var MAGNETIC = ".wordmark, .site-nav a, .foot-mail, .foot-links a," +
                   " .about-links a, .cv-actions a, .link-arrow, .next-proj a," +
                   " .cv-link a";

    gsap.utils.toArray(MAGNETIC).forEach(function (el) {
      var pull = 0.32;
      var radius = 90;

      var xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      var yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });

      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        var limit = Math.max(radius, r.width * 0.5);
        xTo(gsap.utils.clamp(-limit, limit, dx) * pull);
        yTo(gsap.utils.clamp(-radius, radius, dy) * pull);
      });

      el.addEventListener("pointerleave", function () { xTo(0); yTo(0); });
    });
  }

  /* Late-arriving images change the page height, so re-measure once
     everything has loaded rather than trusting the first pass. */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
