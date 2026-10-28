# Go2 navigation gallery

`go2.js` consumes `content/go2.json`. Use `status: "pending"` until the real
films, posters and report have been checked. The ready gallery displays every
item in `clips`, in manifest order: two columns on desktop and one on phones.
There is no full-recording player or clip selector.

Each film contains the recorded third-person view, synchronized first-person
GT and genuine model predictions, and recorded/planned trajectories. Encode
H.264, `yuv420p`, `+faststart`, on a 16:9 canvas. All videos request muted,
inline, looping autoplay; browsers retain control of autoplay eligibility.
There are no playback controls or click-to-pause handlers. Playback retries
when a video enters the viewport, the tab becomes visible, or a user gesture
permits an earlier blocked request.

Version 2 contract (angle-bracket strings are field descriptions, not data):

```json
{
  "version": 2,
  "status": "ready",
  "clips": [
    {
      "id": "<stable clip id>",
      "episode": "<stable recording id>",
      "title": "<short scene or movement description>",
      "title_zh": "<same title in Chinese>",
      "duration_s": "<numeric encoded-video duration>",
      "video": "assets/go2/<clipid>/comparison.mp4",
      "poster": "assets/go2/<clipid>/poster.webp",
      "goal_interval_s": "<numeric planning horizon, equal for both models in this clip>",
      "metrics": {
        "opennwm": {"ate_m": "<number>", "rpe_m": "<number>"},
        "nwm": {"ate_m": "<number>", "rpe_m": "<number>"}
      },
      "downloads": {
        "metrics": "assets/go2/<clipid>/metrics.json",
        "trajectories": "assets/go2/<clipid>/trajectories.csv"
      }
    }
  ],
  "report": "assets/go2/report.json"
}
```

The page shows each clip's video and title immediately after the opening film.
There are no route/duration badges, report links, video links or planning labels.
Metrics and trajectory downloads remain in the manifest and report; the video
shows ATE and RPE with downward arrows to indicate lower error is better.
Protocol details and selection criteria belong in the report. Preserve exact
metric aggregation and per-goal values; omit missing values instead of
inventing examples. `duration_s` is the encoded film duration; record any
difference from source motion time in the report. Videos load and play near
the viewport and resume automatically on return, keeping a large gallery
responsive without user-operated playback controls.

Browser-facing asset paths must be relative to `website/`, begin with
`assets/go2/`, and contain only letters, digits, underscores, hyphens, dots and
slashes. Keep manifest paths free of cache query strings: `go2.js` adds the
current publication revision when requesting assets. The renderer may retain
additional fields in the manifest; the gallery ignores legacy `full`,
`summary` and `protocol` display sections.

Retain recordings, full aligned originals, source hashes and model outputs in
the NAS archive. Publish only reviewed films, posters and scrubbed reports;
do not include credentials or private absolute paths.

## Web publication from NAS masters

`tools/publish_go2_gallery.py` reads a renderer gallery containing
`website_manifest.json`, `report.json`, and one directory per clip. It creates
separate 1920×1080 H.264 web copies of `comparison.mp4` at CRF 22 (medium preset,
unchanged frame count/rate, no audio, `yuv420p`, `+faststart`). Posters, per-clip
`metrics.json`, `trajectories.csv`, and the full report are copied byte-for-byte.
The website manifest keeps the same clips, order, timestamps and metrics but
advertises only the metrics/CSV downloads above. Independent GT and model
rollouts remain in the NAS gallery and are not republished.

Run with an explicit runtime after the master gallery and its metrics pass
review. This command updates local files only; it does not commit or deploy:

```bash
/file_system/vepfs/algorithm/dujun.nie/miniconda3/bin/python tools/publish_go2_gallery.py \
  --source /file_system/nas/algorithm/dujun.nie/opennwm_go2_showcase_20261027/gallery_expanded \
  --retained-source /file_system/nas/algorithm/dujun.nie/opennwm_go2_showcase_20261027/gallery \
  --website /file_system/vepfs/algorithm/dujun.nie/code/OpenNWM/website \
  --website /file_system/vepfs/algorithm/dujun.nie/code/OpenNWM-website \
  --crf 22 --preset medium --jobs 2
```

`--jobs 4` is also supported. The default encoder is the explicit FFmpeg 7.0.2
binary used by the camera preparation pipeline; `--ffmpeg` and `--ffprobe`
accept absolute executable paths. Each encode prints its exact command, PID,
working directory and log path. Separate web copies and validation receipts
live in `source.parent/web_gallery_cache/<source-directory>/crf22_medium/`;
no master is overwritten. Validated unchanged copies are reused only after
their source, encoder settings and output SHA-256 hashes match.

Add `--prepare-only` to encode, validate and check both site budgets without
changing any website file. The resulting validation report says
`published: false` and `prepare_only: true`; the cache videos can be reviewed
before rerunning the same command without that flag. Successful publication
sets `published: true`.

Before touching either website, the helper verifies all required files,
decodes each newly encoded film, checks duration/frame count/codec/faststart,
and checks the final size of every target against 950,000,000 bytes (decimal
950 MB). The calculation includes all files packaged by the current Pages
workflow, not just Go2 videos. Each web film must also remain below 95 MiB.
It stops if CRF 22 does not fit; it does not silently lower quality or omit
clips. Use `--max-site-mb` only when intentionally changing the site budget.

Only existing `gt_ego.mp4`, `gt_third_person.mp4`, `opennwm.mp4`, and `nwm.mp4`
under individual Go2 clip folders are eligible for removal from the website.
Every removal must first match an intact NAS original by size and SHA-256;
a missing/different original aborts publication. Search starts in `--source`,
then any explicitly supplied `--retained-source` directories in order. This
allows a regenerated master to differ bytewise while proving the original
published copy remains intact in the older NAS gallery. The validation report
records the exact matching archive path and hash for each removal.
NAS symlinks must not point
back into a website, and destination symlinks are rejected. Other website
assets are preserved and counted against the budget. All new files use atomic
replacement; the manifest is written after its assets, and redundant videos
are removed only after their links disappear from the manifest.

The resulting `source.parent/webpublish_validation.json` records per-clip
master/web hashes, decode validation, removed website copies with original
hashes, and the measured final size of each site. Override its location with
`--validation`; this private report belongs outside the public websites.
The renderer's NAS `website_manifest.json` and inventory remain unchanged;
the web manifest intentionally differs in its download entries and videos.
Use the publication validation report for web-copy checks instead of the
master validator's byte-identical-video comparison.

Deploy only the Go2 changes through the separate public checkout
`/file_system/vepfs/algorithm/dujun.nie/code/OpenNWM-website`, remote
`git@github.com:B0B8K1ng/b0b8k1ng.github.io.git`. Its `main` workflow publishes
under `/OpenNWM/`. Preserve unrelated edits in both checkouts and verify
`https://b0b8k1ng.github.io/OpenNWM/#go2-navigation` after deployment.
