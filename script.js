/* ==========================================================================
   Ritik Dave — Portfolio
   Vanilla JS · no dependencies
   ========================================================================== */

(() => {
  "use strict";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const TAU = Math.PI * 2;

  /* ------------------------------------------------------------------------
     Loader
     ------------------------------------------------------------------------ */

  const loader = $("#loader");
  const loaderBar = $("#loaderBar");
  const loaderPct = $("#loaderPct");
  let pageReady = false;
  const readyQueue = [];

  function dispatchReady() {
    if (pageReady) return;
    pageReady = true;
    window.dispatchEvent(new CustomEvent("portfolio:ready"));
    while (readyQueue.length) readyQueue.shift()();
  }

  if (loader) {
    let seen = false;
    try { seen = sessionStorage.getItem("rd-seen") === "1"; } catch (_) { /* private mode */ }

    const duration = reduceMotion ? 180 : seen ? 520 : 1450;
    const started = performance.now();
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      if (loaderBar) loaderBar.style.width = "100%";
      if (loaderPct) loaderPct.textContent = "100";
      loader.classList.add("done");
      try { sessionStorage.setItem("rd-seen", "1"); } catch (_) { /* ignore */ }
      dispatchReady();
      setTimeout(() => loader.remove(), 800);
    };

    const tick = (now) => {
      const p = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = Math.round(eased * 100);
      if (loaderBar) loaderBar.style.width = value + "%";
      if (loaderPct) loaderPct.textContent = String(value).padStart(2, "0");
      if (p < 1) requestAnimationFrame(tick);
      else finish();
    };

    requestAnimationFrame(tick);
    setTimeout(finish, duration + 1600);
  } else {
    dispatchReady();
  }

  setTimeout(dispatchReady, 4200);

  /* ------------------------------------------------------------------------
     Starfield
     ------------------------------------------------------------------------ */

  const canvas = $("#starfield");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1;
    let stars = [];
    let shooting = [];
    let raf = null;
    let lastScrollY = window.scrollY;
    let scrollVelocity = 0;
    let pointerTX = 0, pointerTY = 0;
    let pointerCX = 0, pointerCY = 0;
    let nextShoot = performance.now() + 3500;

    const palette = {
      white: "rgba(255,255,255,1)",
      violet: "rgba(186,169,255,1)",
      cyan: "rgba(151,245,255,1)"
    };

    function buildStars() {
      const count = reduceMotion
        ? Math.min(180, Math.round((w * h) / 12000))
        : Math.min(280, Math.max(100, Math.round((w * h) / 8500)));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        z: Math.random() * 0.85 + 0.15,
        r: Math.random() * 1.1 + 0.3,
        tw: Math.random() * TAU,
        ts: 0.006 + Math.random() * 0.016,
        c: Math.random() < 0.1 ? "violet" : Math.random() < 0.07 ? "cyan" : "white"
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
      if (reduceMotion) renderStill();
    }

    function renderStill() {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        ctx.globalAlpha = 0.25 + s.z * 0.6;
        ctx.fillStyle = palette[s.c];
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r * (0.4 + s.z * 0.8), 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function spawnShootingStar(now) {
      if (now < nextShoot) return;
      nextShoot = now + 4500 + Math.random() * 6000;
      shooting.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * h * 0.35,
        vx: 5 + Math.random() * 3,
        vy: 2 + Math.random() * 1.4,
        life: 1
      });
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);

      const dy = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      scrollVelocity += (Math.abs(dy) - scrollVelocity) * 0.09;
      scrollVelocity *= 0.965;

      pointerCX += (pointerTX - pointerCX) * 0.04;
      pointerCY += (pointerTY - pointerCY) * 0.04;

      ctx.clearRect(0, 0, w, h);
      const warp = Math.min(scrollVelocity * 0.5, 16);

      for (const s of stars) {
        s.tw += s.ts;
        s.y += 0.035 + warp * s.z * 0.55;
        s.x -= 0.012 * s.z;
        if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
        if (s.x < -4) s.x = w + 4;

        const px = s.x + pointerCX * 26 * s.z;
        const py = s.y + pointerCY * 20 * s.z;
        const radius = s.r * (0.45 + s.z * 0.9);
        const alpha = (0.18 + (0.5 + 0.5 * Math.sin(s.tw)) * 0.62) * (0.4 + s.z * 0.6);

        ctx.globalAlpha = alpha;
        ctx.fillStyle = palette[s.c];
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, TAU);
        ctx.fill();

        if (scrollVelocity > 16) {
          const len = Math.min(scrollVelocity * 0.5, 34) * s.z;
          ctx.globalAlpha = alpha * 0.55;
          ctx.strokeStyle = palette[s.c];
          ctx.lineWidth = radius * 0.9;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - len);
          ctx.stroke();
        }
      }

      spawnShootingStar(now);
      for (let i = shooting.length - 1; i >= 0; i--) {
        const m = shooting[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life -= 0.012;
        if (m.life <= 0 || m.x > w + 80 || m.y > h + 80) {
          shooting.splice(i, 1);
          continue;
        }
        const grad = ctx.createLinearGradient(m.x, m.y, m.x - 70, m.y - 28);
        grad.addColorStop(0, "rgba(255,255,255," + m.life + ")");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - 70, m.y - 28);
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    window.addEventListener("pointermove", (e) => {
      pointerTX = (e.clientX / w - 0.5) * 2;
      pointerTY = (e.clientY / h - 0.5) * 2;
    }, { passive: true });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 180);
    });

    resize();
    if (!reduceMotion) raf = requestAnimationFrame(loop);

    document.addEventListener("visibilitychange", () => {
      if (reduceMotion) return;
      if (document.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = null;
      } else if (!raf) {
        lastScrollY = window.scrollY;
        raf = requestAnimationFrame(loop);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Custom cursor
     ------------------------------------------------------------------------ */

  if (finePointer && !reduceMotion) {
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    if (dot && ring) {
      document.body.classList.add("has-cursor");
      let mx = window.innerWidth / 2, my = window.innerHeight / 2;
      let rx = mx, ry = my;
      let visible = true;

      document.addEventListener("pointermove", (e) => {
        mx = e.clientX;
        my = e.clientY;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;

        const target = e.target instanceof Element ? e.target : null;
        const interactive = target && target.closest("a, button, .chip, .node-inner, .project-card, [data-tilt]");
        const isField = target && target.closest("input, textarea, select");
        ring.classList.toggle("is-hover", Boolean(interactive));
        dot.classList.toggle("is-hover", Boolean(interactive));

        if (isField) {
          dot.style.opacity = "0";
          ring.style.opacity = "0";
        } else {
          dot.style.opacity = "";
          ring.style.opacity = "";
        }
      }, { passive: true });

      document.addEventListener("pointerdown", () => ring.classList.add("is-down"));
      document.addEventListener("pointerup", () => ring.classList.remove("is-down"));
      document.addEventListener("mouseleave", () => {
        visible = false;
        document.body.classList.add("is-out");
      });
      document.addEventListener("mouseenter", () => {
        visible = true;
        document.body.classList.remove("is-out");
      });

      const cursorLoop = () => {
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
        requestAnimationFrame(cursorLoop);
      };
      requestAnimationFrame(cursorLoop);

      window.addEventListener("blur", () => {
        visible = false;
        document.body.classList.add("is-out");
      });
    }
  }

  /* ------------------------------------------------------------------------
     Typing effect
     ------------------------------------------------------------------------ */

  const typedEl = $("#typed");
  if (typedEl) {
    const phrases = [
      "scalable backend systems",
      "AI-powered workflows",
      "distributed microservices",
      "clean, production-ready products"
    ];

    if (reduceMotion) {
      typedEl.textContent = phrases[0];
    } else {
      let phraseIndex = 0;
      let charIndex = phrases[0].length;
      let deleting = true;

      const typeTick = () => {
        const word = phrases[phraseIndex];

        if (deleting) {
          charIndex--;
          typedEl.textContent = word.slice(0, Math.max(charIndex, 0));
          if (charIndex <= 0) {
            deleting = false;
            phraseIndex = (phraseIndex + 1) % phrases.length;
            setTimeout(typeTick, 420);
          } else {
            setTimeout(typeTick, 28);
          }
        } else {
          charIndex++;
          typedEl.textContent = phrases[phraseIndex].slice(0, charIndex);
          if (charIndex >= phrases[phraseIndex].length) {
            deleting = true;
            setTimeout(typeTick, 2300);
          } else {
            setTimeout(typeTick, 58);
          }
        }
      };

      setTimeout(typeTick, 2800);
    }
  }

  /* ------------------------------------------------------------------------
     Reveal on scroll + chip stagger
     ------------------------------------------------------------------------ */

  $$(".skill-group").forEach((group) => {
    $$(".chip", group).forEach((chip, i) => chip.style.setProperty("--i", String(i)));
  });

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  /* ------------------------------------------------------------------------
     Animated counters
     ------------------------------------------------------------------------ */

  const counters = $$("[data-count]");

  function runCounter(el) {
    if (el.dataset.done === "1") return;
    el.dataset.done = "1";

    const target = parseFloat(el.dataset.count || "0");
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1700;
    const start = performance.now();

    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = (decimals ? value.toFixed(decimals) : String(Math.round(value))) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  if (!reduceMotion && counters.length && "IntersectionObserver" in window) {
    const pendingCounters = new Set();

    window.addEventListener("portfolio:ready", () => {
      pendingCounters.forEach(runCounter);
      pendingCounters.clear();
    });

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        counterObserver.unobserve(el);
        if (pageReady) runCounter(el);
        else pendingCounters.add(el);
      });
    }, { threshold: 0.6 });

    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ------------------------------------------------------------------------
     Scroll UI — progress, nav state, back to top
     ------------------------------------------------------------------------ */

  const nav = $("#nav");
  const progressBar = $("#progressBar");
  const toTop = $("#toTop");
  let scrollQueued = false;

  function updateScrollUI() {
    scrollQueued = false;
    const top = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (max > 0 ? (top / max) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("is-scrolled", top > 24);
    if (toTop) toTop.classList.toggle("show", top > 720);
  }

  window.addEventListener("scroll", () => {
    if (!scrollQueued) {
      scrollQueued = true;
      requestAnimationFrame(updateScrollUI);
    }
  }, { passive: true });

  updateScrollUI();

  if (toTop) {
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* Active nav link */
  const navLinks = $$("[data-navlink]");
  const sections = $$("main section[id]");

  if (sections.length && navLinks.length && "IntersectionObserver" in window) {
    const activeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-active", isActive);
          if (isActive) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-42% 0px -52% 0px" });

    sections.forEach((section) => activeObserver.observe(section));
  }

  /* ------------------------------------------------------------------------
     Mobile menu
     ------------------------------------------------------------------------ */

  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");
  let menuOpen = false;

  function openMenu() {
    if (!menuBtn || !mobileMenu) return;
    menuOpen = true;
    document.body.classList.add("menu-open");
    menuBtn.setAttribute("aria-expanded", "true");
    menuBtn.setAttribute("aria-label", "Close navigation");
    mobileMenu.removeAttribute("inert");
    mobileMenu.setAttribute("aria-hidden", "false");
    const firstLink = mobileMenu.querySelector("a[href]");
    if (firstLink) setTimeout(() => firstLink.focus({ preventScroll: true }), 120);
  }

  function closeMenu(returnFocus = true) {
    if (!menuBtn || !mobileMenu) return;
    menuOpen = false;
    document.body.classList.remove("menu-open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.setAttribute("aria-label", "Open navigation");
    mobileMenu.setAttribute("inert", "");
    mobileMenu.setAttribute("aria-hidden", "true");
    if (returnFocus) menuBtn.focus({ preventScroll: true });
  }

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener("click", () => (menuOpen ? closeMenu() : openMenu()));

    mobileMenu.addEventListener("click", (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target === mobileMenu || target.closest("a")) closeMenu(target === mobileMenu);
    });

    document.addEventListener("keydown", (e) => {
      if (!menuOpen) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key === "Tab") {
        const focusables = $$("a[href], button:not([disabled])", mobileMenu);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 960 && menuOpen) closeMenu(false);
    });
  }

  /* ------------------------------------------------------------------------
     3D tilt + spotlight
     ------------------------------------------------------------------------ */

  if (finePointer && !reduceMotion) {
    $$("[data-tilt]").forEach((el) => {
      const strength = 5.5;

      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const px = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
        const py = Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
        el.style.setProperty("--rx", ((0.5 - py) * strength * 2).toFixed(2) + "deg");
        el.style.setProperty("--ry", ((px - 0.5) * strength * 2).toFixed(2) + "deg");
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });

      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--mx", "50%");
        el.style.setProperty("--my", "0%");
      });
    });

    /* Magnetic buttons */
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * 0.16;
        const y = (e.clientY - rect.top - rect.height / 2) * 0.24;
        el.style.setProperty("--tx", x.toFixed(1) + "px");
        el.style.setProperty("--ty", y.toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--tx", "0px");
        el.style.setProperty("--ty", "0px");
      });
    });
  }

  /* ------------------------------------------------------------------------
     Copy email + toast
     ------------------------------------------------------------------------ */

  const toast = $("#toast");
  const toastMsg = $("#toastMsg");
  let toastTimer = null;

  function showToast(message) {
    if (!toast || !toastMsg) return;
    toastMsg.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        return true;
      } catch (err) {
        return false;
      }
    }
  }

  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      const ok = await copyText(value);
      showToast(ok ? "Email copied — talk soon." : "Copy failed — email is ritikdave9@gmail.com");
    });
  });

  /* ------------------------------------------------------------------------
     Contact form — composes a mailto, no backend
     ------------------------------------------------------------------------ */

  const form = $("#contactForm");
  const formStatus = $("#formStatus");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        if (formStatus) {
          formStatus.textContent = "Some fields need attention before launch.";
          formStatus.classList.add("is-error");
          formStatus.classList.remove("is-ok");
        }
        return;
      }

      const data = new FormData(form);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();

      const subject = "Mission brief from " + name;
      const body = message + "\n\n— " + name + "\n" + email;
      const mailto = "mailto:ritikdave9@gmail.com?subject=" +
        encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);

      if (formStatus) {
        formStatus.textContent = "Transmission queued — opening your mail client…";
        formStatus.classList.add("is-ok");
        formStatus.classList.remove("is-error");
      }

      showToast("Opening your mail client…");
      window.location.href = mailto;

      setTimeout(() => {
        if (formStatus) {
          formStatus.textContent = "Opens your mail client — nothing is stored on this site.";
          formStatus.classList.remove("is-ok", "is-error");
        }
      }, 8000);
    });
  }

  /* ------------------------------------------------------------------------
     Footer — year + IST clock
     ------------------------------------------------------------------------ */

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const clock = $("#clock");
  function updateClock() {
    if (!clock) return;
    try {
      clock.textContent = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(new Date());
    } catch (_) {
      const d = new Date();
      clock.textContent = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    }
  }
  updateClock();
  setInterval(updateClock, 30000);

})();
