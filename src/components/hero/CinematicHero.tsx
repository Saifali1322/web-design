"use client";

/**
 * The Juice Cartel hero.
 *
 * The brief was "the display bottle with loads around it", and the reference
 * for "loads" is the brand's own photography in `docs/reference/bottles/`:
 * cut oranges on a kitchen counter, watermelon wedges, a thick opaque pour,
 * one bottle backlit at golden hour. So this is staged as a product film
 * rather than a bottle on black —
 *
 *   a floor the bottle stands on, with a pool of the juice's own colour, a
 *   contact shadow and a reflection;
 *   a warm key from the upper left, a gold backlight behind the bottle, and
 *   soft shafts crossing the frame;
 *   real fruit at four depths — resting on the floor at the back, suspended
 *   and defocused in the air, and one big half falling out of the bottom of
 *   the frame, blurred, which is the single cue that reads as "photograph"
 *   rather than "illustration";
 *   the six other flavours on a shallow turntable behind, standing on the
 *   same floor;
 *   and the juice itself, thrown up around the base in a splash.
 *
 * Two engineering ideas hold it together:
 *
 * 1. ONE rAF LOOP. `useMotionClock` owns the only requestAnimationFrame in
 *    the hero; every moving thing subscribes to it and writes `transform` and
 *    `opacity` on its own node. No per-frame React state, no layout reads,
 *    no animated layout properties.
 *
 * 2. NO MEASUREMENT. Every position is expressed as a percentage of the
 *    animated element's own box, derived from fixed fractions of the scene.
 *    Because the scene has a locked aspect ratio, the same transform string
 *    is correct at 320px and at 1440px — so the server can render the
 *    composed scene, and there is no ResizeObserver in the hot path.
 *
 * A third rule earns its keep on cheap phones: the flavour tint is carried by
 * the inherited CSS `color` wherever it can be, so switching juice is a
 * transition on one property instead of a re-render of the whole scene.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoLockup } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { DELIVERY, formatPrice, juices } from "@/lib/catalogue";
import BottleArt, {
  BOTTLE_RATIO,
  BUBBLE_RISE,
  VB_H,
  VB_W,
  bubbleSpecs,
} from "./BottleArt";
import ParticleField from "./ParticleField";
import {
  FruitArt,
  JuiceSplash,
  isFruitKind,
  type FruitFace,
  type FruitKind,
} from "./FruitArt";
import {
  clamp,
  dampTowards,
  useHeroEnv,
  useMotionClock,
  usePointerParallax,
  type FrameFn,
} from "./useHeroMotion";

/* ------------------------------------------------------------------ *
 * Scene geometry
 *
 * Horizontal positions are fractions of the scene's WIDTH. So are vertical
 * ones — a y of 0.9 means "nine tenths of the scene's width, measured down
 * from its top". Keeping one unit for both is what makes the percentage
 * transforms below resolution-independent; `pctY` converts to CSS at the end.
 * ------------------------------------------------------------------ */

/** Scene height ÷ width. Locked, so the percentage maths stays valid. */
const ASPECT = 1.16;

const pctY = (yW: number) => (yW / ASPECT) * 100;

/**
 * Where the bottle drawing stands inside its own box. BottleArt bounds the
 * bottle tightly, so this is close to 1; it is only ever used to seat shadows
 * and reflections, where being a percent or two out is invisible.
 */
const FOOT = 0.975;

const F_CENTRE = 0.265; // hero bottle width
const F_ORBIT = 0.115; // turntable bottle width at scale 1

const CX = 0.5;
/**
 * The hero stands a little left of the ring's centre. Dead centre with a
 * symmetrical ring behind it is a diagram; a couple of percent of offset,
 * with the light coming from the other side, is a photograph.
 */
const HERO_X = 0.468;
/** The floor line the hero bottle stands on. */
const HERO_CONTACT = 0.9;
const HERO_H = F_CENTRE * BOTTLE_RATIO;
const CY = HERO_CONTACT - (FOOT - 0.5) * HERO_H;

/**
 * The turntable. A shallow ellipse — the camera is barely above the table, so
 * the far side of the ring is only an eighth of the frame higher than the near
 * side, and most of the depth has to be carried by scale and defocus.
 */
const ORB_CY = 0.78;
const ORB_RX = 0.475;
const ORB_RY = 0.125;

const TAU = Math.PI * 2;
/** One revolution every ~74 seconds. Slow enough to feel expensive. */
const ORBIT_SPEED = 0.085;
const SLOT_STEP = TAU / 6;
const N = juices.length;

/**
 * Angle for a relative slot. Slot 0 is the hero position, dead front, where
 * the bottle is hidden behind the big one; 1–6 ring the ellipse, offset by
 * half a step so that nothing ever stands directly in front of the product.
 */
function slotAngle(slot: number): number {
  if (slot === 0) return Math.PI / 2;
  return Math.PI / 2 + (slot - 3.5) * SLOT_STEP;
}

const slotOf = (i: number, active: number) => (i - active + N) % N;

/** Centre a box of width `frac` (of the scene) on the point (fx, fy). */
function place(fx: number, fy: number, frac: number): [number, number] {
  return [(fx / frac - 0.5) * 100, (fy / (frac * BOTTLE_RATIO) - 0.5) * 100];
}

