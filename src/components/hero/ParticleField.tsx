"use client";

/**
 * The atmosphere layer: mist motes, floating droplets and slow bokeh.
 *
 * A canvas rather than DOM nodes, because forty independently drifting
 * elements is forty composited layers and a phone will not thank you for it.
 *
 * Two performance decisions worth keeping:
 *  - soft particles are pre-rendered once into small offscreen sprites and
 *    blitted with drawImage. Building a radial gradient per particle per
 *    frame is the classic way to make a particle canvas crawl.
 *  - the canvas is sized to devicePixelRatio, capped at 2. On a 3x phone the
 *    third pixel is invisible and costs 125% more fill.
 *
 * It does not own a rAF loop — it subscribes to the hero's single clock.
 */

import { useEffect, useRef } from "react";
import type { FrameFn } from "./useHeroMotion";
import { hashRandom } from "./useHeroMotion";

type Kind = 0 | 1 | 2; // 0 mist, 1 droplet, 2 bokeh

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

function seedMotes(count: number): Mote[] {
  const out: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const a = hashRandom(i * 1.7 + 3);
    const b = hashRandom(i * 4.3 + 19);
    const c = hashRandom(i * 2.9 + 47);
    const d = hashRandom(i * 6.1 + 83);
    const e = hashRandom(i * 8.7 + 131);

    /* Roughly: half mist, a third droplets, the rest bokeh. */
    const kind: Kind = e < 0.5 ? 0 : e < 0.82 ? 1 : 2;

    out.push({
      x: a,
      y: b,
      r: kind === 0 ? 14 + c * 34 : kind === 1 ? 1 + c * 2.2 : 6 + c * 16,
      vx: (d - 0.5) * 0.012,
      vy: -(0.006 + c * 0.022),
      /* Mist is deliberately near-invisible per mote. Thirty of them under
         `lighter` accumulate fast, and a heavy hand here reads as a grey
         rectangle sitting on the page rather than as air. */
      a: kind === 0 ? 0.03 + c * 0.05 : kind === 1 ? 0.35 + c * 0.5 : 0.1 + c * 0.16,
      wob: 0.004 + d * 0.014,
      phase: e * Math.PI * 2,
      kind,
    });
  }
  return out;
}

export interface ParticleFieldProps {
  /** Subscribe to the hero's shared rAF clock. */
  subscribe: (fn: FrameFn) => () => void;
  count: number;
  /** Active juice colour — bokeh picks it up so the air matches the drink. */
  tint: string;
  /** Reduced motion: paint one composed frame and stop. */
  still?: boolean;
  className?: string;
}

export function ParticleField({
  subscribe,
  count,
  tint,
  still = false,
  className = "",
}: ParticleFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motes = useRef<Mote[]>([]);
  const size = useRef({ w: 0, h: 0, dpr: 1 });
  const tintRef = useRef(tint);
  const sprites = useRef<{
    mist: HTMLCanvasElement | null;
    drop: HTMLCanvasElement | null;
    bokeh: HTMLCanvasElement | null;
  }>({ mist: null, drop: null, bokeh: null });

  tintRef.current = tint;

  /* ---- sprites: rebuilt only when the tint changes ---- */
  useEffect(() => {
    sprites.current = {
      mist: makeSprite(64, "rgba(247,241,228,0.55)", "rgba(247,241,228,0)", 0.02),
      drop: makeSprite(32, "rgba(255,255,255,0.95)", "rgba(255,255,255,0)", 0.35),
      bokeh: makeSprite(64, hexToRgba(tint, 0.75), hexToRgba(tint, 0), 0.15),
    };
  }, [tint]);

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
    motes.current = seedMotes(count);
  }, [count]);

  /* ---- painting ---- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const draw: FrameFn = (t, dt) => {
      const { w, h, dpr } = size.current;
      if (w === 0 || h === 0) return;

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
          m.kind === 1 ? 0.65 + 0.35 * Math.sin(t * 1.1 + m.phase * 2) : 1;

        const sprite =
          m.kind === 0 ? sp.mist : m.kind === 1 ? sp.drop : sp.bokeh;
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
  }, [subscribe, still, count]);

  /* A canvas has hard edges and the atmosphere must not. The mask feathers
     the whole layer into the frame so there is never a visible rectangle. */
  const feather =
    "radial-gradient(ellipse 76% 74% at 50% 48%, #000 42%, rgba(0,0,0,0.35) 78%, transparent 100%)";

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ maskImage: feather, WebkitMaskImage: feather }}
    />
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(212,166,60,${alpha})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export default ParticleField;
