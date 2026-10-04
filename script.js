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

applySite();
initNav();

document.addEventListener("click", (event) => {
  const dead = event.target.closest("a[href='#']");
  if (dead) event.preventDefault();

  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const value = (document.querySelector("[data-ca]")?.textContent || "TBA").trim();
  copyText(value, button);
});