/**
 * Turntable bottles are placed by their *base*, not their centre, so that the
 * ellipse is a physical contact line: everything on the ring stands on the
 * same floor, and the far bottles sit higher in frame because they are
 * further away rather than because they were nudged there.
 */
function orbitTransform(theta: number, scale: number): string {
  const bx = CX + ORB_RX * Math.cos(theta);
  const by = ORB_CY + ORB_RY * Math.sin(theta);
  const cy = by - (FOOT - 0.5) * F_ORBIT * BOTTLE_RATIO * scale;
  const [ax, ay] = place(bx, cy, F_ORBIT);
  return `translate(${ax.toFixed(2)}%, ${ay.toFixed(2)}%) scale(${scale.toFixed(4)})`;
}

const [CENTRE_AX, CENTRE_AY] = place(HERO_X, CY, F_CENTRE);

function centreTransform(scaleX: number, tilt: number): string {
  return (
    `translate(${CENTRE_AX.toFixed(2)}%, ${CENTRE_AY.toFixed(2)}%) ` +
    `rotate(${tilt.toFixed(3)}deg) scale(${scaleX.toFixed(4)}, 1)`
  );
}

/** Depth 0 (far) to 1 (near) from the orbit angle. */
const depthOf = (theta: number) => (Math.sin(theta) + 1) / 2;
const scaleOf = (d: number) => 0.46 + 0.6 * d;

/* ------------------------------------------------------------------ *
 * Fruit
 * ------------------------------------------------------------------ */

type Layer = "air" | "back" | "table" | "front";

interface Garnish {
  /** null follows the selected juice; anything else is a fixed prop. */
  kind: FruitKind | null;
  face: FruitFace;
  layer: Layer;
  /** Width as a fraction of the scene width. */
  w: number;
  /** Rest position, scene fractions. */
  x: number;
  y: number;
  /** Drift amplitude and rate. */
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  ph: number;
  /** Degrees per second. Anything above ~4 stops reading as weight. */
  spin: number;
  rot: number;
  op: number;
  /** Blur in px at 560px of scene width, scaled with the scene. */
  blur: number;
  /**
   * Exposure. Anything in front of the key light is in its own shadow, and
   * this is the difference between a foreground orange and a lens flare: at
   * full brightness a big soft piece of fruit is just a glowing blob.
   */
  dim: number;
  /** How much harder than the stage this piece answers the pointer. */
  par: number;
  fine: boolean;
  /** Draws a contact shadow under the piece, for anything sitting down. */
  seated?: boolean;
}

/**
 * The set dressing, arranged in depth rather than scattered evenly.
 *
 * The two `front` pieces do most of the work: large, heavily defocused and
 * cropped by the edge of the frame, they put something between the camera and
 * the product, which is the difference between a photograph of a table and a
 * drawing of a bottle. Everything else is quiet — the moment a piece of fruit
 * behind the product becomes legible it starts competing with it.
 */
const GARNISH: Garnish[] = [
  /* --- far side of the table, behind the ring --- */
  { kind: "orange", face: "whole", layer: "back", w: 0.095, x: 0.1, y: 0.752, ax: 0.004, ay: 0.003, sx: 0.13, sy: 0.11, ph: 0.4, spin: 0.5, rot: -8, op: 0.85, blur: 3, dim: 0.5, par: 0.01, fine: false, seated: true },
  { kind: "watermelon", face: "cut", layer: "back", w: 0.075, x: 0.3, y: 0.718, ax: 0.004, ay: 0.003, sx: 0.17, sy: 0.12, ph: 3.6, spin: 0.4, rot: -20, op: 0.8, blur: 4, dim: 0.42, par: 0.008, fine: false, seated: true },

  /* --- suspended, defocused --- */
  { kind: "pomegranate", face: "cut", layer: "air", w: 0.095, x: 0.865, y: 0.27, ax: 0.02, ay: 0.026, sx: 0.19, sy: 0.14, ph: 1.2, spin: -2.4, rot: 16, op: 0.5, blur: 5, dim: 0.5, par: 0.02, fine: false },
  { kind: "apple", face: "cut", layer: "air", w: 0.08, x: 0.145, y: 0.4, ax: 0.022, ay: 0.024, sx: 0.15, sy: 0.21, ph: 4.4, spin: 3, rot: -14, op: 0.42, blur: 6, dim: 0.45, par: 0.024, fine: false },
  { kind: null, face: "whole", layer: "air", w: 0.056, x: 0.665, y: 0.095, ax: 0.018, ay: 0.02, sx: 0.23, sy: 0.17, ph: 5, spin: -2, rot: 8, op: 0.38, blur: 7, dim: 0.42, par: 0.016, fine: false },

  /* --- on the counter beside the bottle, and the only fruit in focus.
         `04-orange-pour-kitchen.jpeg` is the reference: two halves of the
         same fruit sitting sharp in the front of the frame, everything else
         falling away behind them. Without one legible piece the rest of the
         fruit is just texture. --- */
  { kind: null, face: "cut", layer: "table", w: 0.185, x: 0.155, y: 0.855, ax: 0.003, ay: 0.002, sx: 0.1, sy: 0.09, ph: 0.9, spin: 0.35, rot: -12, op: 1, blur: 0.6, dim: 1, par: 0.022, fine: true, seated: true },
  { kind: null, face: "whole", layer: "table", w: 0.135, x: 0.815, y: 0.845, ax: 0.003, ay: 0.002, sx: 0.12, sy: 0.1, ph: 3.1, spin: -0.3, rot: 14, op: 0.98, blur: 2, dim: 0.72, par: 0.018, fine: true, seated: true },

  /* --- and one falling out of the bottom of the frame, soft and dark: the
         cue that reads as a photograph rather than an illustration --- */
  { kind: null, face: "cut", layer: "front", w: 0.42, x: -0.01, y: 1.06, ax: 0.012, ay: 0.01, sx: 0.09, sy: 0.07, ph: 2.2, spin: -1, rot: -22, op: 0.92, blur: 7, dim: 0.55, par: 0.055, fine: false },
];

