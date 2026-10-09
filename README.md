# OpenNWM 项目网页

OpenNWM 的独立公开网站：论文方法、视频预测、目标导航、NavAnywhere 数据集与新环境迁移。原生 HTML / CSS / JavaScript，无前端依赖或构建步骤。

网站地址：<https://b0b8k1ng.github.io/OpenNWM/>。

## 免费部署

公开仓库名称为 **B0B8K1ng/b0b8k1ng.github.io**，在 **Settings → Pages → Source** 选择 **GitHub Actions**。推送到 `main` 会自动部署；也可在 **Actions → Deploy website to GitHub Pages → Run workflow** 手动运行。

网页源文件保持在仓库根目录，工作流将根目录的 HTML、CSS、JavaScript，以及 `assets/`、`content/` 发布到 `OpenNWM/`。用户站点根地址和旧的 `/OpenNWM-website/` 地址会跳转到 `/OpenNWM/`。

本仓库保存网站内容。训练与评测实现位于私人仓库 [B0B8K1ng/OpenNWM](https://github.com/B0B8K1ng/OpenNWM)，访问代码需要协作者权限。

## 本地预览

在本仓库根目录使用任意已有 Python 3：

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 <http://127.0.0.1:8000>。视频、字体和论文均在 `assets/` 中，浏览不依赖模型权重、原始数据或 GPU。

## 页面内容

首屏提供论文、Code 和 NavAnywhere 数据集入口。页面依次介绍方法、NavAnywhere、运动预测、预测基准、导航与交互体验，最后展示新环境迁移。默认英语，可手动切换中文。

- **方法**：依照论文介绍像素与动作双重监督的潜在动作模型、无动作标注视频预训练，以及物理动作对齐与 CEM 导航规划；同时展示三阶段训练流程。
- **In Motion**：9 条轨迹，以紧凑网格展示真实观测与 OpenNWM 预测，可拖动 GT / OpenNWM 分割滑块对照。
- **导航**：3 组包含连续转弯或左右变向的目标图像导航结果，展示起点、目标、OpenNWM 预测与实际优化出的轨迹。素材来自独立离线规划实验，论文导航基准另行展示。
- **NavAnywhere**：15 个预训练数据来源及 4 个后训练数据来源的连续帧视频；后者不计入 NavAnywhere 总量。
- **Beyond Earth**：页面末尾展示 3 个月面仿真场景的微调结果，说明模型经少量微调迁移到预训练未见环境的能力。

展示视频均来自已完成的推理归档。轨迹演示支持鼠标和触屏交互，公开静态站点播放预计算素材；任意轨迹的实时预测需要另行连接推理服务。本仓库不包含模型权重或推理服务。

## 修改内容

- `index.html`：布局与中英固定文案。
- `style.css`、`method.css`：整体样式、手机布局与方法介绍。
- `app.js`、`research.js`：视频、数据集、方法与结果交互。
- `motion-gallery.js`、`motion-gallery.css`：9 条运动预测轨迹与 GT / OpenNWM 对照滑块。
- `navigation.js`、`navigation.css`：目标导航结果展示。
- `cinematic.js`、`playground.js`：首屏影片、月面迁移展示和轨迹交互。
- `content/paper.json`：论文数据；出处见 `content/PAPER_SOURCES.md`。
- `content/demos.json`、`content/navigation.json`、`content/datasets.json`：预测、导航和数据集素材路径与来源信息。
- `content/cinematic.json`、`content/space.json`、`content/playground.json`：首屏影片、月面迁移和轨迹演示的场景与素材。
- `assets/`：展示素材；字体许可见 `assets/fonts/*-OFL.txt`。

修改后提交并推送 `main`，等待 Pages 部署完成即可。所有素材路径相对于网站根目录。

论文当前为匿名稿件、ICLR 2027 审稿中，引用信息为临时版本。定量结果来自论文表格，展示视频为精选定性案例；出处与解释见 `content/PAPER_SOURCES.md` 和各素材清单。
