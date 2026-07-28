"use client";

/**
 * The Juice Cartel hero.
 *
 * Classic Orange stands at the centre, large and sharp. The other six orbit
 * it on an ellipse, scaled and defocused by depth so the ring reads as a
 * turntable rather than a row of icons. Bubbles rise, a foil sweep crosses
 * the label, fruit and ice drift behind, mist floats in front, and the whole
 * stage tilts a few degrees under the pointer.
 *
 * Two ideas hold it together:
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
import { FruitArt, IceCube, isFruitKind, type FruitKind } from "./FruitArt";
import {
  clamp,
  dampTowards,
  useHeroEnv,
  useMotionClock,
  usePointerParallax,
  type FrameFn,
} from "./useHeroMotion";

/* ------------------------------------------------------------------ *
 * Scene geometry — all fractions of the scene's WIDTH
 * ------------------------------------------------------------------ */

/** Scene height ÷ width. Locked, so the percentage maths stays valid. */
const ASPECT = 1.05;

const F_CENTRE = 0.25; // centre bottle width
const F_ORBIT = 0.115; // orbit bottle width at scale 1

const CX = 0.5;
const CY = 0.385; // centre of the hero bottle
const ORB_CY = 0.7; // centre of the orbit ellipse
const ORB_RX = 0.405;
const ORB_RY = 0.185;

const TAU = Math.PI * 2;
/** One revolution every ~74 seconds. Slow enough to feel expensive. */
const ORBIT_SPEED = 0.085;
const SLOT_STEP = TAU / 6;
const N = juices.length;

/** Angle for a relative slot. Slot 0 is the centre; 1–6 ring the ellipse. */
function slotAngle(slot: number): number {
  if (slot === 0) return Math.PI / 2;
  return Math.PI / 2 + (slot - 1) * SLOT_STEP;
}

const slotOf = (i: number, active: number) => (i - active + N) % N;

/** Centre a box of width `frac` (of the scene) on the point (fx, fyW). */
function place(fx: number, fyW: number, frac: number): [number, number] {
  return [
    (fx / frac - 0.5) * 100,
    (fyW / (frac * BOTTLE_RATIO) - 0.5) * 100,
  ];
}

function orbitTransform(theta: number, scale: number): string {
  const [ax, ay] = place(
    CX + ORB_RX * Math.cos(theta),
    ORB_CY + ORB_RY * Math.sin(theta),
    F_ORBIT,
  );
  return `translate(${ax.toFixed(2)}%, ${ay.toFixed(2)}%) scale(${scale.toFixed(4)})`;
}

const [CENTRE_AX, CENTRE_AY] = place(CX, CY, F_CENTRE);

function centreTransform(scaleX: number, tilt: number): string {
  return (
    `translate(${CENTRE_AX.toFixed(2)}%, ${CENTRE_AY.toFixed(2)}%) ` +
    `rotate(${tilt.toFixed(3)}deg) scale(${scaleX.toFixed(4)}, 1)`
  );
}

/** Depth 0 (far) to 1 (near) from the orbit angle. */
const depthOf = (theta: number) => (Math.sin(theta) + 1) / 2;
const scaleOf = (d: number) => 0.56 + 0.5 * d;

/* ------------------------------------------------------------------ *
 * Background garnish
 * ------------------------------------------------------------------ */

interface Garnish {
  ice: boolean;
  /** Width as a fraction of the scene width. */
  w: number;
  bx: number;
  by: number;
  ax: number;
  ay: number;
  sx: number;
  sy: number;
  ph: number;
  spin: number;
  op: number;
}

/**
 * Kept low in opacity and heavily defocused on purpose. This is depth, not
 * decoration — the moment a piece of fruit is legible it starts competing
 * with the product.
 */
