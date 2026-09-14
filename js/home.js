/* ================================================================
   HOMEPAGE MOTION — "one continuous camera move"

   Five primitives, used everywhere, nothing else:

     scrub          driven by scroll position, not triggered by it
     depth          images sit further back and move slower
     counter-motion image drifts one way, its text the other
     velocity       lanes lead with scroll speed, then settle
     magnetic       links pull toward the cursor and ease back

   Everything below is ADDITIVE. The page is complete and readable
   with this file absent, the CDN blocked, or reduced motion asked
   for; in those cases we never add `.motion` to <html>, so the
   hidden start-states and the drifting-lane layout in css/home.css
   never apply.
   ================================================================ */

(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
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
    var sticky = lens.querySelector(".lens-sticky");
    if (!media || !sticky) return;

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

      // Fade the whole stage, not just the film: the stage carries an opaque
      // background, and the name card is sitting directly underneath waiting
      // to be revealed.
      var exit = Math.min(1, Math.max(0, (p - SCRUB_END) / (1 - SCRUB_END)));
      sticky.style.opacity = String(1 - exit);
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

  arrive(".flagship > *", { trigger: ".flagship", stagger: 0.07 });
  arrive(".tools-intro h2");

  /* ---------------- Name card ----------------
     Tracking opens as the camera settles, then the whole line drifts up
     slower than the page — depth, not decoration. */
  gsap.utils.toArray(".name-line").forEach(function (line, i) {
    gsap.fromTo(line,
      { letterSpacing: "-0.075em" },
      {
        letterSpacing: "-0.045em",
        duration: 1.6, ease: "expo.out", delay: 0.12 * i,
        scrollTrigger: { trigger: ".namecard", start: "top 70%" }
      });
  });

  /* The ground plane travels. Transversals sit at 1/d, so advancing every
     d by one geometric step and wrapping the phase moves the floor toward
     the viewer forever with no visible seam. */
  (function travellingFloor() {
    var floor = document.querySelector(".floor");
    if (!floor) return;

    var lines = Array.prototype.slice.call(floor.querySelectorAll("line"))
      .filter(function (l) { return l.getAttribute("x1") === "0"; });
    if (!lines.length) return;

    var VY = 316, BASE = 900, K = BASE - VY, STEP = 1.42;
    var phase = 0;

    gsap.ticker.add(function (time, delta) {
      phase = (phase + delta / 9000) % 1;
      for (var i = 0; i < lines.length; i++) {
        var y = VY + K / Math.pow(STEP, i + phase);
        lines[i].setAttribute("y1", y);
        lines[i].setAttribute("y2", y);
      }
    });
  })();

  /* The solid is the icosahedron from studio (Fuller's Fly's Eye Dome),
     built from its real vertex set and rotated live rather than exported
     as a picture. */
  (function rotatingSolid() {
    var svg = document.querySelector(".solid");
    var group = svg && svg.querySelector(".solid-edges");
    if (!group) return;

    var phi = (1 + Math.sqrt(5)) / 2;
    var raw = [
      [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
      [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
      [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
    ];
    var norm = Math.sqrt(1 + phi * phi);
    var verts = raw.map(function (v) {
      return [v[0] / norm, v[1] / norm, v[2] / norm];
    });

    // Every vertex pair separated by the icosahedron's edge length is an edge.
    var edges = [];
    var edgeLen = 2 / norm;
    for (var i = 0; i < verts.length; i++) {
      for (var j = i + 1; j < verts.length; j++) {
        var dx = verts[i][0] - verts[j][0];
        var dy = verts[i][1] - verts[j][1];
        var dz = verts[i][2] - verts[j][2];
        if (Math.abs(Math.sqrt(dx * dx + dy * dy + dz * dz) - edgeLen) < 0.001) {
          edges.push([i, j]);
        }
      }
    }

    var ns = "http://www.w3.org/2000/svg";
    var nodes = edges.map(function () {
      var line = document.createElementNS(ns, "line");
      group.appendChild(line);
      return line;
    });

    var ax = 0.4, ay = 0;
    gsap.ticker.add(function (time, delta) {
      ax += delta / 26000;
      ay += delta / 14000;

      var ca = Math.cos(ax), sa = Math.sin(ax);
      var cb = Math.cos(ay), sb = Math.sin(ay);

      var proj = verts.map(function (v) {
        var y1 = v[1] * ca - v[2] * sa;
        var z1 = v[1] * sa + v[2] * ca;
        var x2 = v[0] * cb + z1 * sb;
        var z2 = -v[0] * sb + z1 * cb;
        var k = 2.6 / (2.6 + z2);            // gentle perspective
        return [x2 * k * 1.35, y1 * k * 1.35];
      });

      for (var n = 0; n < nodes.length; n++) {
        var a = proj[edges[n][0]], b = proj[edges[n][1]];
        nodes[n].setAttribute("x1", a[0]);
        nodes[n].setAttribute("y1", a[1]);
        nodes[n].setAttribute("x2", b[0]);
        nodes[n].setAttribute("y2", b[1]);
      }
    });
  })();

  /* Where the light actually is, measured rather than guessed.
     Every frame of the clip was sampled across the x band the name occupies,
     recording the lowest row the beam still lights (threshold 100/255). The
     result is how far down the light has reached, per frame, as a thousandth
     of video height; -1 means the beam has not entered that band yet, which
     is the first two seconds. Monotonic by construction: light that has
     reached a point does not un-reach it.

     Regenerate with tools/trace-beam.py if the clip is ever replaced. */
  var BEAM_Y = [
    -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
    -1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,
    -1,-1,34,60,82,103,126,144,156,172,191,207,218,230,244,257,267,277,
    289,300,307,314,324,334,342,351,358,365,373,381,388,392,397,404,412,
    419,425,430,436,441,447,453,458,462,465,469,475,479,482,486,492,496,
    499,503,507,510,514,520,524,527,529,532,536,541,543,547,552,554,557,
    560,564,568,570,573,578,581,582,587,591,594,596,599,602,605,608,610,
    615,619,622,624,627,630,633,637,641,644,647,649,654,658,661,665,670,
    676,682,690,701,709,716,726,737,747,756,765,777,788,797,807,820,832,
    842,853,869,883,894,908,925,940,954,971,989,999,1000,1000,1000,1000,
    1000,1000,1000,1000,1000,1000,1000,1000,1000,1000,1000
  ];

  /* Optional film bed — scrubbed, not looped.
     The beam starts near vertical and swings down through the clip, so
     scroll position drives playback directly and a mask front descends with
     it, lighting the name out of the dark rather than fading it in.
     The site works without the file: if it is missing the element is removed,
     the icosahedron stays, and --rev keeps its default of "show everything". */
  (function filmBed() {
    var bed = document.querySelector(".name-bed");
    var card = document.querySelector(".namecard");
    var reveal = document.querySelector(".name-reveal");
    var stage = document.querySelector(".name-stage");
    if (!bed || !card || !reveal || !stage) return;

    var VIDEO_W = 1280, VIDEO_H = 720;

    // A ghost copy sits behind, unmasked, carrying the glass treatment: the
    // letters read as unlit glass in the dark and the beam lights them. Cloned
    // at runtime and hidden from assistive tech so the real heading stays the
    // only one in the accessibility tree.
    var ghost = reveal.cloneNode(true);
    ghost.classList.add("name-ghost");
    ghost.classList.remove("name-reveal");
    ghost.setAttribute("aria-hidden", "true");
    ghost.removeAttribute("style");

    // Strip the heading semantics from the copy. aria-hidden keeps it out of
    // the accessibility tree, but a second <h1> would still sit in the
    // document outline for anything crawling the page.
    var clonedHeading = ghost.querySelector("h1");
    if (clonedHeading) {
      var plain = document.createElement("div");
      plain.className = clonedHeading.className;
      plain.innerHTML = clonedHeading.innerHTML;
      clonedHeading.parentNode.replaceChild(plain, clonedHeading);
    }

    // Both copies go in a shared relatively-positioned block so the ghost can
    // sit exactly over the real text. Pinning it to the stage instead lands it
    // in the stage's padding box, not where the type actually is.
    var block = document.createElement("div");
    block.className = "name-block";
    reveal.parentNode.insertBefore(block, reveal);
    block.appendChild(ghost);
    block.appendChild(reveal);

    // The source is attached here rather than in the markup so the error
    // handler is guaranteed to be listening before the request goes out.
    bed.addEventListener("error", function () { bed.remove(); });

    var ready = false;
    bed.addEventListener("loadedmetadata", function () {
      ready = true;
      card.classList.add("has-bed");
      // Start dark. --rev defaults to "show everything" so the page is
      // readable with no JS, but once the beam is confirmed to be coming we
      // hand the type over to it — otherwise it sits there lit during the
      // dissolve and then pops out when the sweep takes over.
      reveal.style.setProperty("--rev", "0%");
    });

    bed.src = bed.getAttribute("data-src");

    // A scrubbed proxy rather than a raw scroll read, so the sweep keeps
    // easing after the wheel stops instead of snapping to a halt.
    var proxy = { p: 0 };
    var lastFrame = -1;

    gsap.to(proxy, {
      p: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".namecard",
        // The card is already pinned and full frame when the lens dissolves
        // off it, so the sweep can start the instant it becomes visible.
        start: "top top",
        // Runs until the section has actually left, not until it stops being
        // pinned. The stage still takes a full viewport to slide away after
        // the pin releases, and ending at "bottom bottom" left the clip frozen
        // on its last frame for every pixel of that.
        end: "bottom top",
        scrub: 0.5
      },
      onUpdate: function () {
        // Eased out, tuned so the beam has cleared the type by the time the
        // pin releases (~58% of this track) and the remaining fraction of the
        // clip plays out while the stage slides off. The shot is still moving
        // when it leaves the screen, so there is no frame where it has visibly
        // stopped.
        var p = 1 - Math.pow(1 - proxy.p, 2.75);
        var t = 0;

        if (ready && bed.duration) {
          t = p * (bed.duration - 0.04);
          // Seeking every frame is wasted work; a frame's worth is enough.
          if (Math.abs(t - lastFrame) > 1 / 48) {
            bed.currentTime = t;
            lastFrame = t;
          }
        }

        // Drive the mask from where the beam actually is, not from scroll
        // position, so the type lights as the light arrives at it rather than
        // running ahead of or behind the beam.
        if (ready && bed.duration) {
          var f = Math.round((t / bed.duration) * (BEAM_Y.length - 1));
          var lit = BEAM_Y[gsap.utils.clamp(0, BEAM_Y.length - 1, f)] / 1000;

          if (lit < 0) {
            reveal.style.setProperty("--rev", "0%");
          } else {
            // The clip is object-fit: cover, so map video space to the page
            // before comparing it with where the type sits.
            var vw = stage.clientWidth, vh = stage.clientHeight;
            var scale = Math.max(vw / VIDEO_W, vh / VIDEO_H);
            var drawnH = VIDEO_H * scale;
            var beamPageY = (vh - drawnH) / 2 + lit * drawnH;

            var box = reveal.getBoundingClientRect();
            var stageBox = stage.getBoundingClientRect();
            var frac = (beamPageY - (box.top - stageBox.top)) / box.height;
            reveal.style.setProperty("--rev", (gsap.utils.clamp(-0.3, 1.6, frac) * 100) + "%");
          }
        }
      }
    });
  })();

  /* Cursor spotlight over the name card. */
  if (fine) {
    (function spotlight() {
      var card = document.querySelector(".name-stage");
      if (!card) return;
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    })();
  }

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

  /* ---------------- The work lane ----------------
     Infinite moving cards. Hovering lifts the card in 3D toward you, dims
     its neighbours and holds the lane still so it can be read. Scroll
     velocity leads the drift — the same primitive as the tools wall. */
  (function workLane() {
    var lane = document.querySelector(".work-lane");
    if (!lane) return;

    // Duplicate the set, then travel exactly half the lane. The loop point
    // is pixel-identical to the start, so the wrap is invisible.
    lane.innerHTML += lane.innerHTML;

    gsap.to(lane.children, {
      opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.06,
      scrollTrigger: { trigger: ".work", start: "top 80%" }
    });

    var drift = gsap.fromTo(lane,
      { xPercent: 0 },
      { xPercent: -50, duration: 46, ease: "none", repeat: -1 });

    var settle;
    ScrollTrigger.create({
      trigger: ".work",
      start: "top bottom",
      end: "bottom top",
      onUpdate: function (self) {
        if (lane.classList.contains("is-held")) return;
        var boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 7);
        gsap.to(drift, { timeScale: boost, duration: 0.3, overwrite: true });
        clearTimeout(settle);
        settle = setTimeout(function () {
          gsap.to(drift, { timeScale: 1, duration: 1.2, overwrite: true });
        }, 180);
      }
    });

    if (!fine) return;

    var cards = Array.prototype.slice.call(lane.children);
    cards.forEach(function (card) {
      var rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3" });
      var ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3" });

      card.addEventListener("pointerenter", function () {
        lane.classList.add("is-held");
        gsap.to(drift, { timeScale: 0, duration: 0.6, overwrite: true });
        gsap.to(card, { scale: 1.06, z: 45, duration: 0.6, ease: "expo.out", overwrite: "auto" });
        // Dimming has to run through GSAP: the arrive tween leaves an inline
        // opacity on every card, and a CSS class can't outrank that.
        gsap.to(cards.filter(function (c) { return c !== card; }),
                { opacity: 0.3, duration: 0.45, ease: "power2.out", overwrite: "auto" });
      });

      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        ry(((e.clientX - (r.left + r.width / 2)) / r.width) * 11);
        rx(((e.clientY - (r.top + r.height / 2)) / r.height) * -9);
      });

      card.addEventListener("pointerleave", function () {
        lane.classList.remove("is-held");
        rx(0); ry(0);
        gsap.to(card, { scale: 1, z: 0, duration: 0.6, ease: "expo.out", overwrite: "auto" });
        gsap.to(cards, { opacity: 1, duration: 0.45, ease: "power2.out", overwrite: "auto" });
        gsap.to(drift, { timeScale: 1, duration: 1, overwrite: true });
      });
    });
  })();

  /* ---------------- Tools: velocity ----------------
     Two lanes drifting in opposite directions. Scroll speed leads them
     and then they settle — this is the part that reads as liquid. */
  gsap.utils.toArray(".tool-row").forEach(function (row) {
    var lane = row.querySelector(".tool-lane");
    if (!lane) return;

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
  if (fine) {
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
