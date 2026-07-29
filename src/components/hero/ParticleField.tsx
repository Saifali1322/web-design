"use client";

/**
 * The atmosphere layer: warm haze and bokeh behind the product, suspended
 * droplets in front of it.
 *
 * A canvas rather than DOM nodes, because forty independently drifting
 * elements is forty composited layers and a phone will not thank you for it.
 *
 * Three performance decisions worth keeping:
 *  - soft particles are pre-rendered once into small offscreen sprites and
 *    blitted with drawImage. Building a radial gradient per particle per
 *    frame is the classic way to make a particle canvas crawl.
 *  - the canvas is sized to devicePixelRatio, capped at 2. On a 3x phone the
 *    third pixel is invisible and costs 125% more fill.
 *  - it does not own a rAF loop — it subscribes to the hero's single clock.
 *
 * Two instances are used: `role="haze"` sits behind the bottles and carries
 * the golden-hour air, `role="spray"` sits in front and carries the droplets
 * thrown off the splash. Splitting them is what lets the product sit *inside*
 * the atmosphere rather than under a sheet of it.
 */

import { useEffect, useRef } from "react";
import type { FrameFn } from "./useHeroMotion";
import { hashRandom } from "./useHeroMotion";

/** 0 haze, 1 droplet, 2 bokeh */
type Kind = 0 | 1 | 2;

export type FieldRole = "haze" | "spray";

interface Mote {
  x: number; // 0..1 of width
  y: number; // 0..1 of height
  r: number; // radius in css px at scale 1
  vx: number;
  vy: number;
  a: number; // base alpha
  wob: number;
  phase: number;
  kind: Kind;
}

function makeSprite(
  size: number,
  inner: string,
  outer: string,
  hardness: number,
): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (!g) return null;
  const half = size / 2;
  const grad = g.createRadialGradient(half, half, 0, half, half, half);
  grad.addColorStop(0, inner);
  grad.addColorStop(hardness, inner);
  grad.addColorStop(1, outer);
  g.fillStyle = grad;
  g.beginPath();
  g.arc(half, half, half, 0, Math.PI * 2);
  g.fill();
  return c;
}

