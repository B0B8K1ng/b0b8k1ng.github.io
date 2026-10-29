import { registerMedia } from "./media-scheduler.js?v=marslab-gt-v1-20261029";

const root = document.querySelector("#go2-navigation");
const revision = "go2-curated-v2-20261029";
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const t = (en, zh) => document.documentElement.lang.startsWith("zh") ? zh : en;
const localized = (record, key) => document.documentElement.lang.startsWith("zh")
  ? record[`${key}_zh`] || record[key] : record[key];
const asset = (path) => typeof path === "string" && /^assets\/go2\/[a-zA-Z0-9_./-]+$/.test(path) && !path.includes("..") ? path : "";
const mediaAsset = (path) => asset(path) ? `${asset(path)}?v=${revision}` : "";

async function init() {
  if (!root) return;
  const response = await fetch(`content/go2.json?v=${revision}`);
  if (!response.ok) throw new Error(`Go2 comparison: HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.status !== "ready") return;
  const clips = (manifest.clips || []).filter((clip) => clip && asset(clip.video));
  if (!clips.length) return;

  root.innerHTML = `<div class="go2-heading"><div><span id="go2-section-number" class="eyebrow section-number"></span><h2 id="go2-title"></h2></div></div>
    <div class="go2-grid">${clips.map((clip, index) => `<figure class="go2-clip" data-clip="${escape(clip.id || index)}"><div class="go2-screen"><video id="go2-video-${index}" muted loop playsinline preload="none" width="1920" height="1080" disablepictureinpicture disableremoteplayback tabindex="-1"></video><p class="go2-media-error" role="status" hidden></p></div><figcaption><h3></h3></figcaption></figure>`).join("")}</div>`;
  root.hidden = false;
  const cards = [...root.querySelectorAll(".go2-clip")];
  const videos = cards.map((card) => card.querySelector("video"));

  function renderText() {
    root.querySelector("#go2-section-number").textContent = t("03 / REAL WORLD", "03 / 真机");
    root.querySelector("#go2-title").textContent = t("Real-world navigation.", "真实场景导航。");
    cards.forEach((card, index) => {
      const clip = clips[index];
      const title = localized(clip, "title") || clip.id;
      card.querySelector("h3").textContent = title;
      card.querySelector("video").setAttribute("aria-label", `${title} — ${t("recorded robot, model predictions and trajectories", "机器狗真实记录、模型预测与轨迹")}`);
      card.querySelector(".go2-media-error").textContent = t("Video unavailable", "视频暂时无法加载");
    });
  }

  videos.forEach((video, index) => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.loop = true;
    video.playsInline = true;
    const error = cards[index].querySelector(".go2-media-error");
    video.addEventListener("playing", () => { error.hidden = true; });
    video.addEventListener("error", () => { error.hidden = false; });
    registerMedia({
      element: cards[index].querySelector(".go2-screen"), videos: [video],
      sources: [mediaAsset(clips[index].video)],
      posters: [mediaAsset(clips[index].poster)], cost: 3, priority: 1,
    });
  });
  new MutationObserver(renderText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  renderText();
}

init().catch((error) => console.error(error));
