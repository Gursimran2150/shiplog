#!/usr/bin/env bash
# Converts Playwright recordings (docs/media/raw/*.webm) into README-friendly media:
# an H.264 MP4 (full quality, links/players) and an optimized GIF (plays inline on GitHub).
set -euo pipefail
cd "$(dirname "$0")/.."
for src in docs/media/raw/*.webm; do
  name=$(basename "$src" .webm)
  width=880; [ "$name" = "mobile" ] && width=360
  # Skip the seconds spent creating the demo account (written by capture-docs.mjs).
  start=0; [ -f "docs/media/raw/$name.trim" ] && start=$(cat "docs/media/raw/$name.trim")
  ffmpeg -loglevel error -y -ss "$start" -i "$src" -vf "scale=1280:-2:flags=lanczos" -c:v libx264 -crf 24 -preset slow \
    -pix_fmt yuv420p -movflags +faststart -an "docs/media/$name.mp4"
  ffmpeg -loglevel error -y -ss "$start" -i "$src" -filter_complex \
    "setpts=PTS/1.25,fps=12,scale=${width}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
    "docs/media/$name.gif"
done
ls -la docs/media/*.mp4 docs/media/*.gif | awk '{print $5, $NF}'