const GARNISH: Garnish[] = [
  { ice: false, w: 0.17, bx: 0.11, by: 0.17, ax: 0.03, ay: 0.035, sx: 0.19, sy: 0.14, ph: 0.4, spin: 5, op: 0.34 },
  { ice: true, w: 0.1, bx: 0.9, by: 0.11, ax: 0.028, ay: 0.03, sx: 0.15, sy: 0.21, ph: 2.1, spin: -7, op: 0.26 },
  { ice: false, w: 0.12, bx: 0.93, by: 0.44, ax: 0.026, ay: 0.032, sx: 0.23, sy: 0.17, ph: 3.6, spin: -4.5, op: 0.26 },
  { ice: true, w: 0.115, bx: 0.05, by: 0.56, ax: 0.03, ay: 0.028, sx: 0.17, sy: 0.24, ph: 5.0, spin: 6, op: 0.22 },
  { ice: false, w: 0.1, bx: 0.31, by: 0.06, ax: 0.024, ay: 0.026, sx: 0.21, sy: 0.19, ph: 1.2, spin: 8, op: 0.22 },
  { ice: false, w: 0.13, bx: 0.72, by: 0.05, ax: 0.03, ay: 0.026, sx: 0.13, sy: 0.16, ph: 4.4, spin: -5, op: 0.2 },
];

/** Which fruit each garnish slot draws, rotated with the active flavour. */
const GARNISH_OFFSET = [0, 0, 2, 0, 4, 5];

