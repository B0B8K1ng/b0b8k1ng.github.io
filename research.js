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
    const best = columns.map(({ key, direction }) => {
      const values = prediction.rows.map((row) => row[key]).filter(Number.isFinite);
      return direction === "higher" ? Math.max(...values) : Math.min(...values);
    });
    results.innerHTML = `<div class="results-table-card">
      <div class="results-table-scroll" role="region" tabindex="0" aria-label="${t("Table 1: future prediction results. Scroll horizontally for all metrics.", "表 1：未来预测结果，可横向滚动查看全部指标。")}">
        <table class="results-table">
          <caption>${t("Table 1 · Direct visual prediction at 4 seconds", "表 1 · 4 秒直接视觉预测")}</caption>
          <colgroup><col class="results-model-column"><col span="3"><col span="4"></colgroup>
          <thead>
            <tr><th scope="col" rowspan="2">${t("Model", "模型")}</th><th scope="colgroup" colspan="3">${t("In-domain", "域内")}</th><th class="results-domain-start" scope="colgroup" colspan="4">${t("Out-of-domain · PSNR (dB) ↑", "域外 · PSNR (dB) ↑")}</th></tr>
            <tr>${columns.map((column, index) => `<th scope="col"${index === 3 ? ' class="results-domain-start"' : ""}>${escapeHTML(column.label)}</th>`).join("")}</tr>
          </thead>
          <tbody>${prediction.rows.map((row) => `<tr${row.id === "opennwm" ? ' class="results-ours"' : ""}><th scope="row">${escapeHTML(row.model)}</th>${columns.map(({ key }, index) => {
            const value = row[key];
            const number = Number.isFinite(value) ? value.toFixed(3) : "—";
            return `<td${index === 3 ? ' class="results-domain-start"' : ""}>${value === best[index] ? `<strong>${number}</strong>` : number}</td>`;
          }).join("")}</tr>`).join("")}</tbody>
        </table>
      </div>
      <p class="results-table-note">${t("In-domain", "域内")}: ${escapeHTML(prediction.id_datasets.join(" · "))}. ${t("PSNR in dB. Bold: best per metric.", "PSNR 单位为 dB。粗体为各列最优。")} NWM†: CDiT-XL + Ego4D.</p>
    </div>`;
  }

  const render = () => { renderMethod(); renderMainResults(); };
  render();
  return { render };
}
