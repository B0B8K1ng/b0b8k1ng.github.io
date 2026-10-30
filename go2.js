import { registerMedia } from "./media-scheduler.js?v=go2-routes-v3-20261030";

const root = document.querySelector("#go2-navigation");
const revision = "site-refinement-20261030";
const escape = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);
const t = (en, zh) => document.documentElement.lang.startsWith("zh") ? zh : en;
const localized = (record, key) => document.documentElement.lang.startsWith("zh")
  ? record[`${key}_zh`] || record[key] : record[key];
const asset = (path) => typeof path === "string" && /^assets\/go2\/[a-zA-Z0-9_./-]+$/.test(path) && !path.includes("..") ? path : "";
const mediaAsset = (path) => asset(path) ? `${asset(path)}?v=${revision}` : "";
const mobile = matchMedia("(max-width: 680px)");

function groupRoutes(manifest, clips) {
  const grouped = new Map();
  for (const clip of clips) {
    const routeId = clip.route_id || clip.id?.match(/^route_\d+/)?.[0];
    const key = clip.route_id || clip.episode || routeId || clip.id;
    if (!grouped.has(key)) {
      const metadata = (manifest.routes || []).find((route) => route.id === key
        || route.id === routeId || (clip.episode && route.episode === clip.episode));
      grouped.set(key, { id: key, routeId, metadata: metadata || {
        title: clip.route_title, title_zh: clip.route_title_zh,
      }, clips: [] });
    }
    grouped.get(key).clips.push(clip);
  }
  return [...grouped.values()].map((route) => ({ ...route,
    clips: route.clips.sort((a, b) => (a.start_time_s || 0) - (b.start_time_s || 0)),
  }));
}

