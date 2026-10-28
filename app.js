import { initResearch } from "./research.js?v=all-results-v1-20261028";
import { initMotionGallery } from "./motion-gallery.js?v=main-figure-v8-20261010";
import { initNavigation } from "./navigation.js?v=main-figure-v8-20261010";
import { initCinematic } from "./cinematic.js?v=hero-autoplay-v1-20261028";
import { initPlayground } from "./playground.js?v=main-figure-v8-20261010";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const motion = matchMedia("(prefers-reduced-motion: reduce)");
let language = "en";
const t = (en, zh) => (language === "zh" ? zh : en);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
let research, datasets, demos, paper, cinematic, playground, motionGallery, navigation;

function translate() {
  document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  $$("[data-en][data-zh]").forEach((node) => {
    node.textContent = node.dataset[language];
  });
  $("#language").textContent = language === "zh" ? "EN" : "中文";
  $("#language").setAttribute(
    "aria-label",
    t("Switch to Chinese", "Switch to English"),
  );
  cinematic?.render();
  playground?.render();
  if (!datasets) return;
  motionGallery?.render();
  navigation?.render();
  renderDatasets();
  research.render();
}
$("#language").addEventListener("click", () => {
  language = language === "en" ? "zh" : "en";
  translate();
});
translate();

// Navigation remains usable before the content finishes loading.
function closeMenu() {
  $(".site-header").classList.remove("menu-open");
  $("#mobile-menu").setAttribute("aria-expanded", "false");
}
$("#mobile-menu").addEventListener("click", () => {
  const open = $(".site-header").classList.toggle("menu-open");
  $("#mobile-menu").setAttribute("aria-expanded", String(open));
});
$$(".desktop-nav a").forEach((link) =>
  link.addEventListener("click", closeMenu),
);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
const navObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        $$(".desktop-nav a").forEach((link) =>
          link.classList.toggle("active", link.hash === `#${entry.target.id}`),
        );
      }
  },
  { rootMargin: "-15% 0px -55% 0px" },
);
$$("main section[id]").forEach((section) => navObserver.observe(section));
if (!motion.matches) {
  document.documentElement.classList.add("js-motion");
  const reveal = new IntersectionObserver(
    (entries, observer) => {
      entries
        .filter((entry) => entry.isIntersecting)
        .forEach((entry) => {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
    },
    { threshold: 0.1 },
  );
  $$(".reveal").forEach((node) => reveal.observe(node));
}

// Background footage is a dataset sample, not a model prediction.
const hero = $("#hero-video");
hero.autoplay = true;
hero.muted = true;
hero.defaultMuted = true;
hero.loop = true;
hero.playsInline = true;
hero.controls = false;
let heroVisible = true;
function updateHero() {
  if (heroVisible && !document.hidden)
    hero.play().catch(() => {});
  else hero.pause();
}
hero.addEventListener("loadedmetadata", updateHero);
hero.addEventListener("canplay", updateHero);
new IntersectionObserver(
  ([entry]) => {
    heroVisible = entry.isIntersecting;
    updateHero();
  },
  { threshold: 0.05 },
).observe(hero);
document.addEventListener("visibilitychange", updateHero);
window.addEventListener("pageshow", updateHero);
// Retry if browser policy deferred autoplay until a user interaction.
function retryHeroPlayback() {
  if (hero.paused) updateHero();
}
document.addEventListener("pointerdown", retryHeroPlayback, { passive: true });
document.addEventListener("keydown", retryHeroPlayback);
updateHero();

// Every source is shown directly; the small tag identifies its training stage.
const featured = [
  "walking-tours",
  "botanic-garden",
  "dl3dv",
  "citywalker",
  "realestate10k",
  "rover",
  "i2nav-robot",
  "ego4d",
];
function orderedDatasets() {
  return [...datasets.datasets].sort((a, b) => {
    const rank = (item) =>
      featured.includes(item.id)
        ? featured.indexOf(item.id)
        : featured.length + datasets.datasets.indexOf(item);
    return rank(a) - rank(b);
  });
}
// Load card videos only near the viewport; play only visible previews.
const visibleDatasetVideos = new Set();
function updateDatasetVideos() {
  $$("#dataset-grid video").forEach((video) => {
    const shouldPlay = visibleDatasetVideos.has(video) && !document.hidden;
    if (shouldPlay) video.play().catch(() => {});
    else video.pause();
  });
}
const datasetPreloadObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    const video = entry.target;
    if (!video.src && video.dataset.src) {
      video.src = video.dataset.src;
      video.load();
    }
    datasetPreloadObserver.unobserve(video);
  }
}, { rootMargin: "220px 0px" });
const datasetPlaybackObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) visibleDatasetVideos.add(entry.target);
    else visibleDatasetVideos.delete(entry.target);
  }
  updateDatasetVideos();
}, { threshold: 0.15 });
document.addEventListener("visibilitychange", updateDatasetVideos);
window.addEventListener("pageshow", updateDatasetVideos);
document.addEventListener("pointerdown", updateDatasetVideos, { passive: true });
document.addEventListener("keydown", updateDatasetVideos);
function renderDatasets() {
  $$("#dataset-grid video").forEach((video) => video.pause());
  datasetPreloadObserver.disconnect();
  datasetPlaybackObserver.disconnect();
  visibleDatasetVideos.clear();
  $("#dataset-grid").innerHTML = orderedDatasets()
    .map(
      (item) =>
        `<article class="dataset-card" data-dataset="${escape(item.id)}"><div class="dataset-card-image"><video data-src="${escape(item.video || "")}" poster="${escape(item.image)}" autoplay muted loop playsinline preload="none" width="480" height="270" aria-label="${escape(item.name + t(" dataset video", " 数据集视频"))}"></video></div><div class="dataset-card-label"><h3>${escape(item.name)}</h3><span class="source-group">${item.group === "pretraining" ? t("PRETRAIN", "预训练") : t("POST-TRAIN", "后训练")}</span></div></article>`,
    )
    .join("");
  $$("#dataset-grid video").forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.addEventListener("loadeddata", updateDatasetVideos);
    video.addEventListener("canplay", updateDatasetVideos);
    datasetPreloadObserver.observe(video);
    datasetPlaybackObserver.observe(video);
  });
}
$("#copy-citation").addEventListener("click", async () => {
  const citation = $("#citation").textContent;
  try {
    if (navigator.clipboard && window.isSecureContext)
      await navigator.clipboard.writeText(citation);
    else {
      const textarea = document.createElement("textarea");
      textarea.value = citation;
      textarea.style.cssText = "position:fixed;left:-9999px";
      document.body.append(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("Copy unavailable");
    }
    $("#citation-status").textContent = t("BibTeX copied.", "BibTeX 已复制。");
  } catch {
    $("#citation-status").textContent = t(
      "Select the citation text to copy it.",
      "请选择引用文本并复制。",
    );
  }
});

async function init() {
  try {
    [datasets, demos, paper] = await Promise.all(
      ["datasets", "demos", "paper"].map(async (name) => {
        const response = await fetch(`content/${name}.json?v=main-figure-v8-20261010`);
        if (!response.ok) throw new Error(`Could not load ${name}`);
        return response.json();
      }),
    );
    research = initResearch(paper, () => language);
    motionGallery = initMotionGallery(demos, () => language);
    navigation = await initNavigation(paper, () => language);
    $("#citation").textContent = paper.citation.bibtex;
    translate();
    updateHero();
  } catch (error) {
    const message = t(
      "Interactive content could not load. Serve this folder with a local HTTP server and reload.",
      "交互内容加载失败。请通过本地 HTTP 服务打开网页并刷新。",
    );
    $("#page-status").textContent = message;
    console.error(error);
  }
}
init();
initCinematic(() => language).then((instance) => { cinematic = instance; });
initPlayground(() => language).then((instance) => { playground = instance; });
