/* Knightcat
   ca: paste a real contract (0x + 40 hex) to turn on Buy, Swap, and the chart.
   twitter: paste a full profile URL to point every X control at it.
   Telegram is omitted — no Telegram link was provided.
*/
const SITE = {
  ca: "0x8cf263adfd88d72597a251908378a782a4e97aaf",
  twitter: "https://x.com/knightcat_rh",
};

const CHAIN = "robinhood";

function isRealCa(value) {
  return /^0x[a-fA-F0-9]{40}$/.test((value || "").trim());
}

function setExternal(node, url) {
  if (!node || !url) return;
  node.href = url;
  node.target = "_blank";
  node.rel = "noopener noreferrer";
}

function showCopied(button) {
  const label = button.querySelector(".copy-label");
  if (!label) return;
  const original = button.dataset.label || label.textContent;
  button.dataset.label = original;
  label.textContent = "Copied!";
  button.classList.add("is-copied");
  window.clearTimeout(button.copyTimer);
  button.copyTimer = window.setTimeout(() => {
    label.textContent = original;
    button.classList.remove("is-copied");
  }, 1600);
}

function fallbackCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch (error) {
    ok = false;
  }
  area.remove();
  return ok;
}

function copyText(text, button) {
  const finish = () => showCopied(button);
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(finish).catch(() => {
      if (fallbackCopy(text)) finish();
    });
    return;
  }
  if (fallbackCopy(text)) finish();
}

function applySite() {
  const ca = (SITE.ca || "").trim();
  const real = isRealCa(ca);
  const display = real ? ca : "TBA";

  document.querySelectorAll("[data-ca]").forEach((node) => {
    node.textContent = display;
  });

  document.querySelectorAll("[data-ca-pending]").forEach((node) => {
    node.hidden = real;
  });
  document.querySelectorAll("[data-ca-live]").forEach((node) => {
    node.hidden = !real;
  });

  if (real) {
    const buyUrl = `https://app.uniswap.org/swap?chain=${CHAIN}&outputCurrency=${ca}`;
    const chartUrl = `https://dexscreener.com/${CHAIN}/${ca}`;
    document.querySelectorAll("[data-buy]").forEach((node) => setExternal(node, buyUrl));
    document.querySelectorAll("[data-chart-link]").forEach((node) => setExternal(node, chartUrl));

    const frame = document.querySelector("[data-chart-frame]");
    if (frame) {
      const iframe = document.createElement("iframe");
      iframe.src = `${chartUrl}?embed=1&theme=dark&trades=0&info=0`;
      iframe.title = "Knightcat live chart on DexScreener";
      iframe.loading = "lazy";
      iframe.allowFullscreen = true;
      frame.classList.remove("is-placeholder");
      frame.replaceChildren(iframe);
    }
  }

  const twitter = (SITE.twitter || "").trim();
  if (twitter) {
    document.querySelectorAll("[data-twitter]").forEach((node) => setExternal(node, twitter));
  }
}

function initNav() {
  const nav = document.querySelector("#nav");
  const toggle = document.querySelector("#nav-toggle");
  const menu = document.querySelector("#nav-menu");
  if (!nav || !toggle || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };

  toggle.addEventListener("click", () => {
    setOpen(!menu.classList.contains("is-open"));
  });

  menu.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });

  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const links = [...document.querySelectorAll(".nav-link")];
  const sections = links
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter((section, index, list) => section && list.indexOf(section) === index);

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = `#${entry.target.id}`;
        links.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === id);
        });
      });
    },
    { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
}

function initMotion() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const nodes = document.querySelectorAll(".info-card, .highlight, .chart-frame, .social-card");
  if (!nodes.length) return;

  nodes.forEach((node, index) => {
    node.classList.add("reveal");
    node.style.animationDelay = `${(index % 4) * 0.08}s`;
  });

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        entry.target.addEventListener(
          "animationend",
          () => entry.target.classList.add("is-shown"),
          { once: true }
        );
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.16 }
  );

  nodes.forEach((node) => observer.observe(node));
}