/** `table` sits in front of the ring but behind the product. */
const LAYER_Z: Record<Layer, number> = { air: 3, back: 5, table: 36, front: 46 };

/** #rrggbb → rgba(), for the few places a gradient cannot use currentColor. */
function withAlpha(hex: string, a: number): string {
  const m = /^#?([\da-f]{6})$/i.exec(hex.trim());
  if (!m) return `rgba(212,166,60,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/* ------------------------------------------------------------------ *
 * Grain — the same film stock used across the site
 * ------------------------------------------------------------------ */

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** Light shafts. Width, offset across the frame, and strength. */
const SHAFTS: [number, number, number][] = [
  [3.5, 12, 0.1],
  [1.4, 26, 0.07],
  [6, 41, 0.055],
  [2.2, 62, 0.045],
];

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export function CinematicHero() {
  const env = useHeroEnv();
  const animate = env.ready && !env.reduced;

  const rootRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const shaftRef = useRef<HTMLDivElement | null>(null);
  const centreRef = useRef<HTMLDivElement | null>(null);
  const splashRef = useRef<HTMLDivElement | null>(null);
  const orbitRefs = useRef<(HTMLDivElement | null)[]>([]);
  const garnishRefs = useRef<(HTMLDivElement | null)[]>([]);

  const clock = useMotionClock(rootRef, animate);
  const { pointer, target } = usePointerParallax(sceneRef, animate);

  /* ---- flavour selection ---- */
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  activeRef.current = active;

  /* Two stacked centre bottles that cross-fade, so changing flavour swaps
     the liquid colour and the label without a flicker. The DOM nodes are
     stable, which keeps the bubble handles valid. */
  const [slots, setSlots] = useState<[number, number]>([0, 0]);
  const [front, setFront] = useState<0 | 1>(0);
  const frontRef = useRef<0 | 1>(0);

  const select = useCallback((i: number) => {
    if (i === activeRef.current) return;
    const next: 0 | 1 = frontRef.current === 0 ? 1 : 0;
    frontRef.current = next;
    setSlots((s) => (next === 0 ? [i, s[1]] : [s[0], i]));
    setFront(next);
    setActive(i);
  }, []);

  const juice = juices[active];
  const activeFruit: FruitKind = isFruitKind(juice.fruit)
    ? juice.fruit
    : "orange";

  /* ---- animation state, kept out of React ---- */
  const phases = useRef<number[]>(
    Array.from({ length: N }, (_, i) => slotAngle(slotOf(i, 0))),
  );
  const vis = useRef<number[]>(
    Array.from({ length: N }, (_, i) => (i === 0 ? 0 : 1)),
  );
  const lastZ = useRef<number[]>(new Array(N).fill(-1));
  const lastBlur = useRef<number[]>(new Array(N).fill(-1));

  const bubbleHandles = useRef<
    { el: SVGElement; x: number; speed: number; phase: number; wobble: number }[]
  >([]);
  const sweepHandles = useRef<SVGElement[]>([]);
  const specHandles = useRef<SVGElement[]>([]);
  const dropHandles = useRef<SVGElement[]>([]);

  const centreBubbles = env.bubbleCount;
  const orbitBubbles = env.lowPower ? 0 : Math.min(3, env.bubbleCount);

  /* Collect the moving parts once per layout, not per frame. */
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const bubbles: typeof bubbleHandles.current = [];
    const collect = (root: Element | null, seed: number, count: number) => {
      if (!root || count <= 0) return;
      const specs = bubbleSpecs(seed, count);
      root.querySelectorAll<SVGElement>("[data-bubble]").forEach((el) => {
        const i = Number(el.getAttribute("data-bubble"));
        const s = specs[i];
        if (s) bubbles.push({ el, ...s });
      });
    };

    scene.querySelectorAll<HTMLElement>("[data-bottle]").forEach((node) => {
      const seed = Number(node.getAttribute("data-seed")) || 1;
      const count = Number(node.getAttribute("data-bubbles")) || 0;
      collect(node, seed, count);
    });

    bubbleHandles.current = bubbles;
    sweepHandles.current = Array.from(
      centreRef.current?.querySelectorAll<SVGElement>("[data-sweep]") ?? [],
    );
    specHandles.current = Array.from(
      centreRef.current?.querySelectorAll<SVGElement>("[data-spec]") ?? [],
    );
    dropHandles.current = Array.from(
      splashRef.current?.querySelectorAll<SVGElement>("[data-splash-drop]") ??
        [],
    );
  }, [centreBubbles, orbitBubbles, env.ready, env.lowPower]);

  /* ---- the frame ---- */
  const writeFrame = useCallback<FrameFn>(
    (t, dt) => {
      const still = dt === 0;
      const step = still ? 0 : 1 - Math.exp(-dt / 0.42);

      /* parallax: damped, and deliberately tiny */
      if (!still) dampTowards(pointer.current, target.current, 0.13, dt);
      const px = pointer.current.x;
      const py = pointer.current.y;

      const stage = stageRef.current;
      if (stage) {
        stage.style.transform =
          `rotateX(${(-py * 2.6).toFixed(3)}deg) ` +
          `rotateY(${(px * 3.8).toFixed(3)}deg) ` +
          `translate3d(${(px * -8).toFixed(2)}px, ${(py * -6).toFixed(2)}px, 0)`;
      }

      /* centre bottle: fake Y rotation via scaleX plus a whisper of tilt */
      const spin = t * 0.42;
      const sx = 0.93 + 0.07 * Math.cos(spin);
      const centre = centreRef.current;
      if (centre) {
        centre.style.transform = centreTransform(sx, Math.sin(spin) * 0.7);
      }
      /* the highlight slides round the cylinder as it turns */
      const specShift = -13 * Math.sin(spin);
      for (const el of specHandles.current) {
        el.style.transform = `translateX(${specShift.toFixed(2)}px)`;
      }

      /* foil sweep across the label, every 5.5s */
      const sweepP = clamp(((t + 1.2) % 5.5) / 1.35, 0, 1);
      const sweepX = sweepP * 280;
      for (const el of sweepHandles.current) {
        el.style.transform = `translateX(${sweepX.toFixed(1)}px)`;
      }

      /* the backlight breathes, as if the sun behind it were moving */
      const glow = glowRef.current;
      if (glow) {
        const b = 1 + 0.045 * Math.sin(t * 0.37);
        glow.style.transform = `translate(-50%, -50%) scale(${b.toFixed(4)})`;
        glow.style.opacity = (0.8 + 0.2 * Math.sin(t * 0.37 + 1)).toFixed(3);
      }

      /* shafts drift across the frame, far slower than anything else */
      const shafts = shaftRef.current;
      if (shafts) {
        shafts.style.transform = `translate3d(${(Math.sin(t * 0.055) * 3.4).toFixed(
          2,
        )}%, 0, 0)`;
      }

      /* droplets hanging over the splash */
      const drops = dropHandles.current;
      for (let i = 0; i < drops.length; i++) {
        const p = t * 0.5 + i * 1.7;
        drops[i].style.transform =
          `translate(${(Math.sin(p * 0.6) * 2.2).toFixed(2)}px, ` +
          `${(Math.sin(p) * 4.5).toFixed(2)}px)`;
      }

      /* the ring */
      const drift = t * ORBIT_SPEED;
      const activeIdx = activeRef.current;
      const blurMax = env.blurEnabled ? 5 : 0;

      for (let i = 0; i < N; i++) {
        const el = orbitRefs.current[i];
        if (!el) continue;

        const slot = slotOf(i, activeIdx);
        const isActive = slot === 0;
        const goal = slotAngle(slot);

        let ph = phases.current[i];
        if (still || isActive) {
          ph = goal;
        } else {
          let d = goal - ph;
          d = (((d + Math.PI) % TAU) + TAU) % TAU - Math.PI;
          ph += d * step;
        }
        phases.current[i] = ph;

        const theta = ph + drift;
        const depth = depthOf(theta);

        const wantVis = isActive ? 0 : 1;
        let v = vis.current[i];
        v = still ? wantVis : v + (wantVis - v) * (1 - Math.exp(-dt / 0.22));
        vis.current[i] = v;

        el.style.transform = orbitTransform(theta, scaleOf(depth));
        el.style.opacity = (v * (0.3 + 0.7 * depth)).toFixed(3);

        /* z-index and blur only change on the way past a threshold — both
           are cheap to read and expensive to set, so cache them. */
        const z = 6 + Math.round(depth * 24);
        if (z !== lastZ.current[i]) {
          el.style.zIndex = String(z);
          lastZ.current[i] = z;
        }
        /* Depth of field. When blur is off — a weak device, or a phone —
           this must still run once to clear anything a previous, richer
           frame left behind. */
        const b = blurMax > 0 ? Math.round((1 - depth) * blurMax * 2) / 2 : 0;
        if (b !== lastBlur.current[i]) {
          el.style.filter = b > 0 ? `blur(${b}px)` : "none";
          lastBlur.current[i] = b;
        }
      }

      /* bubbles */
      const bubbles = bubbleHandles.current;
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        const rise = BUBBLE_RISE;
        const p = (((b.phase + (t * b.speed) / rise) % 1) + 1) % 1;
        const wobble = Math.sin(t * 1.7 + b.phase * TAU) * b.wobble;
        b.el.style.transform =
          `translate(${wobble.toFixed(2)}px, ${(-p * rise).toFixed(1)}px)`;
        b.el.style.opacity = (
          0.42 *
          Math.min(1, p * 9) *
          Math.max(0, 1 - p * 0.8)
        ).toFixed(3);
      }

      /* fruit. Foreground pieces answer the pointer several times harder than
         the stage does — near things move more, and that difference is most
         of what sells the depth. */
      for (let i = 0; i < GARNISH.length; i++) {
        const el = garnishRefs.current[i];
        if (!el) continue;
        const g = GARNISH[i];
        const fx = g.x + g.ax * Math.sin(t * g.sx + g.ph) - px * g.par;
        const fy = g.y + g.ay * Math.cos(t * g.sy + g.ph * 1.7) - py * g.par;
        const ax = (fx / g.w - 0.5) * 100;
        const ay = (fy / g.w - 0.5) * 100;
        el.style.transform =
          `translate(${ax.toFixed(2)}%, ${ay.toFixed(2)}%) ` +
          `rotate(${(g.rot + t * g.spin).toFixed(2)}deg)`;
      }
    },
    [env.blurEnabled, pointer, target],
  );

  const subscribe = clock.subscribe;
  useEffect(() => subscribe(writeFrame), [subscribe, writeFrame]);

  /* Reduced motion, or the moment before the loop starts: compose one frame.
     `dt === 0` tells writeFrame to snap rather than damp. */
  useEffect(() => {
    const id = requestAnimationFrame(() => writeFrame(6, 0));
    return () => cancelAnimationFrame(id);
  }, [writeFrame, active, env.ready]);

  /* ---- static markup ---- */
  const initialCentre = centreTransform(1, 0);
  const initialOrbit = useMemo(
    () =>
      juices.map((_, i) => {
        const theta = slotAngle(slotOf(i, 0));
        return orbitTransform(theta, scaleOf(depthOf(theta)));
      }),
    [],
  );

  /* Blur radii are quoted for a 560px-wide scene and scale with it, so the
     foreground stays equally soft on a phone. `blurEnabled` is not consulted
     here: these pieces are rasterised once and only ever translated, unlike
     the ring, whose blur radius changes every frame. */
  const blurScale = env.compact ? 0.62 : 1;

  return (
    <section
      ref={rootRef}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-3.75rem)] flex-col justify-center overflow-hidden"
    >
      {/* ---------- room ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* key light, upper left, the same direction everything is lit from */}
        <div className="absolute -top-[30%] -left-[15%] h-[85vh] w-[80vw] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(243,218,139,0.09),transparent_68%)] blur-[70px]" />
        {/* the sun the bottle is standing in front of */}
        <div className="absolute left-1/2 top-[-24%] h-[62vh] w-[150vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,166,60,0.14),transparent_66%)] blur-[60px] lg:left-[68%] lg:top-[-10%] lg:h-[96vh] lg:w-[76vw]" />
        <div className="absolute inset-y-0 left-5 w-px bg-gradient-to-b from-transparent via-gold/12 to-transparent sm:left-8 lg:left-[max(2rem,calc(50%-36rem))]" />
        <div className="absolute inset-y-0 right-5 w-px bg-gradient-to-b from-transparent via-gold/12 to-transparent sm:right-8 lg:right-[max(2rem,calc(50%-36rem))]" />
        <div
          className="absolute inset-0 opacity-[0.055] mix-blend-screen"
          style={{ backgroundImage: GRAIN }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
      </div>

      {/* On phones this is a single column — mark, then the scene, then the
          headline — so the product is above the fold. From lg it becomes two
          columns with the scene spanning both rows on the right. */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pt-10 sm:px-8 sm:pt-12 lg:grid lg:grid-cols-[1fr_1.06fr] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-12 lg:gap-y-0 lg:pt-14">
        {/* ---------- mark + eyebrow ---------- */}
        <div className="animate-rise motion-reduce:animate-none order-1 text-center lg:order-none lg:col-start-1 lg:row-start-1 lg:self-end lg:text-left">
          <LogoLockup size="md" />

          <p
            className="animate-rise motion-reduce:animate-none mt-6 flex items-center justify-center gap-3 font-sans text-[0.6875rem] tracking-label text-gold uppercase sm:text-xs lg:justify-start"
            style={{ animationDelay: "0.1s" }}
          >
            <span className="h-px w-8 bg-gold/60" />
            Nottingham&rsquo;s No.1 Juice Spot
          </p>
        </div>

        {/* ---------- headline, copy, calls to action ---------- */}
        <div className="order-3 text-center lg:order-none lg:col-start-1 lg:row-start-2 lg:self-start lg:text-left">
          <h1
            id="hero-heading"
            className="animate-rise motion-reduce:animate-none mt-1 lg:mt-6"
            style={{ animationDelay: "0.18s" }}
          >
            <span className="text-foil block font-script text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Pressed the morning
              <br />
              it reaches you,
            </span>
            <span className="text-foil mt-2 block font-display text-[2rem] leading-[1.05] font-medium tracking-[0.1em] sm:text-5xl lg:text-[3.25rem]">
              THE JC WAY
            </span>
          </h1>

          <p
            className="animate-rise motion-reduce:animate-none mx-auto mt-5 max-w-md text-[0.9375rem] leading-relaxed font-light text-cream-dim sm:text-base lg:mx-0"
            style={{ animationDelay: "0.26s" }}
          >
            Cold pressed the morning they go out, then driven to your door
            across {DELIVERY.city}. Nothing sits in a warehouse &mdash; there
            isn&rsquo;t one.
          </p>

          <div
            className="animate-rise motion-reduce:animate-none mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center sm:gap-4 lg:justify-start"
            style={{ animationDelay: "0.34s" }}
          >
            <ButtonLink href="/menu" variant="primary" size="lg">
              Order Now
            </ButtonLink>
            <ButtonLink href="/subscribe" variant="secondary" size="lg">
              Weekly Drops
            </ButtonLink>
          </div>
        </div>

        {/* ---------- the scene ---------- */}
        <div className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div
            ref={sceneRef}
            /* `color` is the flavour. Everything tinted by the juice — the
               pool, the splash, the wash and rim light on every piece of
               fruit — paints in currentColor, so a flavour change is one
               interpolated property rather than a scene-wide repaint. */
            className="relative mx-auto w-full max-w-[24rem] transition-[color] duration-700 ease-out sm:max-w-[27rem] lg:max-w-none"
            style={{
              aspectRatio: `1 / ${ASPECT}`,
              color: juice.accent,
              /* The frame is the composition — the foreground fruit is
                 deliberately half out of shot and has to stop somewhere. A
                 non-repeating mask both clips it and feathers the clip, which
                 `overflow: hidden` cannot: that draws a rectangle on the page
                 and the whole illusion of a room goes with it. */
              maskImage: SCENE_MASK,
              WebkitMaskImage: SCENE_MASK,
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
            }}
          >
            {/* --- backlight, behind everything --- */}
            <div
              ref={glowRef}
              aria-hidden="true"
              className="pointer-events-none absolute h-[64%] w-[74%] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(247,228,168,0.26),rgba(212,166,60,0.12)_40%,transparent_70%)] blur-2xl"
              style={{
                left: `${(HERO_X + 0.02) * 100}%`,
                top: `${pctY(0.44)}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 0,
              }}
            />

            {/* --- volumetric shafts, raked from the key light --- */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-[30%] -inset-y-[20%] overflow-hidden"
              style={{
                zIndex: 1,
                maskImage:
                  "radial-gradient(ellipse 62% 58% at 34% 26%, #000, transparent 78%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 62% 58% at 34% 26%, #000, transparent 78%)",
              }}
            >
              <div
                ref={shaftRef}
                className="absolute inset-0"
                style={{ willChange: "transform" }}
              >
                {SHAFTS.map(([w, left, a], i) => (
                  <div
                    key={i}
                    className="absolute -top-1/4 h-[150%]"
                    style={{
                      left: `${left}%`,
                      width: `${w}%`,
                      transform: "rotate(19deg)",
                      background: `linear-gradient(to right, transparent, rgba(247,228,168,${a}), transparent)`,
                    }}
                  />
                ))}
              </div>
            </div>

            {/* the perspective rig */}
            <div
              className="absolute inset-0"
              style={{ perspective: "1200px", perspectiveOrigin: "50% 46%" }}
            >
              <div
                ref={stageRef}
                className="absolute inset-0"
                style={{ willChange: "transform" }}
              >
                {/* --- the floor ---
                    A surface, not a void: a warm wash from the horizon down,
                    a streak of haze where the light grazes the back of the
                    table, and a pool of the juice's own colour under the
                    product. The pool is currentColor at full strength with the
                    element carrying the opacity, because a gradient built from
                    an rgba() string cannot be transitioned and this one has to
                    follow the flavour. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-x-[24%] bottom-[-8%]"
                  style={{
                    top: `${pctY(0.58)}%`,
                    zIndex: 2,
                    background:
                      "linear-gradient(to bottom, rgba(38,22,8,0) 0%, rgba(44,26,10,0.42) 30%, rgba(14,8,4,0.8) 74%, rgba(8,7,6,0.97) 100%)",
                    /* Without this the surface ends in two hard vertical
                       edges, and a rectangle across the page is the fastest
                       way to lose the illusion of a room. */
                    maskImage: FLOOR_MASK,
                    WebkitMaskImage: FLOOR_MASK,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,166,60,0.09),transparent_70%)]"
                  style={{
                    top: `${pctY(ORB_CY - 0.05)}%`,
                    width: "138%",
                    height: `${pctY(0.28)}%`,
                    zIndex: 2,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%]"
                  style={{
                    left: `${HERO_X * 100}%`,
                    top: `${pctY(HERO_CONTACT + 0.005)}%`,
                    width: "112%",
                    height: `${pctY(0.17)}%`,
                    background:
                      "radial-gradient(ellipse at center, currentColor, transparent 66%)",
                    opacity: 0.16,
                    zIndex: 2,
                  }}
                />

                {/* --- the fruit. All of it is emitted here and sorted by the
                        z-index its layer carries, so depth is described in one
                        table rather than by where things sit in the markup. */}
                {GARNISH.map((g, i) => (
                  <GarnishPiece
                    key={i}
                    g={g}
                    i={i}
                    fallback={activeFruit}
                    blurScale={blurScale}
                    refFn={(el) => {
                      garnishRefs.current[i] = el;
                    }}
                  />
                ))}

                {/* --- the air behind the product --- */}
                <ParticleField
                  subscribe={clock.subscribe}
                  count={env.particleCount}
                  tint={juice.accent}
                  role="haze"
                  still={!animate}
                  className="z-[4]"
                />

                {/* --- the six others, standing on the same floor --- */}
                {juices.map((j, i) => (
                  <div
                    key={j.id}
                    ref={(el) => {
                      orbitRefs.current[i] = el;
                    }}
                    data-bottle=""
                    data-seed={i + 2}
                    data-bubbles={orbitBubbles}
                    className="absolute left-0 top-0"
                    style={{
                      width: `${F_ORBIT * 100}%`,
                      aspectRatio: `${VB_W} / ${VB_H}`,
                      transform: initialOrbit[i],
                      opacity: i === 0 ? 0 : 1,
                      zIndex: 6,
                      willChange: "transform, opacity",
                    }}
                  >
                    {/* what stops these floating: a shadow at the foot, inside
                        the wrapper so it scales with the bottle's depth */}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.85),rgba(0,0,0,0.35)_45%,transparent_72%)]"
                      style={{
                        top: `${FOOT * 100}%`,
                        width: "150%",
                        height: "7%",
                      }}
                    />
                    {/* A div, not a button. The flavour chips below are the
                        accessible control, so these orbit bottles are a mouse
                        affordance only and must not reach assistive tech. But
                        `aria-hidden` on a <button> is a contradiction: the
                        element stays clickable and, in some browsers, still
                        focusable, so a keyboard or screen-reader user can land
                        on a control that claims not to exist. Removing the
                        button role removes the contradiction rather than
                        papering over it with tabIndex. */}
                    <div
                      aria-hidden="true"
                      onClick={() => select(i)}
                      className="block h-full w-full cursor-pointer"
                    >
                      <BottleArt
                        uid={`o${i}`}
                        seed={i + 2}
                        accent={j.accent}
                        accentDeep={j.accentDeep}
                        bubbles={orbitBubbles}
                        dropletCount={env.lowPower ? 0 : 5}
                        labelDetail="mark"
                      />
                    </div>
                  </div>
                ))}

                {/* --- the hero's shadow: a tight core where it meets the
                        floor, and a longer one thrown away from the key --- */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.92),rgba(0,0,0,0.5)_40%,transparent_72%)]"
                  style={{
                    left: `${(HERO_X + 0.06) * 100}%`,
                    top: `${pctY(HERO_CONTACT + 0.014)}%`,
                    width: "44%",
                    height: `${pctY(0.07)}%`,
                    transform: "translate(-50%, -50%) rotate(-4deg)",
                    zIndex: 32,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.95),transparent_66%)]"
                  style={{
                    left: `${HERO_X * 100}%`,
                    top: `${pctY(HERO_CONTACT)}%`,
                    width: "27%",
                    height: `${pctY(0.028)}%`,
                    zIndex: 33,
                  }}
                />

                {/* --- the hero bottle, and its reflection --- */}
                <div
                  ref={centreRef}
                  className="absolute left-0 top-0"
                  style={{
                    width: `${F_CENTRE * 100}%`,
                    aspectRatio: `${VB_W} / ${VB_H}`,
                    transform: initialCentre,
                    zIndex: 40,
                    willChange: "transform",
                  }}
                >
                  {([0, 1] as const).map((k) => {
                    const j = juices[slots[k]];
                    return (
                      <div
                        key={k}
                        data-bottle=""
                        data-seed={k + 20}
                        data-bubbles={centreBubbles}
                        className="absolute inset-0"
                        style={{
                          opacity: front === k ? 1 : 0,
                          transition: "opacity 650ms cubic-bezier(0.4,0,0.2,1)",
                        }}
                      >
                        {/* Mirrored about the foot line and foreshortened,
                            the way a reflection in a wet counter is. It lives
                            inside the crossfading pair so it changes flavour
                            with the bottle for free. */}
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0"
                          style={{
                            top: `${FOOT * (1 + REFLECT) * 100}%`,
                            height: "100%",
                            transformOrigin: "50% 0",
                            transform: `scaleY(-${REFLECT})`,
                            opacity: 0.17,
                            filter: env.blurEnabled ? "blur(2.5px)" : undefined,
                            maskImage: REFLECT_MASK,
                            WebkitMaskImage: REFLECT_MASK,
                          }}
                        >
                          <BottleArt
                            uid={`r${k}`}
                            seed={k + 40}
                            accent={j.accent}
                            accentDeep={j.accentDeep}
                            bubbles={0}
                            dropletCount={0}
                            labelDetail="mark"
                          />
                        </div>

                        <BottleArt
                          uid={`c${k}`}
                          seed={k + 20}
                          accent={j.accent}
                          accentDeep={j.accentDeep}
                          bubbles={centreBubbles}
                          dropletCount={env.lowPower ? 6 : 16}
                          labelDetail="full"
                          arcs
                          arcClassName="hidden lg:block"
                          title={
                            front === k
                              ? `${j.name} — Juice Cartel ${j.size}`
                              : undefined
                          }
                        />
                      </div>
                    );
                  })}
                </div>

                {/* --- the juice itself, thrown up round the base. Behind the
                        bottle, so the sheet appears from behind it rather
                        than being pasted across the label. --- */}
                <div
                  ref={splashRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute -translate-x-1/2"
                  style={{
                    left: `${HERO_X * 100}%`,
                    top: `${pctY(HERO_CONTACT - SPLASH_FLOOR * SPLASH_H)}%`,
                    width: `${SPLASH_W * 100}%`,
                    height: `${pctY(SPLASH_H)}%`,
                    zIndex: 34,
                  }}
                >
                  <JuiceSplash
                    uid="splash"
                    detail={env.lowPower ? "simple" : "full"}
                  />
                </div>

              </div>
            </div>

            {/* Seats the scene on the page: it fades to solid black at the
                very bottom so nothing looks cut off by the frame. A full
                vignette is not used here — it would draw a visible rectangle
                against the section behind it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[47] h-[10%] bg-gradient-to-b from-transparent to-ink"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
              }}
            />

            {/* --- spray, in front of everything. Cut on weak devices: it is
                    the one layer whose absence nobody can name. --- */}
            {env.lowPower ? null : (
              <ParticleField
                subscribe={clock.subscribe}
                count={Math.round(env.particleCount * 0.45)}
                tint={juice.accent}
                role="spray"
                still={!animate}
                className="z-[48]"
              />
            )}
          </div>
        </div>
      </div>

      {/* ---------- flavour chips ---------- */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-2 pb-12 sm:px-8 sm:pt-4 lg:pb-14">
        <div className="rule-foil mx-auto mb-5 max-w-xs" aria-hidden="true" />
        <p
          id="hero-flavours-label"
          className="mb-4 text-center font-sans text-[0.625rem] tracking-label text-cream-faint uppercase"
        >
          Seven pressed daily &middot; {juices[0].size}
        </p>
        {/* On phones the seven chips wrap into a ragged four-row block, so
            they become a single scrolling rail instead. The negative margin
            lets it bleed to the screen edge, which is the cue that it
            scrolls. From sm they go back to a centred wrapped row. */}
        <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
        <div
          role="group"
          aria-labelledby="hero-flavours-label"
          className="flex w-max items-center gap-2 sm:mx-auto sm:w-auto sm:max-w-3xl sm:flex-wrap sm:justify-center sm:gap-2.5"
        >
          {juices.map((j, i) => {
            const on = i === active;
            return (
              <button
                key={j.id}
                type="button"
                aria-pressed={on}
                onClick={() => select(i)}
                className={
                  "group inline-flex shrink-0 items-center gap-2 rounded-[2px] border px-3 py-2 " +
                  "font-sans text-[0.6875rem] tracking-[0.1em] whitespace-nowrap uppercase " +
                  "transition-[background-color,border-color,color] duration-300 " +
                  (on
                    ? "border-gold/70 bg-gold/[0.09] text-gold-bright"
                    : "border-ink-line bg-ink-card/60 text-cream-dim hover:border-gold-deep/70 hover:text-cream")
                }
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full transition-transform duration-300 group-hover:scale-125"
                  style={{
                    background: j.accent,
                    boxShadow: on ? `0 0 10px ${j.accent}` : undefined,
                  }}
                />
                <span>{j.name}</span>
                <span
                  className={
                    "numeric " + (on ? "text-gold" : "text-cream-faint")
                  }
                >
                  {formatPrice(j.price)}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {juice.name}, {formatPrice(juice.price)}, selected.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Pieces
 * ------------------------------------------------------------------ */

/** Foreshortening of the reflection, and how far down it survives. */
const REFLECT = 0.62;
const REFLECT_MASK =
  "linear-gradient(to bottom, transparent 46%, rgba(0,0,0,0.35) 76%, rgba(0,0,0,0.9) 100%)";

/**
 * The scene's vignette. The transparent stop has to land *inside* every edge
 * of the box or the fade never finishes and the scene ends on a hard line —
 * a lit rectangle sitting on the page, which is the fastest way to lose the
 * illusion of a room.
 *
 * With the centre at 50%/46% the nearest edge is the top, 46% away, which is
 * 0.605 of a 76% radius. Everything must therefore be transparent by 60%:
 * left and right sit at 0.658, the bottom at 0.711, the corners further out
 * again. Move the centre or the radii and this sum has to be redone.
 */
const SCENE_MASK =
  "radial-gradient(ellipse 76% 76% at 50% 46%, #000 44%, rgba(0,0,0,0.62) 54%, transparent 60%)";

const FLOOR_MASK =
  "linear-gradient(to right, transparent, #000 18%, #000 82%, transparent)";

/** The splash, sized so its own floor line lands on the bottle's. */
const SPLASH_W = 0.68;
const SPLASH_H = (SPLASH_W * 220) / 400;
const SPLASH_FLOOR = 152 / 220;

/**
 * One piece of set dressing.
 *
 * Two nested elements on purpose: the outer one is written to by the frame
 * loop and carries nothing but a transform, while the inner one holds the
 * blur and the fade. Keeping the filter off the animated node is what lets
 * the browser rasterise the blurred fruit once and then just move it.
 */
function GarnishPiece({
  g,
  i,
  fallback,
  blurScale,
  refFn,
}: {
  g: Garnish;
  i: number;
  fallback: FruitKind;
  blurScale: number;
  refFn: (el: HTMLDivElement | null) => void;
}) {
  const kind = g.kind ?? fallback;
  return (
    <div
      ref={refFn}
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 aspect-square"
      style={{
        width: `${g.w * 100}%`,
        zIndex: LAYER_Z[g.layer],
        willChange: g.layer === "front" ? "transform" : undefined,
      }}
    >
      <div
        /* Keyed on the fruit so a flavour change fades the new piece in
           rather than swapping it mid-frame. */
        key={kind}
        className="animate-rise motion-reduce:animate-none h-full w-full"
        style={{
          opacity: g.op,
          filter: `blur(${(g.blur * blurScale).toFixed(1)}px) brightness(${g.dim})`,
          animationDuration: "0.9s",
        }}
      >
        {g.seated ? (
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.8),transparent_70%)]"
            style={{ top: "95%", width: "104%", height: "18%" }}
          />
        ) : null}
        <FruitArt
          kind={kind}
          face={g.face}
          uid={`g${i}`}
          detail={g.fine ? "full" : "simple"}
        />
      </div>
    </div>
  );
}

export default CinematicHero;
