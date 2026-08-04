#!/usr/bin/env python3
"""Render scene.html frame by frame and encode it to a vertical video."""
import base64, os, subprocess, sys, shutil
from playwright.sync_api import sync_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.environ.get("CANVAS_FONTS", "/mnt/skills/examples/canvas-design/canvas-fonts")
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "out.mp4")
ONLY = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None
W, H, FPS = 1080, 1920, 30
CHROME = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome"

def datauri(path, mime):
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()

def build_html():
    html = open(os.path.join(HERE, "scene.html"), encoding="utf-8").read()
    return (html
        .replace("__FONT_REG__",  datauri(os.path.join(FONTS, "Outfit-Regular.ttf"), "font/ttf"))
        .replace("__FONT_BOLD__", datauri(os.path.join(FONTS, "Outfit-Bold.ttf"), "font/ttf"))
        .replace("__BOB__",  datauri(os.path.join(HERE, "bob.png"), "image/png"))
        .replace("__BIRD__", datauri(os.path.join(HERE, "bird.png"), "image/png")))

def main():
    frames = os.path.join(HERE, "frames")
    if ONLY is None:
        shutil.rmtree(frames, ignore_errors=True)
        os.makedirs(frames, exist_ok=True)
    else:
        os.makedirs(os.path.join(HERE, "probe"), exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME,
                                    args=["--force-device-scale-factor=1",
                                          "--disable-lcd-text",
                                          "--font-render-hinting=none"])
        page = browser.new_page(viewport={"width": W, "height": H}, device_scale_factor=1)
        page.set_content(build_html(), wait_until="load")
        page.wait_for_function("window.__ready === true", timeout=30000)
        dur = page.evaluate("window.__duration")

        if ONLY is not None:
            for t in ONLY:
                page.evaluate("t => window.seek(t)", t)
                page.screenshot(path=os.path.join(HERE, "probe", f"t{t:.2f}.png"))
            browser.close()
            print("probe frames written")
            return

        n = int(round(dur * FPS))
        for i in range(n):
            page.evaluate("t => window.seek(t)", i / FPS)
            page.screenshot(path=os.path.join(frames, f"f{i:05d}.png"))
            if i % 150 == 0:
                print(f"  {i}/{n}", flush=True)
        browser.close()

    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS),
                    "-i", os.path.join(frames, "f%05d.png"),
                    "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-profile:v", "high",
                    "-movflags", "+faststart", OUT], check=True)
    print(f"wrote {OUT} ({n} frames = {n/FPS:.2f}s)")

if __name__ == "__main__":
    main()
