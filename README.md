# OpenNWM 项目网页

OpenNWM 的独立公开网站：论文、真实模型预测视频、数据集场景和交互式研究结果。原生 HTML / CSS / JavaScript，无前端依赖或构建步骤。

网站地址：<https://b0b8k1ng.github.io/OpenNWM/>。

## 免费部署

公开仓库名称为 **B0B8K1ng/b0b8k1ng.github.io**，在 **Settings → Pages → Source** 选择 **GitHub Actions**。推送到 `main` 会自动部署；也可在 **Actions → Deploy website to GitHub Pages → Run workflow** 手动运行。

网页源文件保持在仓库根目录，工作流将其发布到 `OpenNWM/`。用户站点根地址和旧的 `/OpenNWM-website/` 地址会跳转到 `/OpenNWM/`。

本仓库保存网站内容。训练与评测实现位于私人仓库 [B0B8K1ng/OpenNWM](https://github.com/B0B8K1ng/OpenNWM)，访问代码需要协作者权限。

## 本地预览

在本仓库根目录使用任意已有 Python 3：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8000>。视频、字体和论文均在 `assets/` 中，浏览不依赖模型权重、原始数据或 GPU。

## 修改内容

- `index.html`：布局与中英固定文案。
- `style.css`：样式与手机布局。
- `app.js`、`research.js`：视频、数据集、方法与结果交互。
- `content/paper.json`：论文数据；出处见 `content/PAPER_SOURCES.md`。
- `content/demos.json`、`content/datasets.json`：素材路径与来源信息。
- `assets/`：展示素材；字体许可见 `assets/fonts/*-OFL.txt`。

修改后提交并推送 `main`，等待 Pages 部署完成即可。所有素材路径相对于网站根目录。

模型视频来自已完成的真实推理归档，并非实时生成；数据集展示为 15 个 NavAnywhere 来源及 4 个 NWM 后训练来源，后者不计入 NavAnywhere 总量。论文当前为匿名稿件、ICLR 2027 审稿中，引用信息为临时版本。
