# Go2 navigation gallery

`go2.js` reads `content/go2.json`. The current version is **3**, with `status:
"ready"` and eight selected clips from four recordings. The gallery follows the
paper overview and main results, before Visualization. It displays all selected
clips together: two columns on desktop, one on phones. There is no full-recording
player, clip selector, route/duration badge, report button or direct-video button.

## Current selection and protocol

The archive contains 40 quality-approved clips. The current presentation selects
two clips per recording, covering corridors, a lobby, a cafe, woodland and
courtyards. All eight have more than 13% lower ATE **and** RPE for OpenNWM than
NWM. Selection was made after measuring model performance; these are curated
qualitative comparisons, not an independent benchmark. The paper's aggregate
scores remain unchanged.

The selected durations are 20–28 seconds. Both models use the same one-second
local planning horizon, recorded starting contexts, goals and CEM budget within
each clip. Original DDPM checkpoints are used, not DMD2. These are offline plans;
the model predictions were not executed on the robot. Reference trajectories
come from onboard odometry in meters, with approximate visual camera alignment.
The original paired one-/two-second pilot, exact inference settings and all
per-goal results remain in the archive and report.

Each comparison film emphasizes the recorded third-person view and includes
synchronized first-person GT, genuine OpenNWM/NWM rollouts, recorded/planned
trajectories, and ATE/RPE values with downward arrows. Preserve the unaltered
model-generated frames, including visible prediction errors. Do not introduce
camera-obstructed intervals when replacing or expanding clips.

`content/go2.json` is authoritative for the **current displayed selection**.
`assets/go2/report.json` retains all 40 reviewed clips and their original protocol;
its historical statements about retaining all clips describe the archive, not
the eight-card gallery. Per-clip metrics and trajectory CSV files remain available
through manifest paths even though the page does not show download controls.

## Manifest contract

Example field structure; actual metric values belong to the reviewed results:

```json
{
  "version": 3,
  "status": "ready",
  "clips": [
    {
      "id": "stable_clip_id",
      "episode": "stable_recording_id",
      "title": "Scene description",
      "title_zh": "场景描述",
      "duration_s": 24,
      "start_time_s": 0,
      "goal_interval_s": 1,
      "video": "assets/go2/stable_clip_id/comparison.mp4",
      "poster": "assets/go2/stable_clip_id/poster.webp",
      "metrics": {
        "opennwm": {"ate_m": null, "rpe_m": null},
        "nwm": {"ate_m": null, "rpe_m": null}
      },
      "downloads": {
        "metrics": "assets/go2/stable_clip_id/metrics.json",
        "trajectories": "assets/go2/stable_clip_id/trajectories.csv"
      }
    }
  ],
  "report": "assets/go2/report.json",
  "selection": {
    "kind": "curated qualitative comparisons",
    "source_clip_count": 40,
    "display_clip_count": 8,
    "criteria": "Document the actual review and selection criteria."
  }
}
```

Replace the illustrative `null` metrics with verified numbers before publication;
never invent missing results. Preserve exact aggregation, per-goal values and
`evaluated_goal_ids` where present. `duration_s` is the encoded film duration;
record any difference from source motion time in the report. Use `status:
"pending"` for unreviewed material.

Asset paths are relative to the website root, start with `assets/go2/`, and contain
only letters, digits, underscores, hyphens, dots and slashes. Keep cache query
strings out of the manifest; the frontend applies its publication revision.
Additional provenance fields are allowed. Legacy `full`, `summary` and
`protocol` sections are not rendered as separate gallery panels.

## Playback and delivery

Films use 16:9 H.264 MP4, `yuv420p` and `+faststart`. The page requests muted,
inline, looping autoplay without playback controls or click-to-pause handlers.
The shared `media-scheduler.js` loads nearby clips, plays visible clips, and
releases distant transfers/decoders. It resumes playback when the gallery
returns to view. Browser autoplay restrictions still apply.

`media-delivery.js` uses the pinned ModelScope mirror selected by
`content/media-delivery.json`, with per-resource fallback to the site's own
assets. The `site-20261029-v3` mirror includes exactly the eight selected Go2
folders and all non-Go2 website assets. Its file bytes match the website copies;
this delivery change performs no video re-encoding or quality reduction. All
older website assets, full aligned recordings and NAS inference archives remain
intact.

## Production and provenance

Source tools are maintained in the [OpenNWM source repository](https://github.com/B0B8K1ng/OpenNWM):

- `tools/publish_go2_gallery.py` creates web copies from reviewed NAS masters,
  preserves metrics/CSV/poster bytes, and validates decoding, durations, frame
  counts, faststart and size budgets. Existing published web films were encoded
  at 1920×1080, CRF 22, medium preset; original masters remain separate.
- `tools/publish_website_media.py` stages the active website media, uploads
  byte-identical files to ModelScope, verifies remote sizes/SHA256, and pins a
  release tag. It does not change source video quality.

Do not rerun a full-gallery exporter merely to change the eight-card selection;
that can replace the curated manifest. Review `content/go2.json` after any export.
Keep original recordings, aligned complete videos, independent GT/model rollouts,
source hashes and private validation logs in the NAS archive. Publication
receipts must identify master/web hashes and any retained originals; do not
remove original media or existing audit files while updating the presentation.
Only scrubbed reports and portable relative paths belong on the public site.

After changing the selected clips, verify clip count/order, paired metrics,
scene diversity, desktop/mobile layout, autoplay, mirror access and local fallback
at [the real-world gallery](https://b0b8k1ng.github.io/OpenNWM/#go2-navigation).
