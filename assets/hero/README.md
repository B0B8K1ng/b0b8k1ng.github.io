# First-person hero media

These are editorial source-data films, not OpenNWM predictions. They contain
no composited entities. Model outputs belong to the separate evaluation and
demo sections.

## Exports and sources

- `journey.mp4` shows diverse Earth navigation environments, then the Moon,
  then Mars. It stays in the source camera's first-person view and does not
  append the video wall. `../../content/cinematic.json` records exact scene
  timings and English/Chinese names; the website displays these names above
  the video so mobile cropping cannot hide them.
- `mosaic.mp4` is an 18-second pullback to a 15 × 15 wall of **225 distinct
  trajectories from all 15 NavAnywhere sources**. Every tile has its own short
  English scene name burned into the image. Source quotas vary according to
  the number of available trajectories; tiles do not duplicate trajectories
  to fill the grid.
- Both films are silent, 1920 × 1080, 24 fps H.264, with corresponding WebP
  posters. Exact durations and final frame windows are in the manifest.

Earth frames come from existing NavAnywhere datasets. The Moon segment is
**LuSNAR simulation**, not lunar mission footage. Mars uses **one authentic
Zhurong observation** with an editorial camera move, not a continuous driving
sequence. These two planetary sources are separate from the NavAnywhere wall.

Scene labels describe visible environments; source attribution, trajectory
identifiers, selected frame filenames, and processing notes remain in the
manifest. No generated sprites, human figures, robot overlays, or contact
shadows are added. Original footage may naturally contain people or visible
parts of the recording platform.

## Editing and reproducibility

Source frames are center-cropped to 16:9 and resized. The journey samples the
nearest real frame inside each segment, without blending or synthesizing
intermediate frames; brief crossfades occur only between different scenes.
Presentation speeds and the wall's camera pullback are editing choices. Short
wall clips use frame blending and play forward and backward to soften loop
boundaries. Visual continuity does not establish identical ground-truth
actions across datasets. The journey loops from its final Mars scene back to
Earth only when the webpage's video player restarts it.

From the repository root, with the local datasets available:

```bash
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py sample
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py prepare
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py render
```

`sample` validates the reviewed selection and produces labeled contact sheets.
`prepare` caches the selected source frames, reusing matching legacy caches.
`render` exports the films, posters, and public manifest. The tool first reads
local `curation.json`; if absent, the public manifest reconstructs the reviewed
selection, including exact frame filenames and bilingual scene names.

The runtime needs OpenCV, NumPy, Pillow, and system FFmpeg; encoding runs on
CPU. Check free disk space before rebuilding. Local defaults keep caches and
review sheets on NAS. Other machines can set `OPENNWM_NAV_ROOT`,
`OPENNWM_LUSNAR_ROOT`, `OPENNWM_PLANETARY_ROOT`, and `OPENNWM_MEDIA_WORK_DIR`.
The public manifest contains relative source locations, never local machine
paths. Earlier unused generated embodiment assets are archived outside the
website and are not part of these exports.
