const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function trajectoryGraphic(sample, t) {
  const all = [...sample.reference_xy_m, ...sample.planned_xy_m];
  const xs = all.map(([x]) => x);
  const ys = all.map(([, y]) => y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(320 / Math.max(maxX - minX, 0.1), 124 / Math.max(maxY - minY, 0.1));
  const left = (360 - (maxX - minX) * scale) / 2;
  const top = (152 - (maxY - minY) * scale) / 2;
  const point = ([x, y]) => [left + (x - minX) * scale, top + (maxY - y) * scale];
  const points = (path) => path.map((p) => point(p).map((n) => n.toFixed(2)).join(",")).join(" ");
  const start = point(sample.reference_xy_m[0]);
  const goal = point(sample.reference_xy_m.at(-1));
  const length = maxX - minX;
  const barMeters = 10 ** Math.floor(Math.log10(Math.max(length / 3, 0.01)));
  return `<svg class="navigation-path" viewBox="0 0 360 174" role="img" data-points="${escapeHTML(JSON.stringify(sample.planned_xy_m.map(point)))}" aria-label="${escapeHTML(t("OpenNWM planned path and recorded reference, equal scale in meters", "OpenNWM 规划轨迹与记录参考轨迹，等比例米制坐标"))}">
    <polyline class="navigation-reference" points="${points(sample.reference_xy_m)}"/>
    <polyline class="navigation-planned" points="${points(sample.planned_xy_m)}"/>
    <polyline class="navigation-progress" points="${points(sample.planned_xy_m.slice(0, 1))}"/>
    <circle class="navigation-start" cx="${start[0]}" cy="${start[1]}" r="3.5"/>
    <circle class="navigation-goal" cx="${goal[0]}" cy="${goal[1]}" r="4.5"/>
    <circle class="navigation-cursor" cx="${start[0]}" cy="${start[1]}" r="4"/>
    <path class="navigation-scale" d="M20 156v4h${(barMeters * scale).toFixed(2)}v-4"/>
    <text x="20" y="172">${barMeters} m</text>
  </svg>`;
}

export async function initNavigation(paper, getLanguage) {
  const root = document.getElementById("navigation-content");
  if (!root) return { render() {} };
  const t = (en, zh) => getLanguage().startsWith("zh") ? zh : en;
  const response = await fetch("content/navigation.json?v=curved-motion-sync-20261009");
  if (!response.ok) throw new Error(`Navigation data: HTTP ${response.status}`);
  const manifest = await response.json();
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let paused = reducedMotion.matches;
  let observer;
  const visible = new Set();

  function updatePlayback() {
    root.querySelectorAll("video").forEach((video) => {
      if (!paused && visible.has(video) && !document.hidden) video.play().catch(() => {});
      else video.pause();
    });
    const button = root.querySelector(".navigation-play-toggle");
    if (button) {
      button.textContent = paused ? t("Play previews", "播放预览") : t("Pause previews", "暂停预览");
      button.setAttribute("aria-pressed", String(!paused));
    }
  }

  function benchmarkCards() {
    const result = paper.results.navigation;
    const ours = result.rows.find((row) => row.id === "opennwm");
    const domains = [["recon", "RECON"], ["scand", "SCAND"], ["office_go2", "Office-Go2"], ["tartan_drive", "TartanDrive"]];
    return `<div class="navigation-benchmark-heading"><h3>${t("Navigation benchmarks", "导航基准结果")}</h3><span>${t("OpenNWM · lower is better", "OpenNWM · 越低越好")}</span><a href="assets/paper/OpenNWM.pdf#page=7" target="_blank" rel="noopener">${t("Paper, Tables 2 & 10 ↗", "论文表 2 与表 10 ↗")}</a></div>
      <div class="navigation-benchmarks">${domains.map(([id, label]) => {
        const ate = ours[`${id}_ate`], rpe = ours[`${id}_rpe`];
        const baseline = Math.min(...result.rows.filter((row) => row.id !== "opennwm" && row[`${id}_ate`] != null).map((row) => row[`${id}_ate`]));
        const improvement = ((baseline - ate) / baseline * 100).toFixed(1);
        return `<article class="navigation-benchmark"><h4>${label}</h4><div class="navigation-metrics"><div><strong>${ate.toFixed(2)}</strong><span>ATE ↓</span></div><div><strong>${rpe.toFixed(2)}</strong><span>RPE ↓</span></div></div><p>${t(`${improvement}% lower ATE vs. the best baseline`, `ATE 较最优基线降低 ${improvement}%`)}</p></article>`;
      }).join("")}</div>`;
  }

  function render() {
    observer?.disconnect();
    visible.clear();
    root.querySelectorAll("video").forEach((video) => video.pause());
    root.innerHTML = `<div class="navigation-gallery-heading"><span>${t("Selected offline local plans", "精选离线局部规划")}</span><div class="navigation-legend"><span><i class="navigation-legend-plan"></i>OpenNWM</span><span><i class="navigation-legend-reference"></i>${t("Recorded path", "参考轨迹")}</span></div><button class="navigation-play-toggle" type="button"></button></div>
      <div class="navigation-examples">${manifest.samples.map((sample) => `<article class="navigation-example" data-sample-id="${escapeHTML(sample.id)}" data-fps="${sample.fps || manifest.media.fps}">
        <header><h3>${escapeHTML(sample.title[getLanguage().startsWith("zh") ? "zh" : "en"])}</h3><span>${escapeHTML(sample.dataset)}</span></header>
        <div class="navigation-media">
          <figure><img src="${sample.start}" loading="lazy" width="224" height="224" alt="${escapeHTML(t(`${sample.title.en}: recorded start`, `${sample.title.zh}：起点观测`))}"><figcaption>${t("Start", "起点")}</figcaption></figure>
          <figure><video src="${sample.video}" poster="${sample.poster}" width="224" height="224" preload="none" muted loop playsinline aria-label="${escapeHTML(t(`${sample.title.en}: OpenNWM imagined local plan`, `${sample.title.zh}：OpenNWM 规划预测`))}"></video><figcaption>OpenNWM</figcaption></figure>
          <figure><img src="${sample.goal}" loading="lazy" width="224" height="224" alt="${escapeHTML(t(`${sample.title.en}: goal image`, `${sample.title.zh}：目标图像`))}"><figcaption>${t("Goal", "目标")}</figcaption></figure>
        </div>
        <div class="navigation-path-row">${trajectoryGraphic(sample, t)}<span>${t("Goal error", "终点误差")}<strong>${sample.goal_error_m.toFixed(2)} m</strong></span></div>
      </article>`).join("")}</div>${benchmarkCards()}`;
    root.querySelector(".navigation-play-toggle").addEventListener("click", () => { paused = !paused; updatePlayback(); });
    observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => isIntersecting ? visible.add(target) : visible.delete(target));
      updatePlayback();
    }, { threshold: 0.1 });
    root.querySelectorAll("video").forEach((video) => {
      video.muted = true;
      const card = video.closest(".navigation-example");
      const graphic = card.querySelector(".navigation-path");
      const points = JSON.parse(graphic.dataset.points);
      const cursor = graphic.querySelector(".navigation-cursor");
      const progress = graphic.querySelector(".navigation-progress");
      const updatePath = () => {
        const frame = Math.min(points.length - 1, Math.floor(video.currentTime * Number(card.dataset.fps)));
        cursor.setAttribute("cx", points[frame][0]);
        cursor.setAttribute("cy", points[frame][1]);
        progress.setAttribute("points", points.slice(0, frame + 1).map((point) => point.join(",")).join(" "));
        graphic.dataset.frame = String(frame);
      };
      video.addEventListener("timeupdate", updatePath);
      video.addEventListener("seeked", updatePath);
      updatePath();
      observer.observe(video);
    });
    updatePlayback();
  }
  document.addEventListener("visibilitychange", updatePlayback);
  reducedMotion.addEventListener("change", (event) => { if (event.matches) { paused = true; updatePlayback(); } });
  render();
  return { render };
}
