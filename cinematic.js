const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function initCinematic(getLanguage) {
  const t = (en, zh) => getLanguage() === "zh" ? zh || en : en;
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const hero = $("#hero-video");
  const heroScene = $("#hero-scene");
  const mosaic = $("#mosaic-video");
  let enabled = !motion.matches, visible = false, selected = 0, space, film, journeyScenes = [];
  const mediaUrl = (source) => {
    const url = new URL(source, document.baseURI);
    url.searchParams.set("v", film?.cacheVersion || "first-person-225-v2");
    return url.href;
  };
  function updateHeroScene() {
    const time = hero.currentTime || 0;
    let scene = journeyScenes[0];
    // During a dissolve, name the incoming scene from its first frame.
    for (const candidate of journeyScenes) {
      if (candidate.start > time) break;
      scene = candidate;
    }
    const label = scene ? t(scene.labelEn, scene.labelZh) : "NavAnywhere";
    if (heroScene.textContent !== label) heroScene.textContent = label;
  }
  ["timeupdate", "seeking", "seeked", "loadedmetadata", "emptied"].forEach((event) => hero.addEventListener(event, updateHeroScene));
  const updateVideo = () => {
    if (enabled && visible && !document.hidden) mosaic.play().catch(updateButton);
    else mosaic.pause();
  };
  function updateButton() {
    $("#mosaic-pause").innerHTML = `<svg><use href="#${mosaic.paused ? "play" : "pause"}"/></svg>`;
    $("#mosaic-pause").setAttribute("aria-label", mosaic.paused ? t("Play video wall", "播放视频墙") : t("Pause video wall", "暂停视频墙"));
  }
  mosaic.addEventListener("play", updateButton);
  mosaic.addEventListener("pause", updateButton);
  $("#mosaic-pause").addEventListener("click", () => { enabled = mosaic.paused; updateVideo(); });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateVideo(); }, { threshold: 0.12 }).observe(mosaic);
  document.addEventListener("visibilitychange", updateVideo);
  motion.addEventListener("change", () => { enabled = !motion.matches; updateVideo(); });

  function render() {
    updateButton();
    updateHeroScene();
    if (film?.counts) $("#mosaic-counts").textContent = t(`NAVANYWHERE / ${film.counts.sources} SOURCES / ${film.counts.clips} SEQUENCES`, `NAVANYWHERE / ${film.counts.sources} 个来源 / ${film.counts.clips} 段序列`);
    if (!space?.scenes?.length) return;
    $("#space-tabs").innerHTML = space.scenes.map((scene, i) => `<button type="button" data-scene="${i}" aria-pressed="${i === selected}" class="${i === selected ? "active" : ""}">${escape(t(scene.title, scene.titleZh))}<span>${escape(t(scene.tag || "", scene.tagZh))}</span></button>`).join("");
    const scene = space.scenes[selected];
    const video = scene.video || scene.prediction;
    const initial = scene.initial || scene.initialImage || scene.poster;
    const imagePanel = (src, label, className = "") => `<figure class="space-frame ${className}"><img src="${escape(src)}" alt="${escape(label)}" loading="lazy"><figcaption>${escape(label)}</figcaption></figure>`;
    const main = video ? `<figure class="space-frame space-prediction"><video controls playsinline muted preload="none" src="${escape(video)}" poster="${escape(initial)}" aria-label="${escape(t("OpenNWM planetary stress-test prediction", "OpenNWM 行星环境压力测试预测"))}"></video><figcaption>OPENNWM <span>${escape(t("PRECOMPUTED STRESS TEST", "预计算压力测试"))}</span></figcaption></figure>` : imagePanel(scene.predictionImage || scene.poster, t("OpenNWM prediction", "OpenNWM 预测"), "space-prediction");
    const truth = scene.groundTruth || scene.gt;
    $("#space-stage").innerHTML = `<div class="space-observation">${imagePanel(initial, t("INITIAL OBSERVATION", "初始观测"))}${scene.trajectory ? imagePanel(scene.trajectory, t("CONDITIONING TRAJECTORY", "条件轨迹"), "space-trajectory") : ""}<div class="space-context"><span class="eyebrow">${escape(t(scene.tag || "PLANETARY ROVER", scene.tagZh))}</span><h3>${escape(t(scene.title, scene.titleZh))}</h3><p>${escape(t(scene.description || "", scene.descriptionZh))}</p></div></div><div class="space-output">${main}${truth ? `<details class="space-truth"><summary>${escape(t("View recorded reference", "查看真实参考"))}</summary>${/\.(mp4|webm)$/i.test(truth) ? `<video controls playsinline muted preload="none" src="${escape(truth)}"></video>` : `<img src="${escape(truth)}" alt="${escape(t("Recorded reference", "真实参考"))}" loading="lazy">`}</details>` : ""}</div>`;
    $("#space-provenance").textContent = t(scene.provenance || space.note || "", scene.provenanceZh || space.noteZh);
    $("#space-manifest").hidden = !scene.manifest;
    if (scene.manifest) $("#space-manifest").href = scene.manifest;
  }
  $("#space-tabs").addEventListener("click", (event) => {
    const button = event.target.closest("[data-scene]");
    if (!button) return;
    $("#space-stage").querySelectorAll("video").forEach((video) => video.pause());
    selected = Number(button.dataset.scene);
    render();
    $("#space-tabs").querySelector(`[data-scene="${selected}"]`)?.focus({ preventScroll: true });
  });
  // Pause foreground media when its section is no longer visible.
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) $("#space-stage").querySelectorAll("video").forEach((video) => video.pause());
  }, { threshold: 0.01 }).observe($("#space-stage"));
  const responses = await Promise.allSettled([fetch("content/cinematic.json", { cache: "no-cache" }), fetch("content/space.json")]);
  if (responses[0].status === "fulfilled" && responses[0].value.ok) {
    film = await responses[0].value.json();
    journeyScenes = (film.journeyScenes || film.journey?.scenes || []).map((scene) => ({
      start: Number(scene.startSeconds ?? scene.start_seconds ?? 0),
      labelEn: scene.labelEn || scene.title || scene.label || scene.source || "NavAnywhere",
      labelZh: scene.labelZh || scene.titleZh,
    })).filter((scene) => Number.isFinite(scene.start)).sort((a, b) => a.start - b.start);
    hero.poster = mediaUrl(film.journey?.poster || "assets/hero/journey-poster.webp");
    hero.src = mediaUrl(film.journey?.src || "assets/hero/journey.mp4");
    mosaic.src = mediaUrl(film.mosaic?.src || "assets/hero/mosaic.mp4");
    mosaic.poster = mediaUrl(film.mosaic?.poster || "assets/hero/mosaic-poster.webp");
  } else {
    hero.src = mediaUrl("assets/hero/journey.mp4");
    mosaic.src = mediaUrl("assets/hero/mosaic.mp4");
  }
  if (responses[1].status === "fulfilled" && responses[1].value.ok) {
    space = await responses[1].value.json();
  } else {
    $("#space-stage").textContent = t("Planetary examples could not load. Please reload the page.", "行星场景加载失败，请刷新页面。");
  }
  render();
  updateVideo();
  return { render };
}
