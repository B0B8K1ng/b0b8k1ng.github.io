const root = document.querySelector("#go2-navigation");
const revision = "grid-v3-20261027";
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
  const episodes = [...new Set(clips.map((clip) => clip.episode || manifest.episode_id || "recording"))];

  root.innerHTML = `<div class="go2-heading"><div><span class="eyebrow" id="go2-eyebrow"></span><h2 id="go2-title"></h2></div><div class="go2-heading-meta"><span class="go2-mode"></span><a class="go2-report" target="_blank" rel="noopener" hidden></a></div></div>
    <div class="go2-grid">${clips.map((clip, index) => `<figure class="go2-clip" data-clip="${escape(clip.id || index)}"><div class="go2-screen"><video id="go2-video-${index}" autoplay muted loop playsinline preload="metadata" disablepictureinpicture disableremoteplayback tabindex="-1"></video><p class="go2-media-error" role="status" hidden></p></div><figcaption><div class="go2-clip-heading"><h3></h3><a class="go2-download" target="_blank" rel="noopener"></a></div><p class="go2-clip-meta"></p></figcaption></figure>`).join("")}</div>`;
  root.hidden = false;
  const cards = [...root.querySelectorAll(".go2-clip")];
  const videos = cards.map((card) => card.querySelector("video"));
  const pending = new Set();
  const playingAttempts = new WeakSet();

  function tryPlay(video) {
    if (document.hidden || !video.paused || playingAttempts.has(video)) return;
    video.muted = true;
    playingAttempts.add(video);
    const attempt = video.play();
    if (attempt) {
      attempt.then(() => pending.delete(video)).catch(() => pending.add(video))
        .finally(() => playingAttempts.delete(video));
    } else {
      playingAttempts.delete(video);
    }
  }
  function retryPending() { pending.forEach(tryPlay); }

  function renderText() {
    root.querySelector("#go2-eyebrow").textContent = t("REAL ROBOT / GO2", "真实机器人 / GO2");
    root.querySelector("#go2-title").textContent = t("Real-world navigation.", "真实场景导航。");
    root.querySelector(".go2-mode").textContent = t("Offline planning", "离线规划");
    const report = root.querySelector(".go2-report");
    report.hidden = !asset(manifest.report);
    if (!report.hidden) { report.href = mediaAsset(manifest.report); report.textContent = t("Report ↗", "报告 ↗"); }
    cards.forEach((card, index) => {
      const clip = clips[index];
      const title = localized(clip, "title") || clip.id;
      const episode = episodes.indexOf(clip.episode || manifest.episode_id || "recording") + 1;
      card.querySelector("h3").textContent = title;
      const details = [t(`Route ${String(episode).padStart(2, "0")}`, `轨迹 ${String(episode).padStart(2, "0")}`)];
      if (Number.isFinite(clip.duration_s)) details.push(t(`${clip.duration_s} s`, `${clip.duration_s} 秒`));
      card.querySelector(".go2-clip-meta").textContent = details.join(" · ");
      const link = card.querySelector(".go2-download");
      link.href = mediaAsset(clip.video);
      link.textContent = t("Video ↗", "视频 ↗");
      link.setAttribute("aria-label", t(`Open ${title} video`, `打开${title}视频`));
      card.querySelector("video").setAttribute("aria-label", `${title} — ${t("recorded robot, model predictions and trajectories", "机器狗真实记录、模型预测与轨迹")}`);
      card.querySelector(".go2-media-error").textContent = t("Video unavailable", "视频暂时无法加载");
    });
  }

  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) tryPlay(entry.target);
  }), { threshold: 0.01 });
  videos.forEach((video, index) => {
    video.muted = true;
    video.defaultMuted = true;
    video.controls = false;
    video.loop = true;
    video.playsInline = true;
    video.src = mediaAsset(clips[index].video);
    if (asset(clips[index].poster)) video.poster = mediaAsset(clips[index].poster);
    const error = cards[index].querySelector(".go2-media-error");
    video.addEventListener("canplay", () => tryPlay(video));
    video.addEventListener("playing", () => { pending.delete(video); error.hidden = true; });
    video.addEventListener("error", () => { pending.delete(video); error.hidden = false; });
    observer.observe(video);
    tryPlay(video);
  });
  document.addEventListener("visibilitychange", () => { if (!document.hidden) videos.forEach(tryPlay); });
  window.addEventListener("pageshow", () => videos.forEach(tryPlay));
  document.addEventListener("pointerdown", retryPending, { passive: true });
  document.addEventListener("keydown", retryPending);
  new MutationObserver(renderText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  renderText();
}

init().catch((error) => console.error(error));