async function init() {
  if (!root) return;
  const response = await fetch(`content/go2.json?v=${revision}`);
  if (!response.ok) throw new Error(`Go2 comparison: HTTP ${response.status}`);
  const manifest = await response.json();
  if (manifest.status !== "ready") return;
  const clips = (manifest.clips || []).filter((clip) => clip && asset(clip.video));
  if (!clips.length) return;

  const routes = groupRoutes(manifest, clips);
  root.innerHTML = `<div class="go2-heading"><div><span id="go2-section-number" class="eyebrow section-number"></span><h2 id="go2-title"></h2></div></div>
    <div class="go2-routes">${routes.map((route, index) => `<section class="go2-route" data-route="${escape(route.id)}" aria-labelledby="go2-route-title-${index}">
      <div class="go2-route-heading"><h3 id="go2-route-title-${index}"></h3><span class="go2-route-count"></span></div>
      <div class="go2-grid" id="go2-route-clips-${index}">${Array.from({ length: Math.min(2, route.clips.length) }, (_, slot) => `<figure class="go2-clip"><div class="go2-screen"><video id="go2-video-${index}-${slot}" muted loop playsinline preload="none" width="1920" height="1080" disablepictureinpicture disableremoteplayback tabindex="-1"></video><p class="go2-media-error" role="status" hidden></p></div><figcaption><h4></h4></figcaption></figure>`).join("")}</div>
      <div class="go2-navigation" role="group"><button class="go2-arrow go2-previous" type="button" aria-controls="go2-route-clips-${index}"><span aria-hidden="true">←</span></button>
        <div class="go2-dots">${route.clips.map((_, clipIndex) => `<button class="go2-dot" type="button" data-index="${clipIndex}" aria-controls="go2-route-clips-${index}" aria-pressed="false"><span aria-hidden="true"></span></button>`).join("")}</div>
        <button class="go2-arrow go2-next" type="button" aria-controls="go2-route-clips-${index}"><span aria-hidden="true">→</span></button>
        <span class="go2-route-status" aria-live="polite" aria-atomic="true"></span>
      </div>
    </section>`).join("")}</div>`;
  root.hidden = false;
  const states = routes.map((route, index) => {
    const element = root.querySelectorAll(".go2-route")[index];
    const slots = [...element.querySelectorAll(".go2-clip")].map((card) => {
      const video = card.querySelector("video");
      const error = card.querySelector(".go2-media-error");
      video.muted = video.defaultMuted = true;
      video.controls = false;
      video.loop = video.playsInline = true;
      video.addEventListener("playing", () => { error.hidden = true; });
      video.addEventListener("error", () => { error.hidden = false; });
      return { card, video, error, clip: null, media: null };
    });
    return { route, element, index, start: 0, slots,
      previous: element.querySelector(".go2-previous"), next: element.querySelector(".go2-next"),
      dots: [...element.querySelectorAll(".go2-dot")],
    };
  });

  const visibleCount = () => mobile.matches ? 1 : 2;
  const lastStart = (state) => Math.max(0, state.route.clips.length - visibleCount());
  const routeTitle = (state) => localized(state.route.metadata, "title") || t(
    `Route ${state.route.routeId?.match(/\d+$/)?.[0] || String(state.index + 1).padStart(2, "0")}`,
    `轨迹 ${state.route.routeId?.match(/\d+$/)?.[0] || String(state.index + 1).padStart(2, "0")}`,
  );

  function renderRouteText(state) {
    const title = routeTitle(state);
    const total = state.route.clips.length;
    const end = Math.min(total, state.start + visibleCount());
    state.element.querySelector("h3").textContent = title;
    state.element.querySelector(".go2-route-count").textContent = t(`${total} clips`, `${total} 个片段`);
    state.element.querySelector(".go2-navigation").setAttribute("aria-label", t(`${title} clips`, `${title}的片段`));
    state.element.querySelector(".go2-route-status").textContent = t(
      `Showing ${state.start + 1}${end > state.start + 1 ? `–${end}` : ""} of ${total} clips`,
      `正在显示第 ${state.start + 1}${end > state.start + 1 ? `–${end}` : ""} 个片段，共 ${total} 个`,
    );
    state.previous.setAttribute("aria-label", t(`Previous clip: ${title}`, `${title}：上一个片段`));
    state.next.setAttribute("aria-label", t(`Next clip: ${title}`, `${title}：下一个片段`));
    state.dots.forEach((dot, index) => {
      const clipTitle = localized(state.route.clips[index], "title") || state.route.clips[index].id;
      dot.setAttribute("aria-label", t(`Show clip ${index + 1} of ${total}: ${clipTitle}`, `显示第 ${index + 1} 个片段，共 ${total} 个：${clipTitle}`));
      dot.setAttribute("aria-pressed", String(index >= state.start && index < end));
      dot.title = clipTitle;
    });
    state.slots.forEach(({ card, video, error, clip }) => {
      if (!clip) return;
      const clipTitle = localized(clip, "title") || clip.id;
      card.querySelector("h4").textContent = clipTitle;
      video.setAttribute("aria-label", `${clipTitle} — ${t("recorded robot, model predictions and trajectories", "机器狗真实记录、模型预测与轨迹")}`);
      error.textContent = t("Video unavailable", "视频暂时无法加载");
    });
  }

  function showClips(state, start = state.start) {
    state.start = Math.max(0, Math.min(start, lastStart(state)));
    state.slots.forEach((slot, index) => {
      const clip = index < visibleCount() ? state.route.clips[state.start + index] : null;
      slot.card.hidden = !clip;
      if (!clip) {
        slot.media?.unregister();
        slot.media = null;
        slot.clip = null;
        return;
      }
      if (clip !== slot.clip) {
        slot.error.hidden = true;
        slot.card.dataset.clip = clip.id;
        const sources = [mediaAsset(clip.video)];
        const posters = [mediaAsset(clip.poster)];
        if (slot.media) slot.media.update({ sources, posters });
        else slot.media = registerMedia({ element: slot.card.querySelector(".go2-screen"),
          videos: [slot.video], sources, posters, cost: 3, priority: 1 });
        slot.clip = clip;
      }
    });
    state.previous.disabled = state.start === 0;
    state.next.disabled = state.start === lastStart(state);
    renderRouteText(state);
  }

  function renderText() {
    root.querySelector("#go2-section-number").textContent = t("03 / REAL WORLD", "03 / 真机");
    root.querySelector("#go2-title").textContent = t("Real-world navigation.", "真实场景导航。");
    states.forEach(renderRouteText);
  }

  states.forEach((state) => {
    state.previous.addEventListener("click", () => showClips(state, state.start - 1));
    state.next.addEventListener("click", () => showClips(state, state.start + 1));
    state.dots.forEach((dot, index) => dot.addEventListener("click", () => showClips(state, index)));
    state.element.querySelector(".go2-navigation").addEventListener("keydown", (event) => {
      const targets = { ArrowLeft: state.start - 1, ArrowRight: state.start + 1, Home: 0, End: lastStart(state) };
      if (!(event.key in targets)) return;
      event.preventDefault();
      showClips(state, targets[event.key]);
    });
    showClips(state);
  });
  mobile.addEventListener("change", () => states.forEach((state) => showClips(state)));
  new MutationObserver(renderText).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  renderText();
}

init().catch((error) => console.error(error));
