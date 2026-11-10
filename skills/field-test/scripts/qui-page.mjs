// Helper for a Playwright script that drives or times the torrent list of qui on a local rig.
//
//   PW=<playwright package dir> node my-check.mjs     (browser.md shows how to set PW)
//
//   import { openTorrentList, SEL } from '<skill>/scripts/qui-page.mjs';
//   const q = await openTorrentList({ port: 18792 });
//   await q.tick(0); await q.tick(1);
//   const ms = await q.timeOpen(SEL.headerSetCategory);   // click -> dialog painted
//   await q.closeDialog();
//   console.log(JSON.stringify({ bundle: q.bundle, ms, errors: q.errors }));
//   await q.browser.close();
//
// The selectors are those of the English UI. If one finds nothing, the UI changed:
// explore with `playwright cli` and correct SEL here.
const { chromium } = await import(process.env.PW + '/index.mjs');

export const SEL = {
  rowCheckbox: '[aria-label="Select row"]',
  selectAll: '[aria-label="Select all"]',
  headerBar: '[role=toolbar]', // shows only while rows are ticked
  headerSetCategory: '[role=toolbar] button:has(svg.lucide-folder)',
  menuItem: '[role=menuitem]',
  openDialog: '[role=dialog][data-state=open]',
  toast: '[data-sonner-toast]',
};

export async function openTorrentList({ port, instance = 1, viewport = { width: 1600, height: 1000 }, settleMs = 6000 }) {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium' });
  let ctx, page, cdp, bundle;
  const errors = [];
  try {
    ctx = await browser.newContext({ viewport, colorScheme: 'dark', serviceWorkers: 'block' });
    page = await ctx.newPage();
    page.on('pageerror', e => errors.push(String(e)));
    cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable');

    await page.goto(`http://127.0.0.1:${port}/instances/${instance}`);
    await page.waitForSelector(SEL.rowCheckbox, { timeout: 60000 });
    bundle = await page.evaluate(() => [...document.scripts].map(s => s.src).find(s => /assets\/index-/.test(s)));
    await page.evaluate(SEL => {
      // Resolves after the next paint. A MessageChannel also fires in a hidden tab, where setTimeout is throttled.
      window.__afterPaint = () => new Promise(r => requestAnimationFrame(() => {
        const ch = new MessageChannel(); ch.port1.onmessage = () => r(performance.now()); ch.port2.postMessage(0);
      }));
      // Rejects after ms, so a selector that the UI no longer has fails the script instead of hanging it.
      window.__waitFor = (pred, what, ms = 15000) => new Promise((res, rej) => {
        if (pred()) return res();
        const mo = new MutationObserver(() => { if (pred()) { clearTimeout(timer); mo.disconnect(); res(); } });
        const timer = setTimeout(() => { mo.disconnect(); rej(new Error(`timed out after ${ms} ms waiting for ${what}`)); }, ms);
        mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-state', 'aria-checked'] });
      });
      window.__boxes = () => document.querySelectorAll(SEL.rowCheckbox);
      window.__timeOpen = async trigger => {
        const t0 = performance.now(); trigger();
        await window.__waitFor(() => document.querySelector(SEL.openDialog), 'an open dialog');
        return (await window.__afterPaint()) - t0;
      };
    }, SEL);
    await page.waitForTimeout(settleMs); // first full sync, stream connected
  } catch (err) {
    await browser.close(); // the caller has no handle to close it
    throw err;
  }

  return {
    browser, page, errors, bundle,
    // Script and task time of the page so far, in ms. Subtract two readings to cost a step.
    async metrics() {
      const { metrics } = await cdp.send('Performance.getMetrics');
      const m = Object.fromEntries(metrics.map(x => [x.name, x.value]));
      return { script: m.ScriptDuration * 1000, task: m.TaskDuration * 1000 };
    },
    // Click the checkbox of visible row i. Returns ms from the click to the paint of the new state.
    tick: i => page.evaluate(async i => {
      const want = window.__boxes()[i].getAttribute('aria-checked') === 'true' ? 'false' : 'true';
      const t0 = performance.now(); window.__boxes()[i].click();
      await window.__waitFor(() => window.__boxes()[i].getAttribute('aria-checked') === want, `row ${i} checkbox ${want}`);
      return (await window.__afterPaint()) - t0;
    }, i),
    tickedCount: () => page.evaluate(() => [...window.__boxes()].filter(b => b.getAttribute('aria-checked') === 'true').length),
    // Click the element and return ms until a dialog is open and painted.
    timeOpen: selector => page.evaluate(sel => window.__timeOpen(() => document.querySelector(sel).click()), selector),
    // Right-click visible row i, click the menu item whose text matches, return ms from that click to the painted dialog.
    timeOpenFromRowMenu: (i, itemPattern) => page.evaluate(async ([i, src, flags, SEL]) => {
      const b = window.__boxes()[i].getBoundingClientRect();
      const x = b.x + 300, y = b.y + b.height / 2;
      document.elementFromPoint(x, y).dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }));
      const re = new RegExp(src, flags);
      const find = () => [...document.querySelectorAll(SEL.menuItem)].find(m => re.test(m.textContent.trim()));
      await window.__waitFor(find, `a menu item that matches /${src}/${flags}`);
      const item = find();
      return window.__timeOpen(() => item.click());
    }, [i, itemPattern.source, itemPattern.flags, SEL]),
    dialogTitle: () => page.evaluate(() => document.querySelector('[role=dialog] h2')?.textContent ?? null),
    // Press Escape and wait until the dialog is gone from the DOM.
    async closeDialog() {
      await page.keyboard.press('Escape');
      await page.waitForSelector('[role=dialog]', { state: 'detached' });
    },
  };
}
