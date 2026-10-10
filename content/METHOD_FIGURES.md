# Original paper figures

The method section displays Figure 2 (framework, PDF page 3) and Figure 3
(three-stage training, PDF page 7) from `assets/paper/OpenNWM.pdf`.

Both PNGs are 432 DPI composite renders of the original PDF artwork, including
all raster, vector, and text layers. They are not redrawn, relabeled, recolored,
or reconstructed from individual embedded images. The surrounding paper captions
are excluded. Exact crop bounds, dimensions, and source/output SHA256 hashes are
recorded in `assets/paper/method-figures.json`.

The page preserves each complete figure and its aspect ratio. Both figures link
to their full-resolution PNG, so readers can inspect the original on small screens.
The accompanying English and Chinese text summarizes Sections 3.2–3.4 and the
three-stage pipeline described in Section 4.1.

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
