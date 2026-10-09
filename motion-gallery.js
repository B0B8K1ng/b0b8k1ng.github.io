const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

// A single scale preserves the recorded path; up is the initial heading.
function projectTrajectory(positions) {
  const points = positions.map(([forward, left]) => [-left, -forward]);
  const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(92 / Math.max(maxX - minX, .001), 176 / Math.max(maxY - minY, .001));
  return points.map(([x, y]) => [66 + (x - (minX + maxX) / 2) * scale, 112 + (y - (minY + maxY) / 2) * scale]);
}

/** Synchronized GT/OpenNWM wipe comparisons with their recorded input paths. */
export function initMotionGallery(demos, getLanguage) {
  const root = document.querySelector("#motion-gallery");
  if (!root) return { render() {} };
  const t = (en, zh) => getLanguage() === "zh" ? zh || en : en;
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let globallyPaused = reducedMotion.matches;
  const items = [];
  root.innerHTML = '<div class="motion-gallery-toolbar"><button type="button" class="motion-gallery-toggle"></button></div><div class="motion-gallery-grid"></div>';
  const grid = root.querySelector(".motion-gallery-grid");
  const toggle = root.querySelector(".motion-gallery-toggle");
  const playIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 11 7-11 7Z"/></svg>';
  const pauseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';

  function updateButton(item) {
    const label = item.playing ? t("Pause", "暂停") : t("Play", "播放");
    item.button.innerHTML = item.playing ? pauseIcon : playIcon;
    item.button.setAttribute("aria-label", `${label} · ${t(item.demo.title, item.demo.titleZh)}`);
    item.button.setAttribute("aria-pressed", String(item.playing));
  }
  function updateTrajectory(item) {
    const time = item.leader.getAttribute("src") ? item.leader.currentTime : item.demo.posterTime || 0;
    const index = Math.min(item.points.length - 1, Math.max(0, Math.floor(time * item.demo.fps + .001)));
    const [x, y] = item.points[index];
    item.cursor.setAttribute("cx", x.toFixed(3));
    item.cursor.setAttribute("cy", y.toFixed(3));
    item.progress.setAttribute("points", item.points.slice(0, index + 1).map((point) => point.join(",")).join(" "));
  }
  function updateWipe(item) {
    const value = Number(item.slider.value);
    item.comparison.style.setProperty("--wipe", `${value}%`);
    item.slider.setAttribute("aria-valuetext", t(`Ground truth ${value}%, OpenNWM ${100 - value}%`, `真实画面 ${value}%，OpenNWM ${100 - value}%`));
  }
  function pause(item) {
    item.generation++;
    item.playing = false;
    item.videos.forEach((video) => video.pause());
    updateButton(item);
  }
  async function play(item, restart = false) {
    if (item.playing || document.hidden || !item.visible) return;
    const generation = ++item.generation;
    item.videos.forEach((video) => {
      if (!video.getAttribute("src")) {
        video.src = video.dataset.source;
        video.preload = "auto";
        video.load();
      }
      if (restart || video.ended) video.currentTime = 0;
      else if (video !== item.leader && video.readyState >= 1) video.currentTime = item.leader.currentTime;
    });
    updateTrajectory(item);
    item.playing = true;
    updateButton(item);
    const results = await Promise.allSettled(item.videos.map((video) => video.play()));
    if (generation !== item.generation) return;
    if (results.some((result) => result.status === "rejected")) pause(item);
  }
  function resumeVisible() {
    items.forEach((item) => {
      if (globallyPaused || item.userPaused || !item.visible || document.hidden) pause(item);
      else play(item);
    });
  }

  for (const demo of demos.demos) {
    const positions = demo.conditioningTrajectory?.positions;
    if (!Array.isArray(positions) || positions.length !== demo.frameCount) continue;
    const points = projectTrajectory(positions);
    const card = document.createElement("article");
    card.className = "motion-card";
    card.dataset.demo = demo.id;
    const video = (key) => `<video data-model="${key}" muted playsinline preload="none" width="${Number(demo.width) || 224}" height="${Number(demo.height) || 224}" data-source="${escape(demo[key])}" poster="${escape(demo[`${key}Poster`] || demo.poster)}"></video>`;
    card.innerHTML = `<header class="motion-card-heading"><h3 id="motion-title-${escape(demo.id)}"></h3><button type="button" class="motion-card-toggle"></button></header><div class="motion-card-media"><div class="motion-comparison" style="--wipe:50%"><div class="motion-video-layer motion-prediction-layer">${video("prediction")}<span class="motion-video-label motion-label-prediction">OpenNWM</span></div><div class="motion-video-layer motion-truth-layer">${video("gt")}<span class="motion-video-label motion-label-gt"></span></div><div class="motion-wipe-handle" aria-hidden="true"><span>‹ ›</span></div><input class="motion-wipe-input" type="range" min="0" max="100" step="1" value="50"></div><figure class="motion-trajectory"><svg viewBox="0 0 132 224" role="img"><path class="motion-path-grid" d="M22 0v224M44 0v224M66 0v224M88 0v224M110 0v224M0 28h132M0 56h132M0 84h132M0 112h132M0 140h132M0 168h132M0 196h132"/><polyline class="motion-path-full" points="${points.map((point) => point.join(",")).join(" ")}"/><polyline class="motion-path-progress"/><circle class="motion-path-start" cx="${points[0][0]}" cy="${points[0][1]}" r="4"/><circle class="motion-path-cursor" r="5"/></svg><figcaption></figcaption></figure></div>`;
    card.setAttribute("aria-labelledby", `motion-title-${demo.id}`);
    grid.append(card);
    const leader = card.querySelector('[data-model="gt"]');
    const item = {
      demo, card, points, leader, button: card.querySelector("button"),
      videos: [leader, card.querySelector('[data-model="prediction"]')],
      comparison: card.querySelector(".motion-comparison"), slider: card.querySelector("input"),
      cursor: card.querySelector(".motion-path-cursor"), progress: card.querySelector(".motion-path-progress"),
      visible: false, playing: false, userPaused: false, generation: 0,
    };
    item.videos.forEach((element) => { element.muted = true; });
    item.slider.addEventListener("input", () => updateWipe(item));
    item.button.addEventListener("click", () => {
      if (item.playing) { item.userPaused = true; pause(item); }
      else { item.userPaused = false; play(item); }
    });
    leader.addEventListener("timeupdate", () => {
      updateTrajectory(item);
      if (!item.playing || leader.seeking || leader.ended) return;
      const prediction = item.videos[1];
      if (prediction.readyState >= 2 && !prediction.seeking && Math.abs(prediction.currentTime - leader.currentTime) > .18) prediction.currentTime = leader.currentTime;
    });
    leader.addEventListener("seeked", () => updateTrajectory(item));
    leader.addEventListener("ended", () => {
      const shouldLoop = item.playing;
      pause(item);
      if (shouldLoop) play(item, true);
    });
    item.videos.forEach((element) => element.addEventListener("error", () => pause(item)));
    updateTrajectory(item);
    items.push(item);
  }
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const item = items.find((candidate) => candidate.card === entry.target);
      item.visible = entry.isIntersecting && entry.intersectionRatio >= .15;
      if (!item.visible) pause(item);
      else if (!globallyPaused && !item.userPaused) play(item);
    }
  }, { threshold: [0, .15] });
  items.forEach((item) => observer.observe(item.card));
  function render() {
    toggle.textContent = globallyPaused ? t("Play all", "全部播放") : t("Pause all", "全部暂停");
    toggle.setAttribute("aria-pressed", String(!globallyPaused));
    items.forEach((item) => {
      const title = t(item.demo.title, item.demo.titleZh);
      item.card.querySelector("h3").textContent = title;
      item.card.querySelector(".motion-label-gt").textContent = t("Ground truth", "真实画面");
      item.card.querySelector("figcaption").textContent = t("Recorded path", "真实轨迹");
      item.card.querySelector(".motion-trajectory svg").setAttribute("aria-label", t(`Recorded conditioning path for ${title}. The dot follows the current video frame.`, `${title}的真实条件轨迹，圆点对应当前视频帧。`));
      item.slider.setAttribute("aria-label", t(`Compare Ground truth and OpenNWM: ${title}`, `滑动对比真实画面与 OpenNWM：${title}`));
      item.videos.forEach((element) => element.setAttribute("aria-label", `${title} · ${element.dataset.model === "gt" ? t("Ground truth", "真实画面") : "OpenNWM"}`));
      updateWipe(item);
      updateButton(item);
    });
  }
  toggle.addEventListener("click", () => {
    globallyPaused = !globallyPaused;
    if (!globallyPaused) items.forEach((item) => { item.userPaused = false; });
    resumeVisible();
    render();
  });
  document.addEventListener("visibilitychange", resumeVisible);
  reducedMotion.addEventListener("change", () => {
    globallyPaused = reducedMotion.matches;
    resumeVisible();
    render();
  });
  render();
  return { render };
}
