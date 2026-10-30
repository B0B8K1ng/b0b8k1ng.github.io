# Go2 navigation gallery

`go2.js` reads `content/go2.json`, which is authoritative for the published
selection and readiness. The expanded selection contains **38 clips from 11
recordings**: eight retained clips from four earlier recordings and 30 additional
clips from seven recordings. The additions contain five, five, four, four, four,
four and four clips respectively. Publish the expansion with `status: "ready"`
only after its media and measured results have passed validation.

Each recording has its own row, title, clip count and independent navigation.
Desktop shows two clips at a time; phones show one. Previous/next buttons change
the visible clips, and one dot per clip shows the full count, highlights the
visible selection and lets the viewer jump directly to a clip. An odd final
pair overlaps the preceding pair so desktop retains two visible clips. Keyboard
arrows and Home/End also navigate the focused row. The gallery follows the paper
overview and main results, before Visualization.

## Selection and protocol

The **30 additional clips** were selected for scene/motion diversity, source
clarity and third-person visibility before model inference. First-person and
third-person source clocks were visually aligned using multiple events, then
clip intervals were frozen in each recording's alignment manifest. The seven
recordings cover varied vegetation, ground surfaces, turns and built spaces.
The night recording uses a `.qt` QuickTime third-person source, decoded
according to its actual media container.

The **eight retained clips** have a different selection history. Their original
archive contains 40 quality-approved clips; two per recording were selected
across corridors, a lobby, a cafe, woodland and courtyards. These eight were
chosen after measuring model performance and each had more than 13% lower ATE
and RPE for OpenNWM than NWM. They remain curated qualitative comparisons, not
an independent benchmark. Do not claim that the full 38-clip selection was
frozen before inference or chosen independently of model performance. The
paper's aggregate scores remain unchanged.

Selected clips are approximately 20–30 seconds. Both models use the same
one-second local planning horizon, recorded starting contexts, goals and CEM
budget within each clip. Original DDPM checkpoints are used, not DMD2. These
are offline plans; model predictions were not executed on the robot. Reference
trajectories come from onboard odometry in meters. Camera alignment is visual,
with per-recording uncertainty documented in the alignment evidence; it is not
physical clock calibration. Exact inference settings and per-goal results
remain in the archive and report.

Each film emphasizes the recorded third-person view and includes synchronized
first-person GT, genuine OpenNWM/NWM rollouts and recorded/planned trajectories.
The bottom-right ATE/RPE panel displays the **arithmetic mean across all evaluated
one-second windows of that displayed clip**, separately for each model and
metric. Those values remain constant throughout the film and match its metric
report. They are not replaced by the currently playing one-second window's
metrics. Preserve all per-window values and evaluated goal IDs in the report;
the displayed mean does not replace the underlying evidence.

Preserve the unaltered model-generated frames, including visible prediction
errors. Do not introduce camera-obstructed intervals when replacing or expanding
clips. Historical reports may describe the earlier 40-clip archive; distinguish
that archive from the current displayed selection. Metric and trajectory CSV
files remain available through manifest paths even though the page has no
download controls.

## Manifest contract

Example field structure; actual metric values belong to the reviewed results:

```json
{
  "version": 3,
  "status": "ready",
  "routes": [
    {
      "id": "route_05",
      "episode": "stable_recording_id",
      "title": "Scene description",
      "title_zh": "场景描述"
    }
  ],
  "clips": [
    {
      "id": "route_05_clip_01",
      "route_id": "route_05",
      "episode": "stable_recording_id",
      "title": "Clip description",
      "title_zh": "片段描述",
      "duration_s": 25,
      "start_time_s": 10,
      "goal_interval_s": 1,
      "video": "assets/go2/route_05_clip_01/comparison.mp4",
      "poster": "assets/go2/route_05_clip_01/poster.webp",
      "metrics": {
        "opennwm": {"ate_m": null, "rpe_m": null},
        "nwm": {"ate_m": null, "rpe_m": null}
      },
      "evaluated_goal_ids": [10, 11],
      "downloads": {
        "metrics": "assets/go2/route_05_clip_01/metrics.json",
        "trajectories": "assets/go2/route_05_clip_01/trajectories.csv"
      }
    }
  ],
  "report": "assets/go2/report.json",
  "selection": {
    "kind": "qualitative comparisons with documented selection history",
    "display_clip_count": 38,
    "criteria": "Document the pre-inference additions and historical performance-curated subset separately."
  }
}
```

