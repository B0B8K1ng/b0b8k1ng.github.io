const STAGE_MS = 3600;
const STAGES = [
  { en: "Pretrain", zh: "预训练", x: 326, trainable: [[109, 409, 430, 105]] },
  { en: "Warm up", zh: "预热", x: 1058, trainable: [[881, 305, 350, 71]] },
  { en: "Fine-tune", zh: "微调", x: 1792, trainable: [[1611, 305, 350, 71], [1571, 409, 430, 105]] },
];
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 10 7-10 7Z"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';

export function initMethodAnimation(root, getLanguage) {
  const preference = matchMedia("(prefers-reduced-motion: reduce)");
  const t = (en, zh) => getLanguage().startsWith("zh") ? zh : en;
  let elapsed = 0, stage = 0, userChoice = null;
  let wantsPlayback = !preference.matches;
  let visible = false, frame = 0, lastTick = null;

  root.classList.add("method-animation");
  root.innerHTML = `
    <div class="method-animation-stage">
      <div class="method-animation-artwork">
        <img class="method-animation-image" src="assets/paper/figure-3-training.png" width="2124" height="576" loading="lazy" decoding="async" alt="">
        <div class="method-animation-focus" aria-hidden="true">${STAGES.map((_, index) => `<span class="method-animation-column" data-column="${index}"></span>`).join("")}</div>
        <svg class="method-animation-overlay" viewBox="0 0 2124 576" aria-hidden="true" focusable="false">${STAGES.map((item, index) => `
          <g class="method-animation-signals" data-signals="${index}">
            <circle class="method-flow-dot" cx="${item.x}" cy="276" r="5"/>
            <circle class="method-flow-dot method-flow-dot-lower" cx="${item.x}" cy="379" r="5"/>
            ${item.trainable.map(([x, y, width, height]) => `<rect class="method-trainable-glow" x="${x}" y="${y}" width="${width}" height="${height}" rx="18"/>`).join("")}
          </g>`).join("")}</svg>
      </div>
    </div>
    <div class="method-animation-controls">
      <div class="method-animation-steps" role="group">${STAGES.map((_, index) => `<button type="button" class="method-stage-button" data-method-stage="${index}" aria-pressed="false"></button>`).join("")}</div>
      <button type="button" class="method-animation-toggle" aria-pressed="false"></button>
    </div>`;

  const image = root.querySelector(".method-animation-image");
  const group = root.querySelector(".method-animation-steps");
  const buttons = [...root.querySelectorAll("[data-method-stage]")];
  const columns = [...root.querySelectorAll("[data-column]")];
  const signals = [...root.querySelectorAll("[data-signals]")];
  const toggle = root.querySelector(".method-animation-toggle");

  function updateStage() {
    stage = Math.floor(elapsed / STAGE_MS) % STAGES.length;
    root.dataset.stage = String(stage);
    root.style.setProperty("--method-stage", stage);
    buttons.forEach((button, index) => button.setAttribute("aria-pressed", String(index === stage)));
    columns.forEach((column, index) => column.classList.toggle("is-active", index === stage));
    signals.forEach((signal, index) => signal.classList.toggle("is-active", index === stage));
  }

  function render() {
    image.alt = t(
      "Original OpenNWM training diagram. Pretrain: learn the world model from NavAnywhere videos using latent actions. Warm up: train the physical-action encoder while the world model stays frozen. Fine-tune: jointly train the action encoder and world model.",
      "OpenNWM 论文训练流程原图。预训练：利用潜在动作，从 NavAnywhere 视频训练世界模型。预热：冻结世界模型，只训练物理动作编码器。微调：联合训练动作编码器与世界模型。",
    );
    group.setAttribute("aria-label", t("Training stage", "训练阶段"));
    buttons.forEach((button, index) => { button.textContent = t(STAGES[index].en, STAGES[index].zh); });
    const label = wantsPlayback ? t("Pause method animation", "暂停方法动画") : t("Play method animation", "播放方法动画");
    toggle.setAttribute("aria-label", label);
    toggle.setAttribute("title", label);
    toggle.setAttribute("aria-pressed", String(wantsPlayback));
    toggle.innerHTML = wantsPlayback ? PAUSE : PLAY;
  }

  function tick(timestamp) {
    frame = 0;
    if (lastTick !== null) elapsed = (elapsed + timestamp - lastTick) % (STAGE_MS * STAGES.length);
    lastTick = timestamp;
    if (Math.floor(elapsed / STAGE_MS) !== stage) updateStage();
    frame = requestAnimationFrame(tick);
  }

  function syncPlayback() {
    const running = wantsPlayback && visible && !document.hidden;
    root.dataset.playing = String(wantsPlayback);
    root.dataset.running = String(running);
    root.dataset.motion = !preference.matches || userChoice === true ? "allowed" : "reduced";
    root.style.setProperty("--method-play-state", running ? "running" : "paused");
    if (running && !frame) {
      lastTick = null;
      frame = requestAnimationFrame(tick);
    } else if (!running) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTick = null;
    }
    render();
  }

  buttons.forEach((button, index) => button.addEventListener("click", () => {
    userChoice = wantsPlayback = false;
    elapsed = index * STAGE_MS;
    updateStage();
    syncPlayback();
  }));
  toggle.addEventListener("click", () => {
    userChoice = wantsPlayback = !wantsPlayback;
    syncPlayback();
  });
  preference.addEventListener("change", () => {
    if (preference.matches) {
      wantsPlayback = false;
      if (userChoice === true) userChoice = null;
    } else if (userChoice !== false) wantsPlayback = true;
    syncPlayback();
  });
  document.addEventListener("visibilitychange", syncPlayback);
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && entry.intersectionRatio >= .08;
    syncPlayback();
  }, { threshold: [0, .08] });
  observer.observe(root);

  updateStage();
  syncPlayback();
  return { render };
}
