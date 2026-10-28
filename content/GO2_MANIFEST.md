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
        "ego": "assets/go2/<clipid>/gt_ego.mp4",
        "third_person": "assets/go2/<clipid>/gt_third_person.mp4",
        "opennwm": "assets/go2/<clipid>/opennwm.mp4",
        "nwm": "assets/go2/<clipid>/nwm.mp4",
        "trajectories": "assets/go2/<clipid>/trajectories.csv"
      }
    }
  ],
  "report": "assets/go2/report.json"
}
```

The page shows each clip's video and title immediately after the opening film.
There are no route/duration badges, report links, video links or planning labels.
Metrics and per-model downloads remain in the manifest and report; the video
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

Deploy only the Go2 changes through the separate public checkout
`/file_system/vepfs/algorithm/dujun.nie/code/OpenNWM-website`, remote
`git@github.com:B0B8K1ng/b0b8k1ng.github.io.git`. Its `main` workflow publishes
under `/OpenNWM/`. Preserve unrelated edits in both checkouts and verify
`https://b0b8k1ng.github.io/OpenNWM/#go2-navigation` after deployment.
