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
  const results = element("paper-results");
  const t = (en, zh) => (getLanguage().startsWith("zh") ? zh : en);
  function renderMethod() {
    const label = t("Open the original method figure at full resolution", "查看完整尺寸的方法原图");
    const alt = t(
      "OpenNWM architecture from the paper: a latent action model learns motion from video, and a diffusion world model predicts future observations conditioned on actions and visual context.",
      "论文中的 OpenNWM 架构原图：潜在动作模型从视频学习运动，扩散世界模型根据动作与视觉上下文预测未来观测。",
    );
    method.querySelector(".method-figure-link").setAttribute("aria-label", label);
    method.querySelector("img").alt = alt;
  }

  const metric = (key, label, direction = "lower", digits = 3) => ({
    key, label, direction, digits,
  });

  function table({ title, rows, columns, label = (row) => row.model, labelTitle, note = "" }) {
    const best = columns.map(({ key, direction }) => {
      const values = rows.map((row) => row[key]).filter(Number.isFinite);
      return direction === "higher" ? Math.max(...values) : Math.min(...values);
    });
    const headers = columns.map(({ label: name, direction }) =>
      `${name} ${direction === "higher" ? "↑" : "↓"}`,
    );
    return `<div class="results-table-card">
      <table class="results-table${columns.length > 4 ? " results-table--wide" : ""}">
        <caption>${escapeHTML(title)}</caption>
        <thead><tr><th scope="col">${escapeHTML(labelTitle || t("Model", "模型"))}</th>${headers.map((name) => `<th scope="col">${escapeHTML(name)}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((row) => `<tr${row.id === "opennwm" ? ' class="results-ours"' : ""}><th scope="row">${escapeHTML(label(row))}</th>${columns.map(({ key, digits }, i) => {
          const value = row[key];
          if (!Number.isFinite(value)) return `<td data-label="${escapeHTML(headers[i])}" aria-label="${escapeHTML(t("Not reported", "未报告"))}">—</td>`;
          const number = value.toFixed(digits);
          return `<td data-label="${escapeHTML(headers[i])}">${value === best[i] ? `<strong>${number}</strong>` : number}</td>`;
        }).join("")}</tr>`).join("")}</tbody>
      </table>${note ? `<p class="results-table-note">${escapeHTML(note)}</p>` : ""}
    </div>`;
  }

  function group(id, title, tables, note = "") {
    return `<section class="results-group" aria-labelledby="${id}-title">
      <h3 id="${id}-title">${escapeHTML(title)}</h3>
      <div class="results-table-grid${tables.length === 1 ? " results-table-grid--single" : ""}">${tables.join("")}</div>
      ${note ? `<p class="results-group-note">${escapeHTML(note)}</p>` : ""}
    </section>`;
  }

  function renderResults() {
    if (!results) return;
    const data = paper.results;
    const prediction = data.direct_prediction;
    const modelName = (row) => row.id === "opennwm" ? "OpenNWM" : row.model;
    const predictionTables = [
      table({
        title: t("In-domain · 4 s", "域内 · 4 秒"),
        rows: prediction.rows,
        columns: [metric("id_lpips", "LPIPS"), metric("id_dreamsim", "DreamSim"), metric("id_psnr", "PSNR (dB)", "higher")],
        note: prediction.id_datasets.join(" · "),
      }),
      table({
        title: t("Out-of-domain · PSNR (dB)", "域外 · PSNR (dB)"),
        rows: prediction.rows,
        columns: [metric("go_stanford_psnr", "Go Stanford", "higher"), metric("tum_psnr", "TUM RGB-D", "higher"), metric("planetary_rover_psnr", "Planetary Rover", "higher"), metric("office_go2_psnr", "Office-Go2", "higher")],
      }),
    ];
    const navigationTables = [
      ["recon", "RECON"], ["scand", "SCAND"],
      ["office_go2", t("Office-Go2 · Out-of-domain", "Office-Go2 · 域外")], ["tartan_drive", "TartanDrive"],
    ].map(([key, title]) => table({
      title,
      rows: data.navigation.rows,
      columns: [metric(`${key}_ate`, "ATE (m)", "lower", 2), metric(`${key}_rpe`, "RPE (m)", "lower", 2)],
    }));
    const ablationColumns = [
      metric("direct_lpips", "Direct LPIPS"), metric("autoregressive_lpips", "Autoregressive LPIPS"),
      metric("recon_ate", "RECON ATE (m)"), metric("recon_rpe", "RECON RPE (m)"),
      metric("scand_ate", "SCAND ATE (m)"), metric("scand_rpe", "SCAND RPE (m)"),
    ];
    const ablationNote = t(
      "Direct: Office-Go2, 4 s. Autoregressive: Go Stanford, 4 FPS, up to 4 s.",
      "直接预测：Office-Go2，4 秒。自回归预测：Go Stanford，4 FPS，最长 4 秒。",
    );
    results.innerHTML = [
      group("future-prediction-results", t("Future prediction", "未来预测"), predictionTables, "NWM†: CDiT-XL + Ego4D"),
      group("navigation-results", t("Navigation", "导航"), navigationTables, t("— Not reported", "— 未报告")),
      group("lam-results", t("Latent action reconstruction", "潜在动作重建"), [table({
        title: t("In-domain and out-of-domain", "域内与域外"),
        rows: data.lam_reconstruction.rows,
        label: modelName,
        columns: [metric("id_psnr", "ID PSNR (dB)", "higher"), metric("id_lpips", "ID LPIPS"), metric("ood_psnr", "OOD PSNR (dB)", "higher"), metric("ood_lpips", "OOD LPIPS")],
        note: t("ID: RECON · SCAND · HuRoN. OOD: Go Stanford.", "域内：RECON · SCAND · HuRoN。域外：Go Stanford。"),
      })]),
      group("conditioning-results", t("Time and latent action conditioning", "时间与潜在动作条件"), [table({
        title: t("Conditioning ablation", "条件消融"),
        labelTitle: t("Conditioning", "条件"),
        label: (row) => row.time && row.latent ? t("Time + latent action", "时间 + 潜在动作") : row.time ? t("Time only", "仅时间") : row.latent ? t("Latent action only", "仅潜在动作") : t("Neither", "均不使用"),
        rows: data.conditioning_ablation.rows,
        columns: ablationColumns,
        note: ablationNote,
      })]),
      group("lam-supervision-results", t("Visual and physical supervision", "视觉与物理监督"), [table({
        title: t("LAM supervision ablation", "LAM 监督消融"),
        labelTitle: t("Supervision", "监督"),
        label: (row) => row.label,
        rows: data.lam_supervision_ablation.rows,
        columns: ablationColumns,
        note: ablationNote,
      })]),
      group("semantic-results", t("Latent action semantic consistency", "潜在动作语义一致性"), [table({
        title: "Macro-6 Recall (%)",
        labelTitle: t("Supervision", "监督"),
        label: (row) => row.label,
        rows: data.semantic_consistency.rows,
        columns: [metric("recon", "RECON", "higher", 0), metric("sacson", "SACSoN", "higher", 0), metric("scand", "SCAND", "higher", 0), metric("tartan_drive", "TartanDrive · OOD", "higher", 0), metric("go_stanford", "Go Stanford · OOD", "higher", 0)],
      })]),
      group("scaling-results", t("Scaling action-free pretraining", "无动作标注预训练数据规模"), [table({
        title: "RECON · 4 s",
        labelTitle: t("Pretraining data", "预训练数据"),
        label: (row) => `${row.unlabeled_data_percent}%`,
        rows: data.scaling.points,
        columns: [metric("dreamsim", "DreamSim", "lower", 5)],
      })]),
    ].join("");
  }

  const render = () => {
    renderMethod();
    renderResults();
  };
  render();
  return { render };
}
