# Go2 navigation gallery

`go2.js` reads `content/go2.json`, the authoritative selection and readiness
manifest. The current gallery contains **44 clips from 11 recordings**, with
**four clips per recording**. Each recording is one scene with a short English
title. Every clip is present in the page: two columns on desktop, one on phones.
There are no scene/clip switching controls or individual clip descriptions.

## Selection and protocol

This is a **performance-curated qualitative showcase selected after evaluation**.
In **41 of 44 clips (93.18%)**, OpenNWM has lower clip-mean ATE **and** RPE than
NWM, including at the three-decimal precision displayed in the films. The
selection is not an unbiased benchmark sample; the paper's aggregate results
are unchanged. The exact selected intervals, scores, parent intervals and three
retained nonwinning clips are recorded in [go2-selection.json](go2-selection.json).

The 36 complete clips retain previously evaluated intervals. Eight clips use
shorter continuous excerpts of previously quality-approved intervals, with no
more than two excerpts per recording. Their lengths are 9, 12, 13, 16, 19, 20,
22 and 22 seconds; complete clips are 20–28 seconds. Four historical complete
clips were added or substituted to retain four examples in every scene.
Twelve films were rendered again: those four historical clips and eight
excerpts. The other 32 films retain their existing verified video bytes.

Shortening is explicit in the private render plan's `shortened_from` field:
parent ID, start and end. The renderer requires a continuous excerpt of at least
eight seconds within a documented 20–30 second parent clip. Independently of
this duration check, the beginning and end must coincide with complete local
planning windows and there must be no gaps. All selected excerpts in this
release are at least nine seconds. Source/model frames are unchanged; scores
are recomputed across **all** complete windows of each displayed excerpt.

Both models use the same one-second local planning horizon, recorded starting
contexts, goals and CEM budget within each clip. Original DDPM checkpoints are
used, not DMD2. These are offline plans; model predictions were not executed on
the robot. Reference trajectories come from onboard odometry in meters. Camera
alignment is visual, with per-recording uncertainty retained in the evidence;
it is not physical clock calibration. Exact settings, source hashes and
per-goal results remain in each clip report and the NAS archives.

Each film emphasizes the recorded third-person view and includes synchronized
first-person GT, genuine OpenNWM/NWM rollouts and recorded/planned trajectories.
The ATE/RPE panel displays the **arithmetic mean across every complete one-second
window in that displayed interval**, separately for each model and metric.
These values remain constant throughout the film and match its JSON report.
Per-window values, trajectories and evaluated goal IDs remain available through
the manifest even though the page has no download controls. Preserve visible
model prediction errors and the original source/model frames.

## Manifest contract

The manifest has `version: 3`, `status: "ready"`, `routes`, `clips`, `report`
and `selection`. `routes` provides each recording's stable ID, `episode` and
English `title`. Each clip includes:

- Stable `id`, `episode`, `route_id` and source `start_time_s`.
- Actual encoded `duration_s`, `goal_interval_s` and `evaluated_goal_ids`.
- Relative `video`, `poster`, metric JSON and trajectory CSV paths.
- Verified `metrics.opennwm` and `metrics.nwm`, each with `ate_m` and `rpe_m`.
- `metric_aggregation`, specifying the arithmetic mean of complete local plans,
  plan count, meter units and `constant_for_entire_clip` display.

Grouping prefers `episode`, then `route_id`; metadata supplies a short English
scene title. Scene order follows first appearance in `clips`; clips sort by
source start time. All 11 current scenes have exactly four clips.

Never invent missing measurements. Preserve exact aggregation, per-goal scores
and goal IDs. Keep `status: "pending"` for unreviewed media. Asset paths are
relative to the website root and start with `assets/go2/`; no local filesystem
paths belong in public reports. Additional provenance fields are allowed.

## Playback and delivery

Web films are silent 1920×1080, 24 fps H.264 MP4 with `yuv420p` and `+faststart`.
Recorded footage and saved predictions are sampled as documented in the report;
frame repetition creates no new observations. The browser requests muted,
inline, looping autoplay. The shared media scheduler registers all clip slots,
loads nearby videos, plays visible videos and releases distant transfers and
decoders. Browser autoplay restrictions still apply.

`media-delivery.js` uses the pinned delivery configuration. Go2 has
`localAssetPrefixes: ["go2/"]` until a matching mirror is verified, preventing
an older mirror from serving obsolete metric panels. The eight shortened clips
use new `_curated` asset IDs. Existing source media and previous exports are
retained in their archives.

## Production and validation

Source tools are in the [OpenNWM repository](https://github.com/B0B8K1ng/OpenNWM):

- `tools/render_go2_gallery.py` preserves source/model views and renders constant
  clip-mean panels; documented shorter excerpts still require complete windows.
- `tests/test_go2_clip_mean.py` verifies constant means, unmodified predictions
  and explicit parent bounds for shorter clips.
- `tools/validate_go2_gallery.py` binds reports to source evaluation windows,
  result hashes, exact trajectories and matching metric aggregation.
- `tools/validate_go2_video_content.py` compares beginning/middle/end video panels
  with recorded cameras and genuine saved predictions.
- `tools/publish_go2_gallery.py` creates compact web copies and checks hashes,
  full decoding, frame counts, duration, silent 1080p format and faststart.

The private `opennwm_go2_curation_20261030` NAS archive retains the complete
44-clip plan, 12-clip render plan, preceding manifest/report, source-bound metric
validation, new masters, web cache and per-process command/PID/log records.
Its `prepare_release.py` independently recomputes ATE/RPE from each saved
trajectory and checks every included plan and clip mean before publication.
The public selection provenance identifies the exact favorable intervals;
these must never be represented as an independent evaluation sample.

After publication, check every scene has four clips, video durations and scores
match the manifest, source/model panels match their evidence, and desktop/mobile
playback loads and releases videos correctly.
