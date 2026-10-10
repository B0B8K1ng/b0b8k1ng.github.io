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
  function methodFigure({
    figure,
    title,
    description,
    file,
    width,
    height,
    alt,
  }) {
    const fullSize = t("View full size ↗", "查看原图 ↗");
    const linkLabel = t(
      `Open paper Figure ${figure} at full resolution in a new tab`,
      `在新标签页查看论文图 ${figure} 原图`,
    );
    return `<figure class="method-paper-figure">
      <figcaption class="method-figure-caption">
        <div class="method-figure-heading"><h3>${escapeHTML(title)}</h3><a class="method-full-size" href="assets/paper/${file}" target="_blank" rel="noopener" aria-label="${escapeHTML(linkLabel)}">${fullSize}</a></div>
        <p>${escapeHTML(description)}</p>
      </figcaption>
      <a class="method-figure-link" href="assets/paper/${file}" target="_blank" rel="noopener" aria-label="${escapeHTML(linkLabel)}"><img src="assets/paper/${file}" width="${width}" height="${height}" alt="${escapeHTML(alt)}" loading="lazy" decoding="async"></a>
    </figure>`;
  }

  function renderMethod() {
    steps.parentElement.classList.add("method-overview");
    steps.removeAttribute("role");
    steps.removeAttribute("aria-label");
    steps.innerHTML = methodFigure({
      figure: 2,
      title: t("A shared action space from video", "从视频学习共享动作空间"),
      description: t(
        "A latent action model learns motion from frame pairs, with visual reconstruction and physical-motion supervision. Its inferred actions let the diffusion world model learn future observations from NavAnywhere videos without recorded controls.",
        "潜在动作模型通过视觉重建与物理运动监督，从前后帧中学习运动表示。它推断的潜在动作，让扩散世界模型无需录制控制指令，就能从 NavAnywhere 视频中学习预测未来画面。",
      ),
      file: "figure-2-framework.png",
      width: 2352,
      height: 720,
      alt: t(
        "Original paper Figure 2: the latent action model and visual context condition a diffusion transformer to predict future frames.",
        "论文图 2 原图：潜在动作模型与视觉上下文共同为扩散 Transformer 提供条件，预测未来画面。",
      ),
    });
    panel.removeAttribute("role");
    panel.removeAttribute("aria-live");
    panel.removeAttribute("aria-labelledby");
    panel.removeAttribute("tabindex");
    panel.innerHTML = methodFigure({
      figure: 3,
      title: t(
        "From latent actions to physical controls",
        "从潜在动作到物理控制",
      ),
      description: t(
        "After latent-action pretraining, the world model is frozen while a physical-action encoder warms up. Joint post-training then aligns both on action-labeled videos, enabling navigation planning through predicted futures.",
        "完成潜在动作预训练后，先冻结世界模型，预热物理动作编码器；再用带动作标注的视频联合训练两者，实现基于未来预测的导航规划。",
      ),
      file: "figure-3-training.png",
      width: 2124,
      height: 576,
      alt: t(
        "Original paper Figure 3: latent-action pretraining on NavAnywhere, action-encoder warmup with the world model frozen, and joint post-training.",
        "论文图 3 原图：在 NavAnywhere 上进行潜在动作预训练、冻结世界模型预热动作编码器，以及联合后训练。",
      ),
    });
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
        const accessible = `${model}: ${metricName} ${number}${higher ? " dB" : ""}${value === best ? t(", best reported", "，已报告最优") : ""}`;
        return `<div class="chart-row${row.id === "opennwm" ? " ours" : ""}" role="listitem" aria-label="${escapeHTML(accessible)}"><span class="chart-model-label" aria-hidden="true">${escapeHTML(model)}</span><div class="chart-track" aria-hidden="true"><div class="chart-bar" style="--value:${(value / axisMaximum) * 100}%"></div></div><span class="chart-number" aria-hidden="true">${number}</span></div>`;
      })
      .join("");
    element("chart-footnote").textContent = "NWM†: CDiT-XL + Ego4D";
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
