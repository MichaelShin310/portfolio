"""
Measures where the light actually is in img/hero/name-bed.mp4, frame by frame,
and prints the table that js/home.js uses to drive the name's reveal mask.

The reveal is not driven by scroll position — it is driven by how far down the
beam has reached, so the type lights as the light arrives at it. Re-run this
whenever the clip is replaced and paste the output into BEAM_Y.

    ffmpeg -i img/hero/name-bed.mp4 -vf scale=320:180 frames/f_%04d.png
    python tools/trace-beam.py frames

Needs Pillow.
"""
import glob
import os
import sys

from PIL import Image

# The name occupies roughly the left 55% of the viewport. The clip is
# object-fit: cover, so in video space that is about x 144-704 of 1280 —
# x 36-176 at the 320px working width. The crystal sits outside this band,
# which is what keeps it from being mistaken for the beam.
X0, X1 = 36, 176
THRESHOLD = 100          # of 255; catches the beam core, not its faint glow


def trace(frame_dir):
    files = sorted(glob.glob(os.path.join(frame_dir, "f_*.png")))
    if not files:
        sys.exit("no frames found in %s" % frame_dir)

    reach = []
    for path in files:
        im = Image.open(path).convert("L")
        w, h = im.size
        px = im.load()
        lowest = -1
        # Walk up from the bottom: the first row still lit is how far the
        # light has got.
        for y in range(h - 1, -1, -1):
            peak = 0
            for x in range(X0, X1, 2):
                v = px[x, y]
                if v > peak:
                    peak = v
            if peak >= THRESHOLD:
                lowest = y
                break
        reach.append(lowest / (h - 1) if lowest >= 0 else -1.0)

    # Smooth only across lit frames, so the -1 "beam not here yet" sentinel is
    # never averaged into a real reading.
    smoothed = reach[:]
    for i in range(1, len(reach) - 1):
        a, b, c = reach[i - 1], reach[i], reach[i + 1]
        if a >= 0 and b >= 0 and c >= 0:
            smoothed[i] = (a + 2 * b + c) / 4.0

    # Light that has reached a point does not un-reach it.
    high = -1.0
    for i, v in enumerate(smoothed):
        if v >= 0:
            if v < high:
                smoothed[i] = high
            else:
                high = v

    return smoothed


if __name__ == "__main__":
    vals = trace(sys.argv[1] if len(sys.argv) > 1 else "frames")
    print(",".join("-1" if v < 0 else str(int(round(v * 1000))) for v in vals))
