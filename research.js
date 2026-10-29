const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function initResearch(paper, getLanguage) {
  const method = document.getElementById("method-overview");
  const results = document.getElementById("paper-results");
  const t = (en, zh) => getLanguage().startsWith("zh") ? zh : en;
  const columns = [
    { key: "id_lpips", label: "LPIPS ↓", direction: "lower", maximum: 0.5 },
    { key: "id_dreamsim", label: "DreamSim ↓", direction: "lower", maximum: 0.3 },
    { key: "id_psnr", label: "PSNR (dB) ↑", direction: "higher", maximum: 16 },
    { key: "go_stanford_psnr", label: "Go Stanford", direction: "higher", maximum: 14 },
    { key: "tum_psnr", label: "TUM RGB-D", direction: "higher", maximum: 14 },
    { key: "planetary_rover_psnr", label: "Planetary Rover", direction: "higher", maximum: 14 },
    { key: "office_go2_psnr", label: "Office-Go2", direction: "higher", maximum: 14 },
  ];
  const navigationDatasets = [
    { key: "recon", label: "RECON" },
    { key: "scand", label: "SCAND" },
    { key: "office_go2", label: "Office Go2 · OOD" },
  ];

  function renderChart(rows, metric, decimals, table) {
    const rankings = [...new Set(rows.map((row) => row[metric.key]).filter(Number.isFinite))]
      .sort((a, b) => metric.direction === "higher" ? b - a : a - b);
    const chartId = `metric-${metric.key}`;
    return `<figure class="result-chart" data-table="${table}" data-metric="${metric.key}" aria-labelledby="${chartId}">
      <figcaption id="${chartId}">${escapeHTML(metric.label)}</figcaption>
      <ul class="result-bars">${rows.map((row) => {
        const value = row[metric.key];
        const reported = Number.isFinite(value);
        const rank = reported && value === rankings[0] ? "best" : reported && value === rankings[1] ? "second" : "";
        const number = reported ? value.toFixed(decimals) : "—";
        const model = row.id === "garrido" ? "Garrido et al." : row.model;
        const params = Number.isFinite(row.params_m) ? `${row.params_m.toLocaleString("en-US")}M` : "—";
        return `<li class="result-bar-row${row.id === "opennwm" ? " result-ours" : ""}${reported ? "" : " result-missing"}" data-model="${row.id}" data-value="${reported ? value : ""}" data-rank="${rank}">
          <span class="result-model" title="${escapeHTML(row.model)} · ${params} ${t("parameters", "参数")}">${escapeHTML(model)}</span>
          <span class="result-track" aria-hidden="true">${reported ? `<span class="result-bar" style="width:${(value / metric.maximum * 100).toFixed(3)}%"></span>` : ""}</span>
          <span class="result-value"${reported ? "" : ` aria-label="${t("Not reported", "未报告")}"`}>${rank === "best" ? `<strong>${number}</strong>` : rank === "second" ? `<span class="result-second">${number}</span>` : number}</span>
        </li>`;
      }).join("")}</ul>
      <div class="result-axis" aria-hidden="true"><span>0</span><span>${metric.maximum}</span></div>
    </figure>`;
  }

  function renderModelSizes(rows) {
    return `<p class="result-parameters"><span>${t("Parameters (M)", "参数量（M）")}</span> ${rows.map((row) => `${escapeHTML(row.model)} ${Number.isFinite(row.params_m) ? row.params_m.toLocaleString("en-US") : "—"}`).join(" · ")}</p>`;
  }

  function renderMethod() {
    if (!method) return;
    method.querySelector(".method-figure-link").setAttribute("aria-label", t(
      "Open Figure 1, overview of OpenNWM, at full resolution",
      "查看完整尺寸的图 1：OpenNWM 概览",
    ));
    method.querySelector("img").alt = t(
      "Figure 1. OpenNWM learns from diverse action-free navigation videos through latent action pretraining, enabling generalizable prediction and planning.",
      "图 1：OpenNWM 通过潜在动作预训练学习多样化的无动作标注导航视频，实现可泛化的未来预测与规划。",
    );
  }

  function renderMainResults() {
    if (!results) return;
    const prediction = paper.results.direct_prediction;
    const navigation = paper.results.navigation;
    results.innerHTML = `<section class="result-family" aria-labelledby="prediction-results-title">
      <div class="result-family-heading"><h3 id="prediction-results-title">${t("Future prediction", "未来预测")}</h3><span>${t("Table 1 · 4 s", "表 1 · 4 秒")}</span></div>
      <div class="result-group-heading">${t("In-domain", "域内")}</div>
      <div class="result-chart-grid">${columns.slice(0, 3).map((metric) => renderChart(prediction.rows, metric, 3, 1)).join("")}</div>
      <div class="result-group-heading">${t("Out-of-domain", "域外")}<span>PSNR (dB) ↑</span></div>
      <div class="result-chart-grid result-chart-grid-four">${columns.slice(3).map((metric) => renderChart(prediction.rows, metric, 3, 1)).join("")}</div>
      <p class="results-chart-note">${t("In-domain", "域内")}: ${escapeHTML(prediction.id_datasets.join(" · "))}. NWM†: CDiT-XL + Ego4D.</p>
      ${renderModelSizes(prediction.rows)}
    </section>
    <section class="result-family" aria-labelledby="navigation-results-title">
      <div class="result-family-heading"><h3 id="navigation-results-title">${t("Navigation", "导航")}</h3><span>${t("Table 2", "表 2")}</span></div>
      ${["ate", "rpe"].map((metric) => `<div class="result-group-heading">${metric.toUpperCase()} (m) ↓<span>${t("Lower is better", "越低越好")}</span></div>
      <div class="result-chart-grid">${navigationDatasets.map(({ key, label }) => renderChart(navigation.rows, { key: `${key}_${metric}`, label, direction: "lower", maximum: metric === "ate" ? 3.5 : 0.8 }, 2, 2)).join("")}</div>`).join("")}
      ${renderModelSizes(navigation.rows)}
    </section>
    <p class="results-ranking-note"><span class="results-color-key">OpenNWM</span><span>${t("Bold: best · Underlined: second best · — not reported", "粗体：最优 · 下划线：次优 · — 未报告")}</span></p>`;
  }

  const render = () => { renderMethod(); renderMainResults(); };
  render();
  return { render };
}
