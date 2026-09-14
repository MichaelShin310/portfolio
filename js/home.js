/* ================================================================
   HOMEPAGE MOTION — "one continuous camera move"

   Five primitives, used everywhere, nothing else:

     scrub          driven by scroll position, not triggered by it
     depth          images sit further back and move slower
     counter-motion image drifts one way, its text the other
     velocity       rails lead with scroll speed, then settle
     magnetic       links pull toward the cursor and ease back

   Everything below is ADDITIVE. The page is complete and readable
   with this file absent, the CDN blocked, or reduced motion asked
   for; in those cases we never add `.motion` to <html>, so the
   hidden start-states in css/home.css never apply.
   ================================================================ */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGsap = typeof window.gsap !== "undefined" &&
                typeof window.ScrollTrigger !== "undefined";

  /* ---------------- The lens ----------------
     Runs on its own, with or without GSAP: the film is the one piece
     of motion that is part of the content rather than decoration.
     Kept as a plain rAF scrubber so it survives a dead CDN. */
  (function lens() {
    var lens = document.getElementById("lens");
    if (!lens || reduced) return;

    var media = lens.querySelector(".lens-media");
    var copy = lens.querySelector(".lens-copy");
    if (!media) return;

    var duration = 0;
    var last = -1;
    var ticking = false;
    var SCRUB_END = 0.9;   // the last tenth of the track is the fade out

    function readDuration() { duration = media.duration || 0; }
    media.addEventListener("loadedmetadata", readDuration);
    if (media.readyState >= 1) readDuration();

    function update() {
      ticking = false;
      var rect = lens.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      if (total <= 0) return;

      var p = Math.min(1, Math.max(0, -rect.top / total));

      if (duration > 0) {
        var t = Math.min(p / SCRUB_END, 1) * duration * 0.999;
        if (Math.abs(t - last) > 0.02) { media.currentTime = t; last = t; }
      }

      // The film already ends inside the black of the lens, so the handoff
      // into the page is a pure fade between two identical blacks.
      var exit = Math.min(1, Math.max(0, (p - SCRUB_END) / (1 - SCRUB_END)));
      media.style.opacity = String(1 - exit);
      if (copy) copy.style.opacity = String(Math.max(0, 1 - p * 4));
    }

    function onScroll() {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    media.addEventListener("loadedmetadata", onScroll);
    update();
  })();

  if (!hasGsap || reduced) return;

  root.classList.add("motion");
  gsap.registerPlugin(ScrollTrigger);

  /* ---------------- Smooth scroll ----------------
     Lenis is what makes the whole thing feel liquid rather than stepped.
     If it failed to load we simply run on native scroll; every
     ScrollTrigger below still works. */
  var lenis = null;
  if (typeof window.Lenis !== "undefined") {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    // Lenis owns the scroll position, so window.scrollTo() gets reverted on
    // the next frame. Exposed so automated checks (and the console) have a
    // way to move the page.
    window.__lenis = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  var isDesktop = window.matchMedia("(min-width: 901px)").matches;

  /* ---------------- Primitive: arrive ----------------
     The default. Content rises into place on its own scrub as the
     camera reaches it. One move, repeated — nothing bounces. */
  function arrive(targets, opts) {
    opts = opts || {};
    var els = gsap.utils.toArray(targets);
    if (!els.length) return;

    els.forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "expo.out",
        delay: (opts.stagger || 0) * i,
        scrollTrigger: {
          trigger: opts.trigger || el,
          start: opts.start || "top 82%"
        }
      });
    });
  }

  arrive(".stmt", { stagger: 0.09 });
  arrive(".rail-intro > *", { trigger: ".rail-intro", stagger: 0.08 });
  arrive(".flagship > *", { trigger: ".flagship", stagger: 0.07 });
  arrive(".tools-intro h2");
  arrive(".drawing-note");

  /* ---------------- Name card ----------------
     Tracking opens as the camera settles, then the whole line drifts up
     slower than the page — depth, not decoration. */
  gsap.utils.toArray(".name-line").forEach(function (line, i) {
    gsap.fromTo(line,
      { letterSpacing: "-0.075em", opacity: 0, y: 40 },
      {
        letterSpacing: "-0.045em", opacity: 1, y: 0,
        duration: 1.4, ease: "expo.out", delay: 0.12 * i,
        scrollTrigger: { trigger: ".namecard", start: "top 70%" }
      });
  });

  gsap.fromTo(".name",
    { yPercent: 0 },
    {
      yPercent: -14, ease: "none",
      scrollTrigger: { trigger: ".namecard", start: "top top", end: "bottom top", scrub: true }
    });

  // The perspective floor recedes faster than the name sitting on it.
  gsap.fromTo(".floor",
    { yPercent: 0 },
    {
      yPercent: -26, ease: "none",
      scrollTrigger: { trigger: ".namecard", start: "top bottom", end: "bottom top", scrub: true }
    });

  /* ---------------- The spine ----------------
     The camera pushes into the render while the copy holds, then
     releases. Counter-motion: image up, copy down, at different rates. */
  gsap.fromTo(".spine-img",
    { scale: 1.22, yPercent: -4 },
    {
      scale: 1, yPercent: 4, ease: "none",
      scrollTrigger: { trigger: ".spine", start: "top top", end: "bottom bottom", scrub: 0.6 }
    });

  gsap.fromTo(".spine-copy",
    { opacity: 0, y: 60 },
    {
      opacity: 1, y: 0, duration: 1.2, ease: "expo.out",
      scrollTrigger: { trigger: ".spine", start: "top top-=10%" }
    });

  gsap.to(".spine-copy", {
    y: -90, ease: "none",
    scrollTrigger: { trigger: ".spine", start: "center top", end: "bottom bottom", scrub: 0.6 }
  });

  gsap.fromTo(".spine-caption",
    { opacity: 0 },
    {
      opacity: 0.5, duration: 1, ease: "power2.out",
      scrollTrigger: { trigger: ".spine", start: "top top-=25%" }
    });

  /* ---------------- The drawing plate ----------------
     Depth: the plate rises slightly slower than the page around it. */
  gsap.fromTo(".drawing-plate",
    { y: 70, scale: 0.97 },
    {
      y: -40, scale: 1, ease: "none",
      scrollTrigger: { trigger: ".drawing", start: "top bottom", end: "bottom top", scrub: 0.7 }
    });

  /* ---------------- The rail ----------------
     Vertical scroll becomes lateral travel. Pinned only on desktop; a
     phone gets the plain vertical stack the CSS already describes. */
  if (isDesktop) {
    var track = document.querySelector(".rail-track");
    var viewport = document.querySelector(".rail-viewport");

    if (track && viewport) {
      var distance = function () {
        return Math.max(0, track.scrollWidth - window.innerWidth);
      };

      gsap.to(track, {
        x: function () { return -distance(); },
        ease: "none",
        scrollTrigger: {
          trigger: ".rail",
          start: "top top",
          end: function () { return "+=" + distance(); },
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      // Once pinned, a card's vertical position never changes, so it can't
      // trigger on its own edge. The whole set arrives together, staggered,
      // as the rail locks.
      gsap.to(".proj", {
        opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.07,
        scrollTrigger: { trigger: ".rail", start: "top 60%" }
      });
    }
  } else {
    arrive(".proj", { stagger: 0.05 });
  }

  /* ---------------- Tools: velocity ----------------
     Two lanes drifting in opposite directions. Scroll speed leads them
     and then they settle — this is the part that reads as liquid. */
  gsap.utils.toArray(".tool-row").forEach(function (row) {
    var lane = row.querySelector(".tool-lane");
    if (!lane) return;

    // Duplicate the contents, then travel exactly half the lane. The loop
    // point is pixel-identical to the start, so the wrap is invisible and
    // we never have to measure widths that images can change on load.
    lane.innerHTML += lane.innerHTML;

    var dir = parseFloat(row.getAttribute("data-dir")) || 1;
    var from = dir < 0 ? 0 : -50;
    var to = dir < 0 ? -50 : 0;

    var drift = gsap.fromTo(lane,
      { xPercent: from },
      { xPercent: to, duration: 42, ease: "none", repeat: -1 });

    var settle;
    ScrollTrigger.create({
      trigger: ".tools",
      start: "top bottom",
      end: "bottom top",
      onUpdate: function (self) {
        var boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 8);
        gsap.to(drift, { timeScale: boost, duration: 0.3, overwrite: true });
        clearTimeout(settle);
        settle = setTimeout(function () {
          gsap.to(drift, { timeScale: 1, duration: 1.2, overwrite: true });
        }, 180);
      }
    });
  });

  /* ---------------- Magnetic ----------------
     Links stop being rectangles you aim at and become things that
     reach back. Pointer only — never on touch, where there is no
     cursor to attract and the transform would just feel broken. */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    gsap.utils.toArray("[data-magnetic]").forEach(function (el) {
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
