const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function initResearch(paper) {
  const method = document.getElementById("method-overview");
  const results = document.getElementById("paper-results");
  const predictionMetrics = [
    { key: "id_lpips", label: "In-domain · LPIPS ↓", direction: "lower", maximum: 0.5 },
    { key: "ood_mean_psnr", label: "Out-of-domain · Mean PSNR (dB) ↑", direction: "higher", maximum: 14 },
  ];
  const oodPredictionKeys = ["go_stanford_psnr", "tum_psnr", "planetary_rover_psnr", "office_go2_psnr"];
  const navigationMetrics = [
    { key: "recon_ate", label: "RECON · ATE (m) ↓", direction: "lower", maximum: 3.5 },
    { key: "office_go2_ate", label: "Office-Go2 · ATE (m) ↓", direction: "lower", maximum: 3.5, reportedOnly: true },
  ];

  function renderChart(rows, metric, decimals, table) {
    if (metric.reportedOnly) rows = rows.filter((row) => Number.isFinite(row[metric.key]));
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
          <span class="result-model" title="${escapeHTML(row.model)} · ${params} parameters">${escapeHTML(model)}</span>
          <span class="result-track" aria-hidden="true">${reported ? `<span class="result-bar" style="width:${(value / metric.maximum * 100).toFixed(3)}%"></span>` : ""}</span>
          <span class="result-value"${reported ? "" : ' aria-label="Not reported"'}>${rank === "best" ? `<strong>${number}</strong>` : rank === "second" ? `<span class="result-second">${number}</span>` : number}</span>
        </li>`;
      }).join("")}</ul>
      <div class="result-axis" aria-hidden="true"><span>0</span><span>${metric.maximum}</span></div>
    </figure>`;
  }

  function renderMethod() {
    if (!method) return;
    method.querySelector(".method-figure-link").setAttribute("aria-label",
      "Open Figure 1, overview of OpenNWM, at full resolution");
    method.querySelector("img").alt = "Figure 1. OpenNWM learns from diverse action-free navigation videos through latent action pretraining, enabling generalizable prediction and planning.";
  }

  function renderMainResults() {
    if (!results) return;
    const prediction = paper.results.direct_prediction;
    const navigation = paper.results.navigation;
    const predictionRows = prediction.rows.map((row) => ({
      ...row,
      ood_mean_psnr: oodPredictionKeys.every((key) => Number.isFinite(row[key]))
        ? oodPredictionKeys.reduce((sum, key) => sum + row[key], 0) / oodPredictionKeys.length
        : null,
    }));
    results.innerHTML = `<section class="result-family" aria-labelledby="prediction-results-title">
      <div class="result-family-heading"><h3 id="prediction-results-title">Prediction</h3><span>In-domain &amp; out-of-domain</span></div>
      <div class="result-chart-grid">${predictionMetrics.map((metric) => renderChart(predictionRows, metric, 3, 1)).join("")}</div>
      <p class="results-chart-note">In-domain: ${escapeHTML(prediction.id_datasets.join(", "))}. Out-of-domain: equal-weight mean across ${escapeHTML(prediction.ood_datasets.join(", "))}. NWM†: CDiT-XL + Ego4D.</p>
    </section>
    <section class="result-family" aria-labelledby="navigation-results-title">
      <div class="result-family-heading"><h3 id="navigation-results-title">Navigation</h3><span>Lower is better</span></div>
      <div class="result-chart-grid">${navigationMetrics.map((metric) => renderChart(navigation.rows, metric, 2, 2)).join("")}</div>
      <p class="results-chart-note">RECON: in-domain. Office-Go2: out-of-domain; only reported baselines shown. ATE: absolute trajectory error.</p>
    </section>
    <p class="results-ranking-note"><span class="results-color-key">OpenNWM</span><span>Bold: best · Underlined: second best</span></p>`;
  }

  const render = () => { renderMethod(); renderMainResults(); };
  render();
  return { render };
}
