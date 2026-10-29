const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function initResearch(paper, getLanguage) {
  const method = document.getElementById("method-overview");
  const results = document.getElementById("paper-results");
  const t = (en, zh) => getLanguage().startsWith("zh") ? zh : en;
  const columns = [
    { key: "id_lpips", label: "LPIPS ↓", direction: "lower" },
    { key: "id_dreamsim", label: "DreamSim ↓", direction: "lower" },
    { key: "id_psnr", label: "PSNR ↑", direction: "higher" },
    { key: "go_stanford_psnr", label: "Go Stanford", direction: "higher" },
    { key: "tum_psnr", label: "TUM RGB-D", direction: "higher" },
    { key: "planetary_rover_psnr", label: "Planetary Rover", direction: "higher" },
    { key: "office_go2_psnr", label: "Office-Go2", direction: "higher" },
  ];
  const navigationDatasets = [
    { key: "recon", label: "RECON" },
    { key: "scand", label: "SCAND" },
    { key: "office_go2", label: "Office Go2 · OOD" },
  ];
  const navigationColumns = navigationDatasets.flatMap(({ key }) => [
    { key: `${key}_ate`, label: "ATE ↓", direction: "lower" },
    { key: `${key}_rpe`, label: "RPE ↓", direction: "lower" },
  ]);

  function renderRows(rows, metrics, decimals, groupStarts) {
    const rankings = metrics.map(({ key, direction }) => [...new Set(rows.map((row) => row[key]).filter(Number.isFinite))]
      .sort((a, b) => direction === "higher" ? b - a : a - b));
    return rows.map((row) => `<tr${row.id === "opennwm" ? ' class="results-ours"' : ""}>
      <th scope="row">${escapeHTML(row.model)}</th>
      <td>${Number.isFinite(row.params_m) ? row.params_m.toLocaleString("en-US") : "—"}</td>
      ${metrics.map(({ key }, index) => {
        const value = row[key];
        let number = Number.isFinite(value) ? value.toFixed(decimals) : "—";
        if (Number.isFinite(value) && value === rankings[index][0]) number = `<strong>${number}</strong>`;
        else if (Number.isFinite(value) && value === rankings[index][1]) number = `<span class="results-second">${number}</span>`;
        return `<td${groupStarts.includes(index) ? ' class="results-domain-start"' : ""}>${number}</td>`;
      }).join("")}
    </tr>`).join("");
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
    results.innerHTML = `<div class="results-table-card">
      <div class="results-table-scroll" role="region" tabindex="0" aria-label="${t("Table 1: future prediction results. Scroll horizontally for all metrics.", "表 1：未来预测结果，可横向滚动查看全部指标。")}">
        <table class="results-table">
          <caption>${t("Table 1 · Future prediction at 4 s", "表 1 · 4 秒未来预测")}</caption>
          <colgroup><col class="results-model-column"><col class="results-params-column"><col span="3"><col span="4"></colgroup>
          <thead>
            <tr><th scope="col" rowspan="2">${t("Model", "模型")}</th><th scope="col" rowspan="2">Params. (M)</th><th scope="colgroup" colspan="3">${t("In-domain", "域内")}</th><th class="results-domain-start" scope="colgroup" colspan="4">${t("Out-of-domain · PSNR (dB) ↑", "域外 · PSNR (dB) ↑")}</th></tr>
            <tr>${columns.map((column, index) => `<th scope="col"${index === 3 ? ' class="results-domain-start"' : ""}>${escapeHTML(column.label)}</th>`).join("")}</tr>
          </thead>
          <tbody>${renderRows(prediction.rows, columns, 3, [3])}</tbody>
        </table>
      </div>
      <p class="results-table-note">${t("In-domain", "域内")}: ${escapeHTML(prediction.id_datasets.join(" · "))}. NWM†: CDiT-XL + Ego4D.</p>
    </div>
    <div class="results-table-card">
      <div class="results-table-scroll" role="region" tabindex="0" aria-label="${t("Table 2: navigation results. Scroll horizontally for all metrics.", "表 2：导航结果，可横向滚动查看全部指标。")}">
        <table class="results-table results-navigation-table">
          <caption>${t("Table 2 · Navigation performance", "表 2 · 导航性能")}</caption>
          <colgroup><col class="results-model-column"><col class="results-params-column"><col span="6"></colgroup>
          <thead>
            <tr><th scope="col" rowspan="2">${t("Model", "模型")}</th><th scope="col" rowspan="2">Params. (M)</th>${navigationDatasets.map(({ label }, index) => `<th scope="colgroup" colspan="2"${index ? ' class="results-domain-start"' : ""}>${escapeHTML(label)}</th>`).join("")}</tr>
            <tr>${navigationColumns.map(({ label }, index) => `<th scope="col"${index === 2 || index === 4 ? ' class="results-domain-start"' : ""}>${label}</th>`).join("")}</tr>
          </thead>
          <tbody>${renderRows(navigation.rows, navigationColumns, 2, [2, 4])}</tbody>
        </table>
      </div>
      <p class="results-table-note">${t("ATE / RPE in meters · ↓ lower is better · — not reported", "ATE / RPE 单位为米 · ↓ 越低越好 · — 未报告")}</p>
    </div>
    <p class="results-ranking-note">${t("Bold: best · Underlined: second best", "粗体：最优 · 下划线：次优")}</p>`;
  }

  const render = () => { renderMethod(); renderMainResults(); };
  render();
  return { render };
}
