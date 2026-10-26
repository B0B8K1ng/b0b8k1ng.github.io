const root = document.querySelector("#go2-navigation");
const revision = "third-person-v2-20261026";
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const t = (en, zh) => document.documentElement.lang.startsWith("zh") ? zh : en;
const localized = (record, key) => document.documentElement.lang.startsWith("zh")
  ? record[`${key}_zh`] || record[key] : record[key];
const asset = (path) => typeof path === "string" && /^assets\/go2\/[a-zA-Z0-9_./-]+$/.test(path) && !path.includes("..") ? path : "";
const mediaAsset = (path) => asset(path) ? `${asset(path)}?v=${revision}` : "";
const formatTime = (seconds) => Number.isFinite(seconds)
  ? `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}` : "";
const sceneNames = {
  full: ["Full route", "完整路线"],
  clip_01_office_exit: ["Office exit", "办公室出口"],
  clip_02_corridor: ["Corridor", "走廊"],
  clip_03_corner: ["Corner", "拐角"],
  clip_04_foyer_exit: ["Foyer exit", "门厅出口"],
  clip_05_glass_door: ["Glass door", "玻璃门"],
  clip_06_turnaround: ["Turnaround", "转身"],
  clip_07_return: ["Return", "返回"],
};

async function init() {
  if (!root) return;
  const response = await fetch(`content/go2.json?v=${revision}`);
  if (!response.ok) throw new Error(`Go2 comparison: HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.status !== "ready") return;
  const samples = [manifest.full, ...(manifest.clips || [])].filter((sample) => sample && asset(sample.video));
  if (!samples.length) return;
  let selected = 0;
  let resumeWhenVisible = false;
  let inViewport = false;
  let firstPlay = true;

  root.innerHTML = `<div class="go2-heading"><div><span class="eyebrow" id="go2-eyebrow"></span><h2 id="go2-title"></h2></div><p id="go2-introduction"></p></div>
    <div class="go2-cinema">
      <div class="go2-screen"><video id="go2-video" controls playsinline muted preload="metadata"></video><button class="go2-play" type="button"><span><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 7.5v17l14-8.5z"/></svg><span id="go2-play-label"></span></span></button><p class="go2-media-error" role="status" hidden></p></div>
      <div class="go2-scene-tabs" aria-label="Comparison clips"></div>
      <div class="go2-details"><div class="go2-caption"><h3 id="go2-clip-title"></h3><p id="go2-clip-description"></p><div class="go2-downloads"></div></div><div id="go2-metric-region"></div></div>
    </div><div class="go2-protocol"><div class="go2-protocol-tags"></div><a class="go2-protocol-link" target="_blank" rel="noopener" hidden></a></div><p class="go2-method-note"></p>`;
  root.hidden = false;
  const video = root.querySelector("video");
  const play = root.querySelector(".go2-play");
  const error = root.querySelector(".go2-media-error");
  const tabs = root.querySelector(".go2-scene-tabs");

  function renderMetrics(sample) {
    const metrics = sample.metrics || (sample === manifest.full ? manifest.summary?.metrics : null);
    const region = root.querySelector("#go2-metric-region");
    if (!metrics || !["opennwm", "nwm"].every((model) => Number.isFinite(metrics[model]?.ate_m) && Number.isFinite(metrics[model]?.rpe_m))) {
      region.replaceChildren();
      return;
    }
    const score = (model, key) => {
      const value = metrics[model][key];
      const best = Math.min(metrics.opennwm[key], metrics.nwm[key]);
      return `<td${value === best ? ' class="go2-best"' : ""}>${value.toFixed(3)}</td>`;
    };
    region.innerHTML = `<table class="go2-metrics"><caption>${escape(t("OFFLINE NAVIGATION · LOWER IS BETTER", "离线导航 · 数值越低越好"))}</caption><thead><tr><th scope="col">${escape(t("Model", "模型"))}</th><th scope="col" title="Absolute trajectory error">ATE (m) ↓</th><th scope="col" title="Relative pose error">RPE (m) ↓</th></tr></thead><tbody>${[["opennwm", "OpenNWM"], ["nwm", "NWM"]].map(([key, label]) => `<tr><th scope="row"><span class="go2-model go2-model-${key}">${label}</span></th>${score(key, "ate_m")}${score(key, "rpe_m")}</tr>`).join("")}</tbody></table>`;
  }

  function renderText() {
    const sample = samples[selected];
    root.querySelector("#go2-eyebrow").textContent = t("REAL ROBOT / GO2", "真实机器人 / GO2");
    root.querySelector("#go2-title").textContent = t("Real-world navigation.", "真实场景导航。");
    root.querySelector("#go2-introduction").textContent = t("Follow the robot in third person, with synchronized first-person predictions and planned trajectories.", "以第三视角观察机器狗的真实运动，同步对比第一视角预测与规划轨迹。");
    root.querySelector("#go2-play-label").textContent = t("Play comparison", "播放对比视频");
    video.setAttribute("aria-label", `${localized(sample, "title") || sample.id} — ${t("ground truth and both model rollouts with trajectories", "真实记录、两种模型预测与轨迹对比")}`);
    tabs.setAttribute("aria-label", t("Select comparison clip", "选择对比片段"));
    tabs.innerHTML = samples.map((item, index) => {
      const label = sceneNames[item.id] ? t(...sceneNames[item.id]) : localized(item, "title") || item.id;
      return `<button type="button" class="go2-scene-tab" data-index="${index}" aria-pressed="${index === selected}" aria-label="${escape(localized(item, "title") || item.id)}"><span class="go2-scene-index">${item === manifest.full ? "▶" : String(index + (manifest.full ? 0 : 1)).padStart(2, "0")}</span><span class="go2-scene-text"><strong>${escape(label)}</strong><small>${escape(formatTime(item.duration_s))}</small></span></button>`;
    }).join("");
    root.querySelector("#go2-clip-title").textContent = localized(sample, "title") || sample.id;
    root.querySelector("#go2-clip-description").textContent = localized(sample, "description") || "";
    const downloads = [[sample.video, t("Comparison film", "对比视频")], [sample.downloads?.third_person, t("Third-person GT", "第三视角 GT")], [sample.downloads?.ego, t("Ego GT", "第一视角 GT")], [sample.downloads?.opennwm, "OpenNWM"], [sample.downloads?.nwm, "NWM"]];
    root.querySelector(".go2-downloads").innerHTML = downloads.filter(([path]) => asset(path)).map(([path, label]) => `<a href="${escape(mediaAsset(path))}" target="_blank" rel="noopener">${escape(label)}</a>`).join("");
    renderMetrics(sample);
    const protocol = manifest.protocol || {};
    const labels = [localized(protocol, "evaluation"), protocol.goal_interval_s ? t(`Visual goal every ${protocol.goal_interval_s} s`, `每 ${protocol.goal_interval_s} 秒设置视觉目标`) : null, protocol.planner ? `${protocol.planner} ${t("planning", "规划")}` : null].filter(Boolean);
    root.querySelector(".go2-protocol-tags").innerHTML = labels.map((label) => `<span>${escape(label)}</span>`).join("");
    const report = root.querySelector(".go2-protocol-link");
    report.hidden = !asset(manifest.report);
    if (!report.hidden) { report.href = mediaAsset(manifest.report); report.textContent = t("Evaluation details ↗", "评测详情 ↗"); }
    root.querySelector(".go2-method-note").textContent = localized(protocol, "note") || "";
    error.textContent = t("The film could not be loaded. Open the comparison film link below to retry.", "视频暂时无法加载，请通过下方对比视频链接重新打开。");
  }

  function select(index) {
    const wasPlaying = !video.paused;
    selected = index;
    resumeWhenVisible = false;
    const sample = samples[selected];
    video.pause();
    video.src = mediaAsset(sample.video);
    if (asset(sample.poster)) video.poster = mediaAsset(sample.poster); else video.removeAttribute("poster");
    error.hidden = true;
    play.hidden = !firstPlay;
    video.load();
    renderText();
    if (wasPlaying) video.play().catch(() => { play.hidden = false; });
  }

  play.addEventListener("click", () => {
    video.play().then(() => { firstPlay = false; play.hidden = true; }).catch(() => { error.hidden = false; });
  });
  video.addEventListener("play", () => { firstPlay = false; play.hidden = true; error.hidden = true; });
  video.addEventListener("error", () => { error.hidden = false; play.hidden = true; });
  tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button) return;
    const index = Number(button.dataset.index);
    if (index !== selected) { select(index); tabs.querySelector(`[data-index="${index}"]`)?.focus({ preventScroll: true }); }
  });
  function updateVisibility() {
    if (document.hidden || !inViewport) {
      if (!video.paused) { resumeWhenVisible = true; video.pause(); }
    } else if (resumeWhenVisible) {
      resumeWhenVisible = false;
      video.play().catch(() => {});
    }
  }
  new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; updateVisibility(); }, { threshold: 0.05 }).observe(video);
  document.addEventListener("visibilitychange", updateVisibility);
  new MutationObserver(renderText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  select(0);
}

init().catch((error) => console.error(error));
