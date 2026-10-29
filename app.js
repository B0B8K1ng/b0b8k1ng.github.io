import { registerMedia } from "./media-scheduler.js?v=timing-method-v1-20261029";
import { setMediaUrl } from "./media-delivery.js?v=timing-method-v1-20261029";
import { initResearch } from "./research.js?v=site-refresh-20261029-v2";
import { initMotionGallery } from "./motion-gallery.js?v=timing-method-v1-20261029";
import { initNavigation } from "./navigation.js?v=timing-method-v1-20261029";
import { initCinematic } from "./cinematic.js?v=timing-method-v1-20261029";
import { initPlayground } from "./playground.js?v=timing-method-v1-20261029";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
$$('img[data-local-src]').forEach((image) => setMediaUrl(image, "src", image.dataset.localSrc));
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
          link.classList.toggle("active", link.hash === `#${["in-motion", "navigation"].includes(entry.target.id) ? "simulation" : entry.target.id}`),
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
// One page-wide scheduler shares bandwidth and decoder capacity.
let datasetMedia = [];
function datasetPlaybackLabel(item) {
  const timing = item.source?.video;
  if (timing?.timing_status === "source_video") return t("1× · source video", "1× · 源视频速度");
  if (timing?.timing_status === "nominal_sampling") return t("≈1× · sampled cadence", "≈1× · 源采样速度");
  return t(`Display rate · ${timing?.playback_fps || "—"} FPS`, `展示速度 · ${timing?.playback_fps || "—"} 帧/秒`);
}
function renderDatasets() {
  datasetMedia.forEach((entry) => entry.unregister());
  datasetMedia = [];
  $("#dataset-grid").innerHTML = orderedDatasets()
    .map(
      (item) =>
        `<article class="dataset-card" data-dataset="${escape(item.id)}"><div class="dataset-card-image"><video data-src="${escape(item.video || "")}" data-poster="${escape(item.image)}" muted loop playsinline preload="none" width="480" height="270" aria-label="${escape(item.name + t(" dataset video", " 数据集视频"))}"></video></div><div class="dataset-card-label"><h3>${escape(item.name)}</h3><span class="source-group">${item.group === "pretraining" ? t("PRETRAIN", "预训练") : t("POST-TRAIN", "后训练")}</span><span class="source-group dataset-playback">${escape(datasetPlaybackLabel(item))}</span></div></article>`,
    )
    .join("");
  datasetMedia = $$("#dataset-grid video").map((video) =>
    registerMedia({ element: video, videos: [video], cost: 1 }),
  );
  let note = $("#dataset-playback-note");
  if (!note) {
    note = document.createElement("p");
    note.id = "dataset-playback-note";
    note.className = "dataset-card-meta";
    $("#dataset-grid").after(note);
  }
  note.textContent = t(
    "NavAnywhere clips follow source-video time. ≈1× uses the recorded sampling cadence; exact capture timestamps are unavailable. RECON uses a 4 FPS display rate because its frame timestamps could not be verified.",
    "NavAnywhere 视频按源时间轴播放。≈1× 表示按已记录的采样频率播放，缺少逐帧采集时间。RECON 的帧时间戳无法核验，采用每秒 4 帧的展示速度。",
  );
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
        const revision = name === "paper" ? "paper-tables12-v1-20261029"
          : name === "demos" ? "mars-pose-v2-20261029" : "dataset-timing-v2-20261029";
        const response = await fetch(`content/${name}.json?v=${revision}`);
        if (!response.ok) throw new Error(`Could not load ${name}`);
        return response.json();
      }),
    );
    research = initResearch(paper, () => language);
    motionGallery = initMotionGallery(demos, () => language);
    navigation = await initNavigation(paper, () => language);
    $("#citation").textContent = paper.citation.bibtex;
    translate();
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
