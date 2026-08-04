#!/usr/bin/env bash
# Rebuild the UTern hook video from scene.html.
#
#   ./build.sh path/to/soundtrack.wav
#
# Renders every frame deterministically through headless Chromium, then muxes
# the audio underneath. Re-run after editing the beat sheet in scene.html.
set -euo pipefail
cd "$(dirname "$0")"

AUDIO="${1:-}"
OUT="${OUT:-utern-hook-9x16.mp4}"

FFMPEG="$(python3 -c 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())' 2>/dev/null || echo ffmpeg)"

# --- fonts: Inter Tight + JetBrains Mono, inlined as base64 so rendering is offline ---
if [ ! -f fonts/embed.css ]; then
  echo "==> fetching fonts"
  mkdir -p fonts
  for spec in "Inter+Tight:wght@700;800;900" "JetBrains+Mono:wght@500;700"; do
    curl -sS "https://fonts.googleapis.com/css2?family=${spec}&display=swap" \
      -o "fonts/$(echo "$spec" | cut -d: -f1).css"
  done
  python3 - <<'PY'
import re, base64, urllib.request, glob
out = []
for f in glob.glob('fonts/*.css'):
    if f.endswith('embed.css'): continue
    for m in re.finditer(r"@font-face \{(.*?)\}", open(f).read(), re.S):
        b = m.group(1)
        fam = re.search(r"font-family: '([^']+)'", b).group(1)
        wt  = re.search(r"font-weight: (\d+)", b).group(1)
        url = re.search(r"url\((https[^)]+)\)", b).group(1)
        data = urllib.request.urlopen(url).read()
        out.append("@font-face{font-family:'%s';font-style:normal;font-weight:%s;"
                   "src:url(data:font/ttf;base64,%s) format('truetype');}"
                   % (fam, wt, base64.b64encode(data).decode()))
open('fonts/embed.css', 'w').write("\n".join(out))
print("fonts/embed.css written")
PY
fi

[ -d node_modules/playwright ] || npm i playwright --no-audit --no-fund

echo "==> rendering frames"
node capture.js all frames

echo "==> encoding"
if [ -n "$AUDIO" ]; then
  # The music ends on its own at ~9.2s. Everything after that in the source clip
  # belongs to the reference video's own outro sting, so it gets trimmed off and
  # the logo card plays out silent.
  "$FFMPEG" -y -hide_banner -loglevel error \
    -framerate 30 -i frames/f%05d.png -i "$AUDIO" \
    -filter_complex "[1:a]atrim=0:9.25,asetpts=N/SR/TB,afade=t=out:st=9.15:d=0.10,apad[a]" \
    -map 0:v -map "[a]" -t 10.40 \
    -c:v libx264 -preset slow -crf 21 -maxrate 12M -bufsize 24M \
    -pix_fmt yuv420p -profile:v high -level 4.2 -movflags +faststart -r 30 \
    -c:a aac -b:a 192k -ar 44100 "$OUT"
else
  echo "   (no audio argument — rendering silent)"
  "$FFMPEG" -y -hide_banner -loglevel error \
    -framerate 30 -i frames/f%05d.png -t 10.40 \
    -c:v libx264 -preset slow -crf 21 -maxrate 12M -bufsize 24M \
    -pix_fmt yuv420p -profile:v high -level 4.2 -movflags +faststart -r 30 "$OUT"
fi

echo "==> $OUT"
