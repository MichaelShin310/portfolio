const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const mode = process.argv[2] || 'all';          // 'all' | 'probe'
  const outDir = process.argv[3] || 'frames';
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--disable-lcd-text'],
  });
  const page = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    deviceScaleFactor: 1,
  });
  page.on('console', m => console.log('  [page]', m.text()));
  page.on('pageerror', e => console.log('  [ERR]', e.message));

  await page.goto('file://' + path.resolve('scene.html'), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(
    [...document.images].map(i => i.complete ? 1 : new Promise(r => { i.onload = i.onerror = r; }))
  ));
  await page.waitForTimeout(400);

  const META = await page.evaluate(() => window.META);
  console.log('META', META);

  let times;
  if (mode === 'probe') {
    times = JSON.parse(process.argv[4]);
  } else {
    times = Array.from({ length: META.FRAMES }, (_, i) => i / META.FPS);
  }

  const t0 = Date.now();
  for (let i = 0; i < times.length; i++) {
    await page.evaluate(t => window.renderFrame(t), times[i]);
    const name = mode === 'probe'
      ? `p_${times[i].toFixed(2).replace('.', '_')}.png`
      : `f${String(i).padStart(5, '0')}.png`;
    await page.screenshot({ path: path.join(outDir, name), type: 'png' });
    if (mode === 'all' && i % 40 === 0) {
      const el = (Date.now() - t0) / 1000;
      console.log(`  ${i}/${times.length}  ${el.toFixed(0)}s  eta ${(el / (i + 1) * (times.length - i)).toFixed(0)}s`);
    }
  }
  console.log(`done ${times.length} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  await browser.close();
})();
