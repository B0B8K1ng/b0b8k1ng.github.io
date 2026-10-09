const escapeHTML = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );

export function initResearch(paper, getLanguage) {
  const element = (id) => document.getElementById(id);
  const steps = element("method-steps");
  const panel = element("method-panel");
  const domainSelect = element("result-domain");
  const metricTabs = element("metric-tabs");
  const chart = element("result-chart");
  const rows = paper.results.direct_prediction.rows;
  const state = { domain: "id", idMetric: "lpips" };
  const t = (en, zh) => (getLanguage().startsWith("zh") ? zh : en);
  const flowArrow = '<span class="method-flow-arrow" aria-hidden="true">↓</span>';
  const node = (label, accent = false) =>
    `<span class="method-node${accent ? " method-node-accent" : ""}">${label}</span>`;

  function methodCards() {
    return [
      {
        title: t("Ground motion in video", "从视频中理解运动"),
        label: t("Dual-supervised latent actions", "双重监督的潜在动作"),
        text: t(
          "The latent action model (LAM) encodes a pair of frames into a shared motion representation. Visual reconstruction preserves the transition; physical-motion supervision on annotated trajectories grounds it in controllable movement.",
          "潜在动作模型（LAM）将前后两帧编码为共享的运动表示。视觉重建保留画面中的变化；带标注轨迹上的物理运动监督，让表示对应可控制的运动。",
        ),
        diagram: `${node(t("Current + future frame", "当前帧 + 未来帧"))}${flowArrow}${node(`LAM → ${t("latent action", "潜在动作")} <i>z</i>`, true)}<div class="method-supervision"><span>${t("Visual reconstruction", "视觉重建")}</span><span>${t("Motion grounding", "运动约束")}</span></div>`,
      },
      {
        title: t("Learn from NavAnywhere", "从 NavAnywhere 学习"),
        label: t("Action-free video pretraining", "无动作标注视频预训练"),
        text: t(
          "The frozen LAM infers actions from diverse videos without recorded controls. A diffusion world model learns future observations from visual context, relative time, and inferred latent actions—scaling dynamics learning to NavAnywhere’s 17.5M frames.",
          "冻结的 LAM 从多样视频中推断潜在动作，无需录制控制指令。扩散世界模型结合视觉上下文、相对时间与推断的潜在动作学习未来画面，将动态学习扩展到 NavAnywhere 的 1750 万帧。",
        ),
        diagram: `${node(t("NavAnywhere → frozen LAM", "NavAnywhere → 冻结 LAM"))}${flowArrow}${node(t("Context + latent action + time", "上下文 + 潜在动作 + 时间"), true)}${flowArrow}${node(t("World model → future frames", "世界模型 → 未来画面"))}`,
      },
      {
        title: t("Turn prediction into navigation", "从未来预测到导航"),
        label: t("Physical-action alignment & planning", "物理动作对齐与规划"),
        text: t(
          "Post-training connects the world model to physical waypoint actions (Δx, Δy, Δψ). At navigation time, CEM evaluates candidate actions through predicted futures, selects a plan toward the visual goal, and replans after executing its first action.",
          "后训练将世界模型与物理路点动作（Δx、Δy、Δψ）对齐。导航时，CEM 通过预测未来评估候选动作，选择通向视觉目标的方案，执行第一个动作后重新规划。",
        ),
        diagram: `${node(t("Candidate waypoint actions", "候选路点动作"))}${flowArrow}${node(t("OpenNWM → predicted futures", "OpenNWM → 未来预测"), true)}${flowArrow}${node(t("Select → execute → replan", "选择 → 执行 → 重新规划"))}`,
      },
    ];
  }

  function renderMethod() {
    const descriptions = methodCards();
    steps.parentElement.classList.add("method-overview");
    steps.setAttribute("role", "list");
    steps.setAttribute("aria-label", t("How OpenNWM works", "OpenNWM 的方法"));
    steps.innerHTML = descriptions
      .map(
        (stage, index) =>
          `<article class="method-card" role="listitem"><div class="method-card-label"><span aria-hidden="true">0${index + 1}</span>${escapeHTML(stage.label)}</div><h3>${escapeHTML(stage.title)}</h3><div class="method-card-diagram" aria-hidden="true">${stage.diagram}</div><p>${escapeHTML(stage.text)}</p></article>`,
      )
      .join("");
    panel.removeAttribute("role");
    panel.removeAttribute("aria-live");
    panel.removeAttribute("aria-labelledby");
    panel.removeAttribute("tabindex");
    const training = [
      [t("Latent pretraining", "潜在动作预训练"), t("Learn the world model from NavAnywhere.", "在 NavAnywhere 上训练世界模型。")],
      [t("Action-encoder warmup", "动作编码器预热"), t("Train the new physical-action encoder; freeze the world model.", "冻结世界模型，仅训练新的物理动作编码器。")],
      [t("Joint post-training", "联合后训练"), t("Adapt the encoder and world model together on action-labeled video.", "用带动作标注的视频联合训练编码器与世界模型。")],
    ];
    panel.innerHTML = `<div class="method-training-heading"><h3>${t("How the world model is trained", "世界模型如何训练")}</h3><span>${t("After learning the LAM", "在 LAM 训练完成后")}</span></div><ol class="method-training">${training.map(([title, text]) => `<li><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></li>`).join("")}</ol>`;
  }

  function domains() {
    return [
      ["id", t("In-domain average", "域内平均")],
      ["go_stanford", t("Go Stanford · OOD", "Go Stanford · 域外")],
      ["tum", t("TUM RGB-D · OOD", "TUM RGB-D · 域外")],
      ["planetary_rover", t("Planetary Rover · OOD", "行星探测车 · 域外")],
      ["office_go2", t("Office-Go2 · OOD", "Office-Go2 · 域外")],
    ];
  }

  function renderResults() {
    const isID = state.domain === "id";
    const metric = isID ? state.idMetric : "psnr";
    const metricName = { lpips: "LPIPS", dreamsim: "DreamSim", psnr: "PSNR" }[
      metric
    ];
    const key = `${state.domain}_${metric}`;
    const higher = metric === "psnr";
    const label = domains().find(([id]) => id === state.domain)[1];
    const values = rows.map((row) => row[key]);
    const maximum = Math.max(...values);
    const axisMaximum = higher
      ? Math.ceil(maximum / 2) * 2
      : Math.ceil(maximum * 10) / 10;
    const best = higher ? maximum : Math.min(...values);
    domainSelect.innerHTML = domains()
      .map(
        ([id, name]) =>
          `<option value="${id}"${id === state.domain ? " selected" : ""}>${escapeHTML(name)}</option>`,
      )
      .join("");
    domainSelect.setAttribute(
      "aria-label",
      t("Evaluation dataset", "评测数据集"),
    );
    metricTabs.setAttribute("aria-label", t("Prediction metric", "预测指标"));
    metricTabs.querySelectorAll("[data-metric]").forEach((button) => {
      const active = button.dataset.metric === metric;
      button.hidden = !isID && button.dataset.metric !== "psnr";
      button.disabled = button.hidden;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    chart.setAttribute("role", "list");
    chart.setAttribute(
      "aria-label",
      `${label}: ${metricName}, ${t(higher ? "higher is better" : "lower is better", higher ? "越高越好" : "越低越好")}`,
    );
    chart.innerHTML = rows
      .map((row) => {
        const value = row[key];
        const model = row.id === "nwm-xl-ego4d" ? "NWM†" : row.model;
        const number = value.toFixed(3);
        const accessible = `${model}, ${row.parameters_millions}M ${t("parameters", "参数")}: ${metricName} ${number}${higher ? " dB" : ""}${value === best ? t(", best reported", "，本表最优") : ""}`;
        return `<div class="chart-row${row.id === "opennwm" ? " ours" : ""}" role="listitem" aria-label="${escapeHTML(accessible)}"><span class="chart-model-label" aria-hidden="true">${escapeHTML(model)}<small>${row.parameters_millions.toLocaleString("en-US")}M ${t("params", "参数")}</small></span><div class="chart-track" aria-hidden="true"><div class="chart-bar" style="--value:${(value / axisMaximum) * 100}%"></div></div><span class="chart-number" aria-hidden="true">${number}</span></div>`;
      })
      .join("");
    const split = isID
      ? t(
          "ID average: RECON, SCAND, HuRoN, TartanDrive.",
          "域内平均：RECON、SCAND、HuRoN、TartanDrive。",
        )
      : `${label}.`;
    element("chart-footnote").textContent =
      `${split} ${t("Direct prediction at 4 s · Table 1. NWM†: CDiT-XL + Ego4D. Bars start at zero.", "4 秒直接预测 · 表 1。NWM†：CDiT-XL + Ego4D。条形从零起算。")}`;
    element("chart-direction").textContent = higher
      ? t("HIGHER IS BETTER ↑", "越高越好 ↑")
      : t("LOWER IS BETTER ↓", "越低越好 ↓");
  }

  domainSelect.addEventListener("change", () => {
    state.domain = domainSelect.value;
    renderResults();
  });
  metricTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-metric]");
    if (!button || button.disabled || state.domain !== "id") return;
    state.idMetric = button.dataset.metric;
    renderResults();
  });
  const render = () => {
    renderMethod();
    renderResults();
  };
  render();
  return { render };
}