function seedMotes(count: number, role: FieldRole): Mote[] {
  const out: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const a = hashRandom(i * 1.7 + 3);
    const b = hashRandom(i * 4.3 + 19);
    const c = hashRandom(i * 2.9 + 47);
    const d = hashRandom(i * 6.1 + 83);
    const e = hashRandom(i * 8.7 + 131);

    /* Behind the product: mostly haze, with big soft bokeh for depth. In
       front: droplets, plus a little haze to soften the edge of the frame. */
    const kind: Kind =
      role === "haze" ? (e < 0.62 ? 0 : 2) : e < 0.86 ? 1 : 0;

    out.push({
      x: a,
      y: b,
      r:
        kind === 0
          ? (role === "haze" ? 18 : 10) + c * (role === "haze" ? 46 : 22)
          : kind === 1
            ? 1.1 + c * 2.6
            : 9 + c * 26,
      vx: (d - 0.5) * 0.012,
      /* Droplets hang and rise slowly; haze and bokeh drift up more slowly
         still. Nothing in this scene should ever look like it is falling. */
      vy: -(0.005 + c * (kind === 1 ? 0.018 : 0.016)),
      /* Haze is deliberately near-invisible per mote. Thirty of them under
         `lighter` accumulate fast, and a heavy hand here reads as a grey
         rectangle sitting on the page rather than as air. */
      a:
        kind === 0
          ? 0.025 + c * 0.045
          : kind === 1
            ? 0.3 + c * 0.45
            : 0.07 + c * 0.12,
      wob: 0.004 + d * 0.014,
      phase: e * Math.PI * 2,
      kind,
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * Colour, kept as rgb triples so the tint can be crossfaded per frame
 * ------------------------------------------------------------------ */

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return [212, 166, 60];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => [
  Math.round(a[0] + (b[0] - a[0]) * t),
  Math.round(a[1] + (b[1] - a[1]) * t),
  Math.round(a[2] + (b[2] - a[2]) * t),
];

const rgba = (c: Rgb, alpha: number) =>
  `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;

export interface ParticleFieldProps {
  /** Subscribe to the hero's shared rAF clock. */
  subscribe: (fn: FrameFn) => () => void;
  count: number;
  /** Active juice colour — bokeh picks it up so the air matches the drink. */
  tint: string;
  role?: FieldRole;
  /** Reduced motion: paint one composed frame and stop. */
  still?: boolean;
  className?: string;
}

export function ParticleField({
  subscribe,
  count,
  tint,
  role = "haze",
  still = false,
  className = "",
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motes = useRef<Mote[]>([]);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const sprites = useRef<{
    haze: HTMLCanvasElement | null;
    drop: HTMLCanvasElement | null;
    bokeh: HTMLCanvasElement | null;
  }>({ haze: null, drop: null, bokeh: null });

  /* The bokeh has to follow the selected flavour, but rebuilding its sprite
     on the render that changes `tint` would snap the colour while the bottle
     is still crossfading. Instead the tint is eased in the frame loop and the
     sprite rebuilt in coarse steps — a dozen 64px gradients over 700ms, which
     is nothing, and the change reads as a light change rather than a swap. */
  const fade = useRef({
    from: toRgb(tint),
    to: toRgb(tint),
    p: 1,
    built: -1,
  });

  const buildBokeh = (c: Rgb) => {
    sprites.current.bokeh = makeSprite(64, rgba(c, 0.8), rgba(c, 0), 0.12);
  };

  useEffect(() => {
    const s = fade.current;
    s.from = mixRgb(s.from, s.to, s.p);
    s.to = toRgb(tint);
    s.p = 0;
    s.built = -1;
  }, [tint]);

  /* ---- sprites ---- */
  useEffect(() => {
    sprites.current.haze = makeSprite(
      64,
      "rgba(250,236,206,0.5)",
      "rgba(250,236,206,0)",
      0.02,
    );
    sprites.current.drop = makeSprite(
      32,
      "rgba(255,250,236,0.95)",
      "rgba(255,250,236,0)",
      0.3,
    );
    const s = fade.current;
    buildBokeh(mixRgb(s.from, s.to, s.p));
    s.built = s.p;
  }, []);

  /* ---- sizing ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resize = () => {
      const r = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(r.width));
      const h = Math.max(1, Math.round(r.height));
      if (w === size.current.w && h === size.current.h && dpr === size.current.dpr) {
        return;
      }
      size.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  /* ---- population ---- */
  useEffect(() => {
    motes.current = seedMotes(count, role);
  }, [count, role]);

  /* ---- painting ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const draw: FrameFn = (t, dt) => {
      const { w, h, dpr } = size.current;
      if (w === 0 || h === 0) return;

      const s = fade.current;
      if (s.p < 1) {
        s.p = dt > 0 ? Math.min(1, s.p + dt / 0.7) : 1;
        if (s.p === 1 || Math.abs(s.p - s.built) > 0.09) {
          buildBokeh(mixRgb(s.from, s.to, s.p));
          s.built = s.p;
        }
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const list = motes.current;
      const sp = sprites.current;

      for (let i = 0; i < list.length; i++) {
        const m = list[i];

        if (dt > 0) {
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.y < -0.12) {
            m.y = 1.12;
            m.x = hashRandom(t * 0.37 + i * 2.11);
          }
          if (m.x < -0.15) m.x = 1.15;
          else if (m.x > 1.15) m.x = -0.15;
        }

        const wobble = Math.sin(t * 0.55 + m.phase) * m.wob;
        const px = (m.x + wobble) * w;
        const py = m.y * h;

        /* Fade in and out at the edges of the frame so nothing pops. */
        const edge =
          Math.min(1, Math.max(0, (1.12 - m.y) * 5)) *
          Math.min(1, Math.max(0, (m.y + 0.12) * 5));

        const breathe =
          m.kind === 1 ? 0.6 + 0.4 * Math.sin(t * 0.9 + m.phase * 2) : 1;

        const sprite =
          m.kind === 0 ? sp.haze : m.kind === 1 ? sp.drop : sp.bokeh;
        if (!sprite) continue;

        ctx.globalAlpha = m.a * edge * breathe;
        const d = m.r * 2;
        ctx.drawImage(sprite, px - m.r, py - m.r, d, d);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    if (still) {
      /* One composed frame, then nothing. Needs a beat for the ResizeObserver
         and sprite effects to have run. */
      const id = requestAnimationFrame(() => draw(6, 0));
      return () => cancelAnimationFrame(id);
    }

    return subscribe(draw);
  }, [subscribe, still, count, role]);

  /* A canvas has hard edges and the atmosphere must not. The mask feathers
     the whole layer into the frame so there is never a visible rectangle. The
     front layer is feathered harder still: droplets crossing the outline of
     the scene would give away that this is a box. */
  const feather =
    role === "haze"
      ? "radial-gradient(ellipse 78% 76% at 50% 46%, #000 44%, rgba(0,0,0,0.4) 80%, transparent 100%)"
      : "radial-gradient(ellipse 70% 70% at 50% 52%, #000 30%, rgba(0,0,0,0.5) 68%, transparent 96%)";

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ maskImage: feather, WebkitMaskImage: feather }}
    />
  );
}

export default ParticleField;