`routes` and `route_id` are optional for compatibility. Grouping prefers
`route_id`, then `episode`, then a `route_N` prefix in the clip ID. Route titles
come from matching route metadata or clip `route_title`/`route_title_zh`; otherwise
the UI supplies a localized route number. Route order follows first appearance
in `clips`; clips within each route sort by `start_time_s`.

Replace illustrative `null` metrics and abbreviated goal IDs with verified
results before publication; never invent missing results. Preserve exact
aggregation, per-goal values and `evaluated_goal_ids`. `duration_s` is the encoded
film duration; record any difference from source motion time in the report.
Use `status: "pending"` for unreviewed material.

Asset paths are relative to the website root, start with `assets/go2/`, and
contain only letters, digits, underscores, hyphens, dots and slashes. Keep cache
query strings out of the manifest; the frontend applies its publication
revision. Additional provenance fields are allowed. Legacy `full`, `summary`
and `protocol` sections are not rendered as separate gallery panels.

## Playback and delivery

Films use clear 1920×1080, 16:9 H.264 MP4, `yuv420p` and `+faststart`; aligned
source material retains its native camera resolution. New aligned footage uses
30 fps, with nearest recorded first-person frames repeated where the camera's
native cadence is lower. This does not create new first-person observations.
HDR sources are tone-mapped for ordinary SDR browsers. All delivered films have
**no audio stream**, and the browser additionally requests muted, inline,
looping autoplay without playback controls or click-to-pause handlers.

The shared `media-scheduler.js` loads nearby clips, plays visible clips and
releases distant transfers/decoders. Selecting another pair replaces the two
existing video slots rather than adding decoders for every clip. On phones the
hidden second slot is unregistered and its media source is released. Playback
resumes when the gallery returns to view. Browser autoplay restrictions still
apply.

`media-delivery.js` normally uses the pinned ModelScope mirror selected by
`content/media-delivery.json`, with per-resource fallback to site assets. The
expanded Go2 release uses `localAssetPrefixes: ["go2/"]` until a matching mirror
is verified, so an older mirror cannot serve films with obsolete metric panels.
Other assets continue to follow their delivery configuration. Delivery changes
must preserve asset bytes and must not silently lower media quality.

## Production and provenance

Source tools are maintained in the [OpenNWM source repository](https://github.com/B0B8K1ng/OpenNWM):

- `tools/prepare_go2_multitrajectory.py` freezes camera alignment and source clip
  selection, encodes synchronized silent footage and validates original hashes,
  duration, cadence and audio absence.
- `tools/evaluate_go2_recording.py` prepares the frozen one-second windows and
  records the measured model results, including any skipped source windows.
- `tools/render_go2_gallery.py` composes model/source views and the constant
  whole-clip mean metric panel. `tests/test_go2_clip_mean.py` checks differing
  windows render identical mean panels and preserve source/model frames.
- `tools/publish_go2_gallery.py` creates web copies from reviewed NAS masters,
  preserves metrics/CSV/poster bytes and validates decoding, durations, frame
  counts, faststart and size budgets. Original masters remain separate.
- `tools/publish_website_media.py` stages active media, uploads byte-identical
  files to ModelScope, verifies remote sizes/SHA256 and pins a release tag.

Review `content/go2.json` after any export. Keep original recordings, aligned
complete videos, independent GT/model rollouts, source hashes and private
validation logs in the NAS archive. Publication receipts must identify master/
web hashes and any retained originals; do not remove original media or existing
audit files while updating the presentation. Only scrubbed reports and portable
relative paths belong on the public site.

After changing the selection, verify clip count/order, paired clip-mean metrics,
scene diversity, desktop/mobile navigation and dots, autoplay, decoder release
and configured delivery at [the real-world gallery](https://b0b8k1ng.github.io/OpenNWM/#go2-navigation).
