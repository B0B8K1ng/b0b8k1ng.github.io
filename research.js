import { initMethodAnimation } from "./method-animation.js?v=method-v7-20261010";

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
  const method = element("method-overview");
  const domainSelect = element("result-domain");
  const metricTabs = element("metric-tabs");
  const chart = element("result-chart");
  const rows = paper.results.direct_prediction.rows;
  const state = { domain: "id", idMetric: "lpips" };
  const t = (en, zh) => (getLanguage().startsWith("zh") ? zh : en);
  method.innerHTML = `<figure class="method-paper-figure method-animated-figure"><div id="method-animation"></div><a class="method-original-link" href="assets/paper/figure-3-training.png" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M3 3l6 6m12-6-6 6M3 21l6-6m12 6-6-6"/></svg></a></figure>`;
  const methodAnimation = initMethodAnimation(element("method-animation"), getLanguage);
  function renderMethod() {
    method.querySelector(".method-original-link").setAttribute("aria-label", t("Open the original training figure at full resolution", "查看完整尺寸的训练原图"));
    methodAnimation.render();
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