/** #rrggbb → rgba(), for gradients that have to carry the juice colour. */
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
  const centreRef = useRef<HTMLDivElement | null>(null);
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
  }, [centreBubbles, orbitBubbles, env.ready]);

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
          `rotateX(${(-py * 3.2).toFixed(3)}deg) ` +
          `rotateY(${(px * 4.6).toFixed(3)}deg) ` +
          `translate3d(${(px * -9).toFixed(2)}px, ${(py * -7).toFixed(2)}px, 0)`;
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

      /* glow behind the hero bottle breathes */
      const glow = glowRef.current;
      if (glow) {
        const b = 1 + 0.05 * Math.sin(t * 0.5);
        glow.style.transform = `translate(-50%, -50%) scale(${b.toFixed(4)})`;
        glow.style.opacity = (0.82 + 0.18 * Math.sin(t * 0.5 + 1)).toFixed(3);
      }

      /* the ring */
      const drift = t * ORBIT_SPEED;
      const activeIdx = activeRef.current;
      const blurMax = env.blurEnabled ? 5.5 : 0;

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
        el.style.opacity = (v * (0.26 + 0.74 * depth)).toFixed(3);

        /* z-index and blur only change on the way past a threshold — both
           are cheap to read and expensive to set, so cache them. */
        const z = 2 + Math.round(depth * 24);
        if (z !== lastZ.current[i]) {
          el.style.zIndex = String(z);
          lastZ.current[i] = z;
        }
        /* Depth of field. When blur is off — a weak device, or a phone —
           this must still run once to clear anything a previous, richer
           frame left behind. */
        const b =
          blurMax > 0 ? Math.round((1 - depth) * blurMax * 2) / 2 : 0;
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

      /* fruit and ice */
      for (let i = 0; i < GARNISH.length; i++) {
        const el = garnishRefs.current[i];
        if (!el) continue;
        const g = GARNISH[i];
        const fx = g.bx + g.ax * Math.sin(t * g.sx + g.ph);
        const fy = g.by * ASPECT + g.ay * Math.cos(t * g.sy + g.ph * 1.7);
        const ax = (fx / g.w - 0.5) * 100;
        const ay = (fy / g.w - 0.5) * 100;
        el.style.transform =
          `translate(${ax.toFixed(2)}%, ${ay.toFixed(2)}%) ` +
          `rotate(${(g.ph * 40 + t * g.spin).toFixed(2)}deg)`;
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

  return (
    <section
      ref={rootRef}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-3.75rem)] flex-col justify-center overflow-hidden"
    >
      {/* ---------- atmosphere ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-24%] h-[62vh] w-[150vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,166,60,0.16),transparent_66%)] blur-[60px] lg:left-[68%] lg:top-[-14%] lg:h-[92vh] lg:w-[76vw]" />
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
              Elevate your day,
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
            className="relative mx-auto w-full max-w-[24rem] sm:max-w-[27rem] lg:max-w-none"
            style={{ aspectRatio: `1 / ${ASPECT}` }}
          >
            {/* volumetric glow behind the hero bottle */}
            <div
              ref={glowRef}
              aria-hidden="true"
              className="pointer-events-none absolute h-[68%] w-[68%] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(243,218,139,0.30),rgba(212,166,60,0.13)_38%,transparent_70%)] blur-2xl"
              style={{
                left: `${CX * 100}%`,
                top: `${(CY / ASPECT) * 100}%`,
                transform: "translate(-50%, -50%)",
              }}
            />

            {/* the perspective rig */}
            <div
              className="absolute inset-0"
              style={{ perspective: "1200px", perspectiveOrigin: "50% 42%" }}
            >
              <div
                ref={stageRef}
                className="absolute inset-0"
                style={{ willChange: "transform" }}
              >
                {/* --- drifting garnish, furthest back --- */}
                {GARNISH.map((g, i) => {
                  const src = juices[(active + GARNISH_OFFSET[i]) % N];
                  const kind: FruitKind = isFruitKind(src.fruit)
                    ? src.fruit
                    : "orange";
                  return (
                    <div
                      key={i}
                      ref={(el) => {
                        garnishRefs.current[i] = el;
                      }}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-0 aspect-square"
                      style={{
                        width: `${g.w * 100}%`,
                        zIndex: 1,
                        opacity: g.op,
                        /* Garnish blur never re-rasterises: only the
                           transform changes, so the blurred texture is
                           cached and this is affordable everywhere. */
                        filter: "blur(4px)",
                        willChange: "transform",
                      }}
                    >
                      {g.ice ? (
                        <IceCube size={0} uid={`ice-${i}`} className="h-full w-full" />
                      ) : (
                        <FruitArt
                          kind={kind}
                          size={0}
                          tint={juice.accent}
                          uid={`fr-${i}`}
                          className="h-full w-full"
                        />
                      )}
                    </div>
                  );
                })}

                {/* --- the floor: a pool of warm light the ring stands in,
                        then a hard contact shadow under the hero bottle --- */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-[50%]"
                  style={{
                    left: "50%",
                    top: `${(ORB_CY / ASPECT) * 100}%`,
                    width: "108%",
                    height: "40%",
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(ellipse at center, ${withAlpha(
                      juice.accent,
                      0.13,
                    )}, transparent 66%)`,
                    filter: "blur(14px)",
                    transition: "background 650ms ease",
                    zIndex: 1,
                  }}
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.9),transparent_70%)]"
                  style={{
                    left: `${CX * 100}%`,
                    top: `${((CY + F_CENTRE * BOTTLE_RATIO * 0.47) / ASPECT) * 100}%`,
                    width: "40%",
                    height: "8%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                  }}
                />

                {/* --- the orbiting six (seven nodes; the active one hides) --- */}
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
                      zIndex: 2,
                      willChange: "transform, opacity",
                    }}
                  >
                    <button
                      type="button"
                      /* The flavour chips below are the accessible control;
                         these are a mouse affordance, kept out of the tab
                         order so the same seven names are not announced
                         twice. */
                      tabIndex={-1}
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
                    </button>
                  </div>
                ))}

                {/* --- the hero bottle --- */}
                <div
                  ref={centreRef}
                  className="absolute left-0 top-0"
                  style={{
                    width: `${F_CENTRE * 100}%`,
                    aspectRatio: `${VB_W} / ${VB_H}`,
                    transform: initialCentre,
                    zIndex: 15,
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
              </div>
            </div>

            {/* Seats the ring on the floor: the scene fades to solid black at
                the very bottom so nothing looks cut off by the frame. A full
                vignette is not used here — it would draw a visible rectangle
                against the section behind it. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[13%] bg-gradient-to-b from-transparent to-ink"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
                WebkitMaskImage:
                  "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
              }}
            />

            {/* --- mist and bokeh, in front of everything --- */}
            <ParticleField
              subscribe={clock.subscribe}
              count={env.particleCount}
              tint={juice.accent}
              still={!animate}
              className="z-30"
            />
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

export default CinematicHero;
