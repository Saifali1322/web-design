/**
 * Design-loop capture.
 *
 * Drives the running site with a real browser and writes one JSON report plus a
 * set of screenshots per run. Everything in here is measured, not judged — the
 * subjective half of the rubric is scored by hand against the screenshots this
 * produces. Keeping the two apart is the point: the numbers below cannot be
 * talked up between iterations.
 *
 *   pnpm dev                      # in another shell
 *   node design-loop/capture.mjs  # writes design-loop/runs/<stamp>/
 *
 * Env:
 *   BASE   base url            (default http://localhost:3000)
 *   LABEL  folder name         (default timestamp)
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.BASE ?? "http://localhost:3000";
const LABEL = process.env.LABEL ?? new Date().toISOString().replace(/[:.]/g, "-");
const OUT = path.join("design-loop", "runs", LABEL);

/** Chromium ships with the image; do not let Playwright fetch its own. */
const EXECUTABLE = process.env.CHROME_PATH ?? "/opt/pw-browsers/chromium";

const ROUTES = ["/", "/menu", "/mixer", "/subscribe", "/delivery", "/allergens"];
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

/**
 * Runs inside the page. Returns the structural facts the rubric leans on —
 * heading order, alt coverage, tap-target size, and whether anything overflows
 * the viewport horizontally, which is the single most common mobile defect.
 */
function auditInPage() {
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({
    level: Number(h.tagName[1]),
    text: (h.textContent ?? "").trim().slice(0, 60),
  }));

  // A jump of more than one level (h2 -> h4) breaks screen-reader navigation.
  let skips = 0;
  for (let i = 1; i < headings.length; i++) {
    if (headings[i].level - headings[i - 1].level > 1) skips++;
  }

  const imgs = [...document.querySelectorAll("img")];
  const decorative = (el) =>
    el.getAttribute("aria-hidden") === "true" || el.getAttribute("role") === "presentation";
  const missingAlt = imgs.filter((i) => !i.hasAttribute("alt") && !decorative(i)).length;

  // WCAG 2.2 SC 2.5.8 Target Size (Minimum), including its exceptions — without
  // them this counts every inline link in a paragraph and the number is noise.
  const interactive = [...document.querySelectorAll("a,button,[role=button],input,select")];
  const visible = interactive.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

  const undersized = visible.filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width < 24 || r.height < 24;
  });

  /** Inline exception: the target sits in a sentence or block of text. */
  const isInline = (el) => {
    if (getComputedStyle(el).display !== "inline") return false;
    const parent = el.parentElement;
    if (!parent) return false;
    // Real surrounding prose, not just whitespace between stacked links.
    const own = (el.textContent ?? "").trim();
    const around = (parent.textContent ?? "").trim();
    return around.length > own.length + 10;
  };

  /**
   * Spacing exception: undersized is acceptable if a 24px circle centred on the
   * target does not overlap the circle of any other target.
   */
  const centre = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };
  const hasSpacing = (el) => {
    const a = centre(el);
    return !visible.some((other) => {
      if (other === el) return false;
      const b = centre(other);
      return Math.hypot(a.x - b.x, a.y - b.y) < 24;
    });
  };

  const failing = undersized.filter((el) => !isInline(el) && !hasSpacing(el));

  const small = failing.length;
  const smallDetail = failing.slice(0, 6).map((el) => {
    const r = el.getBoundingClientRect();
    return {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent ?? "").trim().slice(0, 32),
      size: `${Math.round(r.width)}x${Math.round(r.height)}`,
    };
  });
  const smallExempt = undersized.length - failing.length;

  const docWidth = document.documentElement.scrollWidth;
  const overflowX = docWidth > window.innerWidth + 1;
  const wideNodes = overflowX
    ? [...document.querySelectorAll("body *")]
        .filter((el) => el.getBoundingClientRect().right > window.innerWidth + 1)
        .slice(0, 5)
        .map((el) => el.tagName.toLowerCase() + (el.className ? "." + String(el.className).split(" ")[0] : ""))
    : [];

  return {
    h1Count: headings.filter((h) => h.level === 1).length,
    headingSkips: skips,
    headings: headings.slice(0, 12),
    imgCount: imgs.length,
    missingAlt,
    smallTargets: small,
    smallTargetsExempt: smallExempt,
    smallTargetDetail: smallDetail,
    overflowX,
    docWidth,
    wideNodes,
    title: document.title,
    metaDescription:
      document.querySelector('meta[name="description"]')?.getAttribute("content")?.slice(0, 120) ?? null,
  };
}

