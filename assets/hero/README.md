# Dataset video wall, Earth, Moon and Mars

`journey.mp4` is one silent 1920 × 1080, 24 fps H.264 film. It opens
with an 18-second, 15 × 15 dataset video wall, then travels through
12 Earth environments, two lunar environments and two Martian environments.
The wall contains **225 distinct trajectories from 15 NavAnywhere sources**
and has no text burned into its tiles. All CASIA-Nav `office_*` trajectories
are excluded; four new outdoor trajectories replace them.

These are source-data showcases, **not OpenNWM predictions**. Earth views
come from NavAnywhere. Moon views are **LuSNAR simulation**. Mars views use
the newly downloaded **SynMars-TW** dataset: contiguous numbered frames from
the `forward_9` route's left camera in the testing split. SynMars-TW depicts
a Blender-generated Mars-like environment; it is not actual Mars mission
footage. No generated entities are composited into any scene.

The public `../../content/cinematic.json` records scene/planet timings,
bilingual labels, dataset provenance and exact selected frame filenames.
Its `journey.src` and `mosaic.src` both identify the same complete film;
`mosaic.startSeconds` is zero and identifies the start of the wall in that film.
The website draws scene labels and the interactive planet navigation above
the film. The wall is intentionally unlabeled.

## Planet textures

- `earth-texture.webp`: cropped [NASA Blue Marble surface map](https://eoimages.gsfc.nasa.gov/images/imagerecords/57000/57730/land_ocean_ice_2048.png), showing blue oceans and green continents.
- `moon-texture.webp`: LuSNAR lunar source frame.
- `mars-texture.webp`: SynMars-TW surface source frame.

The three textures form the title's Earth/Moon/Mars O mark; they are not
model outputs. SynMars-TW source: [CVIR-Lab/SynMars, SynMars-TW branch](https://github.com/CVIR-Lab/SynMars/tree/SynMars-TW).

## Editing and reproduction

Source frames are center-cropped to 16:9 and resized. Within each journey
segment the closest source frame is shown without generated intermediate
frames. Brief crossfades connect scenes. The playback speeds and video-wall
pullback are editorial choices, not original camera timing or ground-truth
actions. Short wall clips play forward and backward, with frame blending
to soften loops. The whole film loops back to the dataset wall after Mars.

The current 1,505-frame film lasts 62.708333 seconds. Chapter boundaries are:

| Chapter | Start (seconds) | End (seconds) |
| --- | ---: | ---: |
| Dataset video wall | 0 | 18 |
| Earth | 18 | 40.44 |
| Moon | 40.44 | 50.88 |
| Mars | 50.88 | 62.708333 |

The October 10 reorder reuses the existing encoded source scenes. Only the
first ten wall frames were regenerated from the same reviewed tile caches to
remove the previous Mars-to-wall dissolve before moving the wall to the front.
The poster now shows the opening wall. Scene timings and the content-derived
media cache version are updated together in the public manifest.

With the datasets available locally, run from the source repository:

```bash
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py sample
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py prepare
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py render
```

To update the previous v3 Earth/Moon/Mars/wall film without rebuilding all
source clips, use `conda run --no-capture-output -n base python -u
tools/build_website_cinematic.py reorder`. This saves original media and
intermediate exports in the NAS work directory; repeating it on a v4 film
does not modify the media.

`prepare` reuses reviewed source-frame caches. `render` writes the merged
film, posters and manifest. The public manifest can reconstruct the selected
frames if the local `curation.json` is absent. The runtime uses OpenCV,
NumPy, Pillow and FFmpeg; encoding runs on CPU. Local defaults store caches
and review sheets on NAS. Other machines can set `OPENNWM_NAV_ROOT`,
`OPENNWM_LUSNAR_ROOT`, `OPENNWM_SYNMARS_ROOT` and `OPENNWM_MEDIA_WORK_DIR`.