function initSwordCursor() {
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("has-sword");

  const sword = document.createElement("div");
  sword.className = "sword-cursor";
  sword.setAttribute("aria-hidden", "true");
  sword.innerHTML = `
    <svg viewBox="0 0 64 64" width="48" height="48">
      <defs>
        <linearGradient id="sword-blade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#f7fbff"/>
          <stop offset="0.5" stop-color="#c5d0dc"/>
          <stop offset="1" stop-color="#8e9aab"/>
        </linearGradient>
      </defs>
      <polygon points="2,2 10,6 30,38 24,40" fill="url(#sword-blade)"/>
      <polygon points="2,2 6,3.5 27,37 24,40" fill="#ffffff" opacity="0.55"/>
      <polygon points="16,30 36,40 33,45 14,35" fill="#c6a36a"/>
      <polygon points="18,32 34,40 32,43 17,35" fill="#e7c98a"/>
      <polygon points="26,42 31,45 40,58 35,56" fill="#6a4632"/>
      <polygon points="27,44 29.5,45.5 37,56 35,55" fill="#8a5a3c"/>
      <circle cx="41" cy="60" r="3.4" fill="#e892a8"/>
      <circle cx="40" cy="59" r="1.2" fill="#fff" opacity="0.85"/>
    </svg>`;
  document.body.appendChild(sword);

  const canvas = document.createElement("canvas");
  canvas.className = "spark-field";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const sparks = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let visible = false;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const placeSword = (x, y) => {
    sword.style.transform = `translate3d(${x - 2}px, ${y - 2}px, 0)`;
  };

  const emit = (x, y, count, speed) => {
    if (reduce) return;
    for (let i = 0; i < count; i += 1) {
      sparks.push({
        x: x + 30 + Math.random() * 8,
        y: y + 42 + Math.random() * 8,
        vx: 0.35 + Math.random() * speed,
        vy: 0.45 + Math.random() * speed,
        life: 1,
        size: 1.2 + Math.random() * 2.1,
        gold: Math.random() > 0.42,
        spin: Math.random() * Math.PI,
      });
    }
    if (sparks.length > 90) sparks.splice(0, sparks.length - 90);
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    for (let i = sparks.length - 1; i >= 0; i -= 1) {
      const spark = sparks[i];
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vx *= 0.98;
      spark.vy *= 0.98;
      spark.life -= 0.018;
      spark.spin += 0.15;
      if (spark.life <= 0) {
        sparks.splice(i, 1);
        continue;
      }
      const alpha = spark.life;
      const color = spark.gold ? "246, 212, 150" : "246, 196, 209";
      ctx.globalAlpha = alpha;
      ctx.fillStyle = `rgba(${color}, 1)`;
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.size * (0.4 + spark.life), 0, Math.PI * 2);
      ctx.fill();
      if (spark.life > 0.45) {
        const arm = 2.2 + spark.size;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(spark.x - Math.cos(spark.spin) * arm, spark.y - Math.sin(spark.spin) * arm);
        ctx.lineTo(spark.x + Math.cos(spark.spin) * arm, spark.y + Math.sin(spark.spin) * arm);
        ctx.moveTo(spark.x - Math.cos(spark.spin + 1.2) * arm, spark.y - Math.sin(spark.spin + 1.2) * arm);
        ctx.lineTo(spark.x + Math.cos(spark.spin + 1.2) * arm, spark.y + Math.sin(spark.spin + 1.2) * arm);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
    window.requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => {
    visible = true;
    sword.style.opacity = "1";
    placeSword(event.clientX, event.clientY);
    emit(event.clientX, event.clientY, 2, 0.9);
  });
  window.addEventListener("mousedown", (event) => {
    emit(event.clientX, event.clientY, 12, 2.4);
  });
  document.addEventListener("mouseleave", () => {
    visible = false;
    sword.style.opacity = "0";
  });
  document.addEventListener("mouseenter", (event) => {
    if (!visible) return;
    sword.style.opacity = "1";
    placeSword(event.clientX, event.clientY);
  });

  window.requestAnimationFrame(draw);
}

applySite();
initNav();
initMotion();
initSwordCursor();

document.addEventListener("click", (event) => {
  const dead = event.target.closest("a[href='#']");
  if (dead) event.preventDefault();

  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const value = (document.querySelector("[data-ca]")?.textContent || "TBA").trim();
  copyText(value, button);
});
