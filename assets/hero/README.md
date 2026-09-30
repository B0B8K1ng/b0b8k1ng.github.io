# Earth, Moon, Mars and the navigation video wall

`journey.mp4` is one silent 1920 × 1080, 24 fps H.264 film. It travels
through 12 Earth environments, two lunar environments and two Martian
environments, then pulls back into an 18-second, 15 × 15 video wall.
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
`mosaic.startSeconds` identifies the start of the wall in that film.
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
to soften loops. The whole film loops back to Earth after the wall.

With the datasets available locally, run from the source repository:

```bash
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py sample
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py prepare
conda run --no-capture-output -n base python -u tools/build_website_cinematic.py render
```

`prepare` reuses reviewed source-frame caches. `render` writes the merged
film, posters and manifest. The public manifest can reconstruct the selected
frames if the local `curation.json` is absent. The runtime uses OpenCV,
NumPy, Pillow and FFmpeg; encoding runs on CPU. Local defaults store caches
and review sheets on NAS. Other machines can set `OPENNWM_NAV_ROOT`,
`OPENNWM_LUSNAR_ROOT`, `OPENNWM_SYNMARS_ROOT` and `OPENNWM_MEDIA_WORK_DIR`.
