const $ = (selector) => document.querySelector(selector);
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export async function initCinematic(getLanguage) {
  const t = (en, zh) => getLanguage() === "zh" ? zh || en : en;
  const hero = $("#hero-video");
  const heroScene = $("#hero-scene");
  const section = $(".cinematic-hero");
  const seek = $("#journey-seek");
  let selected = 0, space, film, journeyScenes = [], chapters = [], frame = 0;
  const mediaUrl = (source) => {
    const url = new URL(source, document.baseURI);
    url.searchParams.set("v", film?.cacheVersion || "earth-to-space-v3");
    return url.href;
  };
  const clock = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
  const filmDuration = () => Number.isFinite(hero.duration) ? hero.duration : Number(film?.journey?.durationSeconds || journeyScenes.at(-1)?.end || 60);
  const normalizeScene = (scene) => ({
    start: Number(scene.startSeconds ?? scene.start_seconds ?? 0),
    end: Number(scene.endSeconds ?? scene.end_seconds ?? 0),
    planet: scene.planet || "earth",
    labelEn: scene.labelEn || scene.title || scene.label || scene.source || "NavAnywhere",
    labelZh: scene.labelZh || scene.titleZh,
  });
  function updateHeroScene() {
    const time = hero.currentTime || 0;
    const duration = filmDuration();
    const progress = Math.max(0, Math.min(1, time / duration));
    let scene = journeyScenes[0];
    for (const candidate of journeyScenes) {
      if (candidate.start > time + 0.001) break;
      scene = candidate;
    }
    const label = scene ? t(scene.labelEn, scene.labelZh) : "NavAnywhere";
    const planet = scene?.planet || "earth";
    if (heroScene.textContent !== (planet === "wall" ? "" : label)) heroScene.textContent = planet === "wall" ? "" : label;
    section.dataset.planet = planet;
    seek.max = duration;
    seek.value = time;
    seek.setAttribute("aria-valuetext", `${label}, ${clock(time)} ${t("of", "/")} ${clock(duration)}`);
    $("#journey-rover").style.left = `${progress * 100}%`;
    $("#journey-progress").style.width = `${progress * 100}%`;
    const timeText = `${clock(time)} / ${clock(duration)}`;
    if ($("#journey-time").textContent !== timeText) $("#journey-time").textContent = timeText;
    $("#journey-chapters").querySelectorAll("button").forEach((button, i) => {
      const chapter = chapters[i];
      const active = time >= chapter.start - 0.001 && time < (chapter.end || duration) - 0.001;
      button.classList.toggle("active", active);
      button.setAttribute("aria-current", active ? "step" : "false");
    });
    $("#journey-scene-stops").querySelectorAll("button").forEach((button) => {
      const active = Number(button.dataset.start) === scene?.start;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }
  function drawFrame() {
    updateHeroScene();
    frame = !hero.paused && !document.hidden ? requestAnimationFrame(drawFrame) : 0;
  }
  hero.addEventListener("play", () => { cancelAnimationFrame(frame); drawFrame(); });
  hero.addEventListener("pause", () => { cancelAnimationFrame(frame); frame = 0; updateHeroScene(); });
  ["timeupdate", "seeking", "seeked", "loadedmetadata", "emptied"].forEach((event) => hero.addEventListener(event, updateHeroScene));
  seek.addEventListener("input", () => { hero.currentTime = Number(seek.value); updateHeroScene(); });
  function seekTo(time) {
    hero.currentTime = time;
    updateHeroScene();
  }
  $("#journey-chapters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-start]");
    if (button) seekTo(Number(button.dataset.start));
  });
  $("#journey-scene-stops").addEventListener("click", (event) => {
    const button = event.target.closest("[data-start]");
    if (button) seekTo(Number(button.dataset.start));
  });
  $("#watch-video-wall").addEventListener("click", () => {
    const wall = chapters.find((chapter) => chapter.planet === "wall");
    if (wall) {
      seekTo(wall.start);
      if (hero.paused) $("#hero-pause").click();
    }
  });
  function renderNavigation() {
    const duration = filmDuration();
    const planetNames = { earth: t("EARTH", "地球"), moon: t("MOON", "月球"), mars: t("MARS", "火星"), wall: t("MANY WORLDS", "万千世界") };
    $("#journey-chapters").innerHTML = chapters.map((chapter, i) => `<button type="button" data-start="${chapter.start}" data-planet="${escape(chapter.planet)}" style="--chapter-span:${Math.max(.01, chapter.end - chapter.start)}" aria-label="${escape(t("Go to ", "跳转到 ") + (planetNames[chapter.planet] || chapter.labelEn))}"><span class="chapter-dot"></span><span>${escape(planetNames[chapter.planet] || t(chapter.labelEn, chapter.labelZh))}</span><span class="chapter-order">${String(i + 1).padStart(2, "0")}</span></button>`).join("");
    $("#journey-stops").innerHTML = journeyScenes.slice(1).map((scene) => `<i class="journey-stop ${scene.planet !== "earth" ? "planet-stop" : ""}" style="left:${scene.start / duration * 100}%"></i>`).join("");
    $("#journey-scene-stops").innerHTML = journeyScenes.filter((scene) => scene.planet === "earth").map((scene, i) => `<button type="button" data-start="${scene.start}" aria-pressed="false"><span>${String(i + 1).padStart(2, "0")}</span>${escape(t(scene.labelEn, scene.labelZh))}</button>`).join("");
    seek.setAttribute("aria-label", t("Seek through Earth, Moon, Mars and the video wall", "跳转地球、月球、火星与视频墙"));
    $(".journey-navigation").setAttribute("aria-label", t("Opening film navigation", "开场影片导航"));
    $("#journey-scene-stops").setAttribute("aria-label", t("Earth scenes", "地球场景"));
    updateHeroScene();
  }

  function render() {
    renderNavigation();
    if (film?.disclosure || film?.provenance || film?.provenanceEn) $("#film-provenance").textContent = t(film.disclosure || film.provenanceEn || film.provenance, film.disclosureZh || film.provenanceZh);
    if (film?.counts) $("#mosaic-counts").textContent = t(`NAVANYWHERE / ${film.counts.sources} SOURCES / ${film.counts.clips} SEQUENCES`, `NAVANYWHERE / ${film.counts.sources} 个来源 / ${film.counts.clips} 段序列`);
    if (!space?.scenes?.length) return;
    $("#space-tabs").innerHTML = space.scenes.map((scene, i) => `<button type="button" data-scene="${i}" aria-pressed="${i === selected}" class="${i === selected ? "active" : ""}">${escape(t(scene.title, scene.titleZh))}<span>${escape(t(scene.tag || "", scene.tagZh))}</span></button>`).join("");
    const scene = space.scenes[selected];
    const video = scene.video || scene.prediction;
    const initial = scene.initial || scene.initialImage || scene.poster;
    const imagePanel = (src, label, className = "") => `<figure class="space-frame ${className}"><img src="${escape(src)}" alt="${escape(label)}" loading="lazy"><figcaption>${escape(label)}</figcaption></figure>`;
    const predictionLabel = t(scene.predictionLabel || "PRECOMPUTED STRESS TEST", scene.predictionLabelZh || "预计算压力测试");
    const main = video ? `<figure class="space-frame space-prediction"><video controls playsinline muted preload="none" src="${escape(video)}" poster="${escape(scene.poster || initial)}" aria-label="${escape(`OpenNWM · ${predictionLabel}`)}"></video><figcaption>OPENNWM <span>${escape(predictionLabel)}</span></figcaption></figure>` : imagePanel(scene.predictionImage || scene.poster, t("OpenNWM prediction", "OpenNWM 预测"), "space-prediction");
    const videoDetails = (src, label) => src ? `<details class="space-truth"><summary>${escape(label)}</summary><video controls playsinline muted preload="none" src="${escape(src)}" aria-label="${escape(label)}"></video></details>` : "";
    const comparison = videoDetails(scene.comparison, t(scene.comparisonLabel || "Compare reference and direct prediction", scene.comparisonLabelZh || "对照真实参考与直接预测"));
    const autoregressive = videoDetails(scene.autoregressive, t(scene.autoregressiveLabel || "Compare reference and autoregressive prediction", scene.autoregressiveLabelZh || "对照真实参考与自回归预测"));
    const truth = scene.groundTruth || scene.gt;
    const referenceLabel = t("View recorded reference", "查看真实参考");
    const reference = truth ? (/\.(mp4|webm)$/i.test(truth) ? videoDetails(truth, referenceLabel) : `<details class="space-truth"><summary>${escape(referenceLabel)}</summary><img src="${escape(truth)}" alt="${escape(referenceLabel)}" loading="lazy"></details>`) : "";
    $("#space-stage").innerHTML = `<div class="space-observation">${imagePanel(initial, t("INITIAL OBSERVATION", "初始观测"))}${scene.trajectory ? imagePanel(scene.trajectory, t("CONDITIONING TRAJECTORY", "条件轨迹"), "space-trajectory") : ""}<div class="space-context"><span class="eyebrow">${escape(t(scene.tag || "PLANETARY ROVER", scene.tagZh))}</span><h3>${escape(t(scene.title, scene.titleZh))}</h3><p>${escape(t(scene.description || "", scene.descriptionZh))}</p></div></div><div class="space-output">${main}${comparison}${autoregressive}${reference}</div>`;
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
  $("#space-stage").addEventListener("toggle", (event) => {
    if (event.target.matches("details:not([open])")) event.target.querySelectorAll("video").forEach((video) => video.pause());
  }, true);
  // Pause foreground media when its section is no longer visible.
  new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) $("#space-stage").querySelectorAll("video").forEach((video) => video.pause());
  }, { threshold: 0.01 }).observe($("#space-stage"));
  const responses = await Promise.allSettled([fetch("content/cinematic.json?v=earth-space-v3-20260930", { cache: "no-cache" }), fetch("content/space.json?v=lusnar-finetuned-20261008", { cache: "no-cache" })]);
  if (responses[0].status === "fulfilled" && responses[0].value.ok) {
    film = await responses[0].value.json();
    journeyScenes = (film.journeyScenes || film.journey?.scenes || []).map(normalizeScene).filter((scene) => Number.isFinite(scene.start)).sort((a, b) => a.start - b.start);
    chapters = (film.chapters || []).map(normalizeScene);
    if (!chapters.length) {
      for (const scene of journeyScenes) {
        const previous = chapters.at(-1);
        if (previous?.planet === scene.planet) previous.end = scene.end;
        else chapters.push({ ...scene });
      }
    }
    hero.poster = mediaUrl(film.journey?.poster || "assets/hero/journey-poster.webp");
    hero.src = mediaUrl(film.journey?.src || "assets/hero/journey.mp4");
  } else {
    hero.src = mediaUrl("assets/hero/journey.mp4");
  }
  if (responses[1].status === "fulfilled" && responses[1].value.ok) {
    space = await responses[1].value.json();
  } else {
    $("#space-stage").textContent = t("Planetary examples could not load. Please reload the page.", "行星场景加载失败，请刷新页面。");
  }
  render();
  return { render };
}