async function capture(browser, viewport, route) {
  const ctx = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text().slice(0, 200)));
  page.on("pageerror", (e) => consoleErrors.push("PAGEERROR: " + e.message.slice(0, 200)));
  page.on("response", (r) => {
    if (r.status() >= 400) failedRequests.push({ status: r.status(), url: r.url().slice(0, 140) });
  });

  const started = Date.now();
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60_000 });
  const loadMs = Date.now() - started;

  // Scroll the whole page so reveal-on-scroll content is actually rendered
  // before anything is measured or photographed. Without this every section
  // below the fold reads as empty and every number taken from it is a lie.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
    await new Promise((r) => setTimeout(r, 400));
  });

  const audit = await page.evaluate(auditInPage);

  const lcp = await page.evaluate(
    () =>
      new Promise((resolve) => {
        let v = 0;
        try {
          new PerformanceObserver((list) => {
            for (const e of list.getEntries()) v = e.startTime;
          }).observe({ type: "largest-contentful-paint", buffered: true });
        } catch {
          return resolve(null);
        }
        setTimeout(() => resolve(Math.round(v)), 600);
      }),
  );

  const slug = route === "/" ? "home" : route.replace(/\//g, "-").replace(/^-/, "");
  await page.screenshot({
    path: path.join(OUT, `${viewport.name}-${slug}.png`),
    fullPage: true,
  });

  await ctx.close();

  return {
    route,
    viewport: viewport.name,
    loadMs,
    lcp,
    consoleErrors: [...new Set(consoleErrors)],
    consoleErrorCount: consoleErrors.length,
    failedRequestCount: failedRequests.length,
    failedRequests: failedRequests.slice(0, 8),
    ...audit,
  };
}

const browser = await chromium.launch({ executablePath: EXECUTABLE });
await mkdir(OUT, { recursive: true });

const results = [];
for (const viewport of VIEWPORTS) {
  for (const route of ROUTES) {
    process.stdout.write(`  ${viewport.name} ${route} ... `);
    try {
      const r = await capture(browser, viewport, route);
      results.push(r);
      console.log(
        `${r.consoleErrorCount} console, ${r.failedRequestCount} failed, ` +
          `h1=${r.h1Count}, alt-missing=${r.missingAlt}${r.overflowX ? ", OVERFLOW-X" : ""}`,
      );
    } catch (err) {
      console.log("FAILED:", err.message.slice(0, 100));
      results.push({ route, viewport: viewport.name, error: err.message.slice(0, 200) });
    }
  }
}
await browser.close();

/** Totals the loop actually steers on. */
const totals = {
  consoleErrors: results.reduce((n, r) => n + (r.consoleErrorCount ?? 0), 0),
  failedRequests: results.reduce((n, r) => n + (r.failedRequestCount ?? 0), 0),
  routesMissingH1: results.filter((r) => r.h1Count === 0).length,
  routesMultipleH1: results.filter((r) => r.h1Count > 1).length,
  headingSkips: results.reduce((n, r) => n + (r.headingSkips ?? 0), 0),
  missingAlt: results.reduce((n, r) => n + (r.missingAlt ?? 0), 0),
  smallTargets: results.reduce((n, r) => n + (r.smallTargets ?? 0), 0),
  smallTargetsExempt: results.reduce((n, r) => n + (r.smallTargetsExempt ?? 0), 0),
  routesWithOverflowX: results.filter((r) => r.overflowX).length,
  worstLcp: Math.max(0, ...results.map((r) => r.lcp ?? 0)),
};

await writeFile(
  path.join(OUT, "report.json"),
  JSON.stringify({ base: BASE, label: LABEL, at: new Date().toISOString(), totals, results }, null, 2),
);

console.log("\n── totals ──");
for (const [k, v] of Object.entries(totals)) console.log(`  ${k}: ${v}`);
console.log(`\nwrote ${OUT}/report.json`);
