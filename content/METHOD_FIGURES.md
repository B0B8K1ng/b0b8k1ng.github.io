# Original paper figures

The method section animates the three-stage training Figure 3 (PDF page 7)
from `assets/paper/OpenNWM.pdf`. Figure 2 (framework, PDF page 3) is retained
as a source asset. Only one figure is presented on the page.

Both PNGs are 432 DPI composite renders of the original PDF artwork, including
all raster, vector, and text layers. Their contents are not redrawn, relabeled,
recolored, or reconstructed. Exact crop bounds, dimensions, and SHA256 hashes
are recorded in `assets/paper/method-figures.json`.

The native HTML/CSS animation overlays sequential emphasis and flowing markers
on the unchanged training image: latent-action pretraining, action-encoder warmup
with the world model frozen, then joint fine-tuning. The original fire/snowflake
indicators and labels are preserved. Desktop retains the full three-panel image;
mobile presents one complete panel at a time. An expand link opens the unmodified
full-resolution original. Playback can be paused, and each stage can be selected
for reading. Reduced motion starts paused; hidden/offscreen animation is suspended.

The concise bilingual explanation summarizes the paper's training pipeline.

Reproduce from the website directory using Python with PyMuPDF installed:

```python
import json
from pathlib import Path
import fitz

root = Path("assets/paper")
metadata = json.loads((root / "method-figures.json").read_text())
document = fitz.open(root / metadata["source"])
for figure in metadata["figures"]:
    image = document[figure["page"] - 1].get_pixmap(
        matrix=fitz.Matrix(figure["scale"], figure["scale"]),
        clip=fitz.Rect(figure["clipPoints"]),
        alpha=False,
        colorspace=fitz.csRGB,
    )
    image.save(root / figure["file"])
```
