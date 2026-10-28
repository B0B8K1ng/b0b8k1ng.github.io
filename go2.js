const root = document.querySelector("#go2-navigation");
const revision = "go2-arrows-v2-20261028";
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

  root.innerHTML = `<div class="go2-heading"><h2 id="go2-title"></h2></div>
    <div class="go2-grid">${clips.map((clip, index) => `<figure class="go2-clip" data-clip="${escape(clip.id || index)}"><div class="go2-screen"><video id="go2-video-${index}" autoplay muted loop playsinline preload="metadata" disablepictureinpicture disableremoteplayback tabindex="-1"></video><p class="go2-media-error" role="status" hidden></p></div><figcaption><h3></h3></figcaption></figure>`).join("")}</div>`;
  root.hidden = false;
  const cards = [...root.querySelectorAll(".go2-clip")];
  const videos = cards.map((card) => card.querySelector("video"));
  const pending = new Set();
  const nearbyVideos = new Set();
  const playingAttempts = new WeakSet();

  function tryPlay(video) {
    if (document.hidden || !nearbyVideos.has(video) || !video.getAttribute("src") || !video.paused || playingAttempts.has(video)) return;
    video.muted = true;
    playingAttempts.add(video);
    const attempt = video.play();
    if (attempt) {
      attempt.then(() => pending.delete(video)).catch(() => {
        if (!document.hidden && nearbyVideos.has(video)) pending.add(video);
      })
        .finally(() => playingAttempts.delete(video));
    } else {
      playingAttempts.delete(video);
    }
  }
  function updateVideo(video) {
    if (document.hidden || !nearbyVideos.has(video)) {
      pending.delete(video);
      video.pause();
    } else tryPlay(video);
  }
  function retryPending() { pending.forEach(tryPlay); }

  function renderText() {
    root.querySelector("#go2-title").textContent = t("Real-world navigation.", "真实场景导航。");
    cards.forEach((card, index) => {
      const clip = clips[index];
      const title = localized(clip, "title") || clip.id;
      card.querySelector("h3").textContent = title;
      card.querySelector("video").setAttribute("aria-label", `${title} — ${t("recorded robot, model predictions and trajectories", "机器狗真实记录、模型预测与轨迹")}`);
      card.querySelector(".go2-media-error").textContent = t("Video unavailable", "视频暂时无法加载");
    });
  }

  // Keep every card in the layout, but only fetch and decode nearby clips.
  const preloadObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const video = entry.target;
    if (!video.getAttribute("src")) {
      video.src = video.dataset.src;
      video.load();
    }
    preloadObserver.unobserve(video);
    updateVideo(video);
  }), { rootMargin: "600px 0px" });
  const playbackObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) nearbyVideos.add(entry.target);
    else nearbyVideos.delete(entry.target);
    updateVideo(entry.target);
  }), { rootMargin: "120px 0px", threshold: 0.01 });
  videos.forEach((video, index) => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.loop = true;
    video.playsInline = true;
    video.dataset.src = mediaAsset(clips[index].video);
    if (asset(clips[index].poster)) video.poster = mediaAsset(clips[index].poster);
    const error = cards[index].querySelector(".go2-media-error");
    video.addEventListener("canplay", () => updateVideo(video));
    video.addEventListener("play", () => {
      if (document.hidden || !nearbyVideos.has(video)) video.pause();
    });
    video.addEventListener("playing", () => { pending.delete(video); error.hidden = true; });
    video.addEventListener("error", () => { pending.delete(video); error.hidden = false; });
    preloadObserver.observe(video);
    playbackObserver.observe(video);
  });
  document.addEventListener("visibilitychange", () => videos.forEach(updateVideo));
  window.addEventListener("pageshow", () => videos.forEach(updateVideo));
  document.addEventListener("pointerdown", retryPending, { passive: true });
  document.addEventListener("keydown", retryPending);
  new MutationObserver(renderText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  renderText();
}

init().catch((error) => console.error(error));
