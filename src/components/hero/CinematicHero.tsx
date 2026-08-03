"use client";

/**
 * The Juice Cartel hero.
 *
 * This used to be a hand-built SVG scene — a drawn centre bottle, six drawn
 * bottles orbiting an ellipse, a drawn splash, drawn fruit. It was good, and
 * it is gone, because the owner sent photography: one cinematic render of all
 * seven bottles on a black plinth, and an individual shot of each juice cut
 * to the same set. A drawing of the product cannot beat a photograph of it.
 *
 * What survives is the engineering, because none of it was about drawing:
 *
 * 1. ONE rAF LOOP. `useMotionClock` owns the only requestAnimationFrame on
 *    the page; every moving thing subscribes and writes `transform` and
 *    `opacity` on its own node. No per-frame React state, no layout reads, no
 *    animated layout properties. It stops when the tab is hidden and when the
 *    hero scrolls off screen, and it never starts at all under reduced
 *    motion.
 *
 * 2. NO MEASUREMENT. Every position is a percentage of the element's own box
 *    inside a stage with a locked aspect ratio, so the same transform string
 *    is correct at 390px and at 1440px and the server can render the composed
 *    scene.
 *
 * 3. THE FLAVOUR IS A COLOUR. Everything tinted by the selected juice — the
 *    bloom behind the plate, the haze, the spray — paints in `currentColor`,
 *    so changing flavour is one interpolated property rather than a repaint.
 *
 * What is new is the presentation. A 1.5MB PNG dropped on a page is a
 * performance problem and, worse, it looks like a stock photo. So the still
 * is staged: a bloom behind it in the juice's own colour, a light pass raking
 * across it, atmosphere in front and behind it, the whole plate on a
 * perspective rig that answers the pointer. It is a set, and the photograph
 * is the thing standing in it.
 *
 * The seven flavour chips cross-fade the plate to that juice's own shot. If a
 * shot does not exist yet — a new flavour, photography still to come — the
 * plate stays on the group photograph and the room re-lights to that juice's
 * colour instead. That is deliberately not a spotlight sliding along the arc
 * to point at the bottle: a flavour with no photograph is not in the group
 * shot either, so pointing at it would be a lie.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { LogoLockup } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { DELIVERY, formatPrice, juices } from "@/lib/catalogue";
import ParticleField from "./ParticleField";
import { HERO_SIZES, LINEUP, shotFor, type HeroShot } from "./heroImages";
import {
  dampTowards,
  useHeroEnv,
  useMotionClock,
  usePointerParallax,
  type FrameFn,
} from "./useHeroMotion";

/* ------------------------------------------------------------------ *
 * Motion constants
 *
 * All of it is slow on purpose. The brief for this scene was "heavy and
 * expensive", and the difference between expensive and cheap motion is
 * almost entirely rate: a 400ms parallax that snaps to the cursor reads as a
 * widget, a 1.2s one that lags behind it reads as mass. Nothing here
 * overshoots and nothing bounces.
 * ------------------------------------------------------------------ */

/** Seconds of smoothing on the pointer. Deliberately long — this is weight. */
const POINTER_EASE = 0.34;

/** Degrees of stage rotation at the far corners. Past ~5 the still distorts. */
const TILT_X = 3.2;
const TILT_Y = 4.4;

/** Pixels of travel, by depth. The differences are what sell the parallax. */
const TRAVEL_STAGE = 7;
const TRAVEL_PLATE = 13;
const TRAVEL_BLOOM = -9; // behind, so it moves the other way
const TRAVEL_SEAL = 22; // closest thing in the frame, so it moves furthest

/** The light pass: one rake every LIGHT_PERIOD, taking LIGHT_SPAN to cross. */
const LIGHT_PERIOD = 11.5;
const LIGHT_SPAN = 2.6;

/** How long the crossfade between two photographs takes. */
const FADE_MS = 900;

/**
 * How long a selection waits for its photograph before revealing it anyway.
 *
 * Waiting for `onLoad` is what stops the plate cross-fading to an empty box
 * on a slow connection. But waiting *forever* turns a slow image into a dead
 * click, so the fade starts regardless after this — at which point the blur
 * placeholder is showing, in the right colours, and the photograph sharpens
 * in underneath the dissolve. That degradation is the reason the placeholders
 * are baked in the first place.
 */
const REVEAL_TIMEOUT_MS = 900;

/** Brand gold, for the resting state where no single flavour is selected. */
const GOLD = "#d4a63c";

/**
 * Peak opacity of the flavour bloom.
 *
 * It lives here because the frame loop writes `opacity` every frame and would
 * otherwise silently overwrite whatever the initial style said — which it did
 * for a while, and the bloom ran at three times its intended strength with
 * the declared value sitting there looking authoritative.
 */
const BLOOM_OP = 0.34;

/* ------------------------------------------------------------------ *
 * Masks and film stock
 * ------------------------------------------------------------------ */

/**
 * The photographs are rectangles with dark, but not black, corners — warm
 * bokeh, a lit slate edge, a reflection running off the bottom. Dropped
 * straight onto the page that is a rectangle of picture sitting on black,
 * which is the single loudest tell of a template.
 *
 * So the plate is masked. The obvious mask is one big radial, and it is
 * wrong: a radial whose fade completes inside the nearest edge has to start
 * fading barely half way out, and what you get is a legible disc — a
 * porthole cut in the page, with the photograph peering through it.
 *
 * Two crossed linear gradients instead, multiplied together by
 * `mask-composite: intersect`. Each edge gets its own feather, the middle is
 * untouched at full strength, and the corners — faded by both layers at once
 * — fall away fastest, which is the shape a vignette actually wants. The
 * bottom feather is the longest because that is where the slate is lightest.
 */
const PLATE_MASK = [
  "linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)",
  "linear-gradient(to bottom, transparent 0%, #000 7%, #000 84%, transparent 100%)",
].join(", ");

/**
 * The vignette, and the reason the mask alone is not enough.
 *
 * The group shot is cropped to its subject and has dark air around it, so a
 * feathered edge is all it needs. The individual shots do not: they are
 * composed corner to corner, and the warm bokeh behind the bottle is
 * genuinely bright right up to the frame. Feathering *that* to transparent
 * over a few percent leaves a bright band that stops abruptly — you have
 * traded a hard edge for a glowing one.
 *
 * So the corners are also pulled down toward the page's own black before the
 * mask ever touches them. Painted in ink rather than masked to transparency
 * because it has to darken the photograph, not remove it: the light pass
 * still rakes underneath, and a print ad seats a photograph on a dark page
 * exactly this way.
 */
const PLATE_VIGNETTE =
  "radial-gradient(ellipse 76% 70% at 50% 47%, rgba(8,7,6,0) 0%, rgba(8,7,6,0.12) 54%, rgba(8,7,6,0.62) 82%, rgba(8,7,6,0.95) 100%)";

/** The same film stock the rest of the site uses. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23g)'/%3E%3C/svg%3E\")";

/** Light shafts across the room. Width, offset, strength. */
const SHAFTS: [number, number, number][] = [
  [3.5, 12, 0.1],
  [1.4, 26, 0.07],
  [6, 41, 0.055],
  [2.2, 62, 0.045],
];

/* ------------------------------------------------------------------ *
 * The crossfading pair
 * ------------------------------------------------------------------ */

interface Stack {
  /** Two slots. Only ever two photographs are mounted at once. */
  slots: [HeroShot, HeroShot | null];
  front: 0 | 1;
  /** Key of a shot that has been asked for but is not showing yet. */
  pending: string | null;
}

const other = (k: 0 | 1): 0 | 1 => (k === 0 ? 1 : 0);

/**
 * The slot on show. Never null by construction — slot 0 starts holding the
 * lineup and a slot is only ever overwritten, never emptied — but the tuple
 * cannot say so, and the fallback is cheaper than a cast that would go stale.
 */
const frontOf = (st: Stack): HeroShot => st.slots[st.front] ?? LINEUP;

/** The same stack with `shot` loaded into whichever slot is behind. */
function withBack(st: Stack, shot: HeroShot): Stack["slots"] {
  return other(st.front) === 0 ? [shot, st.slots[1]] : [st.slots[0], shot];
}

/* ------------------------------------------------------------------ *
 * Component
 * ------------------------------------------------------------------ */

export function CinematicHero({
  availableImages = [],
}: {
  /** Filenames present in /public/products, resolved on the server. */
  availableImages?: string[];
}) {
  const env = useHeroEnv();
  const animate = env.ready && !env.reduced;

  const rootRef = useRef<HTMLElement | null>(null);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const plateRef = useRef<HTMLDivElement | null>(null);
  const bloomRef = useRef<HTMLDivElement | null>(null);
  const coreRef = useRef<HTMLDivElement | null>(null);
  const lightRef = useRef<HTMLDivElement | null>(null);
  const sealRef = useRef<HTMLDivElement | null>(null);
  const hazeRef = useRef<HTMLDivElement | null>(null);
  const sprayRef = useRef<HTMLDivElement | null>(null);
  const shaftRef = useRef<HTMLDivElement | null>(null);

  const clock = useMotionClock(rootRef, animate);
  const { pointer, target } = usePointerParallax(sceneRef, animate);

  /* ---- which photographs exist ---- */

  const shots = useMemo(() => {
    const have = new Set(availableImages);
    return juices.map((j) => shotFor(j, have));
  }, [availableImages]);

  /* ---- selection ----
     `selected` is the *intent* and updates on the click. The photograph
     behind it may take a moment to arrive; the chip, the room colour and the
     bloom must not. Separating the two is what makes a slow dissolve feel
     deliberate rather than laggy. -1 is the resting state: the whole lineup,
     no single flavour picked. */
  const [selected, setSelected] = useState(-1);
  const juice = selected >= 0 ? juices[selected] : null;
  const accent = juice ? juice.accent : GOLD;

  const [stack, setStack] = useState<Stack>({
    slots: [LINEUP, null],
    front: 0,
    pending: null,
  });
  /* Keys whose file has actually decoded. A plain object rather than a Set so
     the identity change is obvious to the effect below. */
  const [loaded, setLoaded] = useState<Record<string, true>>({});

  const markLoaded = useCallback((key: string) => {
    setLoaded((m) => (m[key] ? m : { ...m, [key]: true }));
  }, []);

  /** Mount a shot in the back slot without revealing it. */
  const warm = useCallback((shot: HeroShot | null) => {
    if (!shot) return;
    setStack((st) => {
      if (st.pending) return st; // a real selection is already in flight
      if (frontOf(st).key === shot.key) return st;
      if (st.slots[other(st.front)]?.key === shot.key) return st;
      return { ...st, slots: withBack(st, shot) };
    });
  }, []);

  /** Ask for a shot. Revealed by the effect below once it has decoded. */
  const show = useCallback((shot: HeroShot | null) => {
    if (!shot) return;
    setStack((st) => {
      if (frontOf(st).key === shot.key) {
        return st.pending ? { ...st, pending: null } : st;
      }
      return { slots: withBack(st, shot), front: st.front, pending: shot.key };
    });
  }, []);

  /* The reveal. Flips as soon as the file has decoded, or after the timeout,
     whichever comes first. */
  useEffect(() => {
    const key = stack.pending;
    if (!key) return;
    const flip = () =>
      setStack((st) =>
        st.pending === key
          ? { slots: st.slots, front: other(st.front), pending: null }
          : st,
      );
    if (loaded[key]) {
      flip();
      return;
    }
    const id = window.setTimeout(flip, REVEAL_TIMEOUT_MS);
    return () => window.clearTimeout(id);
  }, [stack.pending, loaded]);

  const select = useCallback(
    (i: number) => {
      setSelected(i);
      show(i < 0 ? LINEUP : shots[i]);
    },
    [shots, show],
  );

  /* ------------------------------------------------------------------ *
   * The frame
   * ------------------------------------------------------------------ */

  const writeFrame = useCallback<FrameFn>(
    (t, dt) => {
      const still = dt === 0;

      if (!still) dampTowards(pointer.current, target.current, POINTER_EASE, dt);
      const px = pointer.current.x;
      const py = pointer.current.y;

      /* The rig. rotateX is negated so pushing the cursor up tips the top of
         the plate away, which is what a physical object on a table does. */
      const stage = stageRef.current;
      if (stage) {
        stage.style.transform =
          `rotateX(${(-py * TILT_X).toFixed(3)}deg) ` +
          `rotateY(${(px * TILT_Y).toFixed(3)}deg) ` +
          `translate3d(${(px * -TRAVEL_STAGE).toFixed(2)}px, ` +
          `${(py * -TRAVEL_STAGE).toFixed(2)}px, 0)`;
      }

      /* The photograph travels further than the rig it sits on, and the bloom
         behind it travels the other way. Three depths from two numbers. */
      const plate = plateRef.current;
      if (plate) {
        plate.style.transform =
          `translate3d(${(px * -TRAVEL_PLATE).toFixed(2)}px, ` +
          `${(py * -TRAVEL_PLATE * 0.72).toFixed(2)}px, 0)`;
      }

      /* The bloom breathes, as if the lamp behind the set were on a dimmer.
         Two sines at unrelated rates so it never repeats visibly. */
      const bloom = bloomRef.current;
      if (bloom) {
        const b = 1 + 0.05 * Math.sin(t * 0.31);
        bloom.style.transform =
          `translate(-50%, -50%) ` +
          `translate3d(${(px * -TRAVEL_BLOOM).toFixed(2)}px, ` +
          `${(py * -TRAVEL_BLOOM * 0.7).toFixed(2)}px, 0) ` +
          `scale(${b.toFixed(4)})`;
        bloom.style.opacity = (
          BLOOM_OP *
          (0.78 + 0.22 * Math.sin(t * 0.31 + 1.1))
        ).toFixed(3);
      }
      const core = coreRef.current;
      if (core) {
        const b = 1 + 0.035 * Math.sin(t * 0.23 + 2);
        core.style.transform = `translate(-50%, -50%) scale(${b.toFixed(4)})`;
        core.style.opacity = (0.72 + 0.28 * Math.sin(t * 0.19)).toFixed(3);
      }

      /* The light pass. `q` runs 0..1 while the rake is crossing and then
         sits above 1 for the rest of the cycle, so the light is genuinely
         absent between passes rather than parked off-screen at full strength.
         Under reduced motion it holds mid-cross at half strength, which is a
         still specular sheen across the glass — composed, not missing. */
      const light = lightRef.current;
      if (light) {
        const q = still ? 0.5 : (t % LIGHT_PERIOD) / LIGHT_SPAN;
        if (q <= 1) {
          const eased = q * q * (3 - 2 * q);
          light.style.transform = `translate3d(${(-30 + eased * 300).toFixed(
            2,
          )}%, 0, 0) rotate(9deg)`;
          light.style.opacity = (
            Math.sin(Math.PI * q) * (still ? 0.5 : 1)
          ).toFixed(3);
        } else {
          light.style.opacity = "0";
        }
      }

      /* Atmosphere. The canvases are outside the perspective rig — rotating a
         canvas re-rasterises it every frame — so they carry their own, much
         smaller, share of the parallax. */
      const haze = hazeRef.current;
      if (haze) {
        haze.style.transform = `translate3d(${(px * -4).toFixed(2)}px, ${(
          py * -3
        ).toFixed(2)}px, 0)`;
      }
      const spray = sprayRef.current;
      if (spray) {
        spray.style.transform = `translate3d(${(px * -18).toFixed(2)}px, ${(
          py * -13
        ).toFixed(2)}px, 0)`;
      }

      /* The seal is the nearest thing in the frame, so it moves most and
         tips a degree or two with the pointer. */
      const seal = sealRef.current;
      if (seal) {
        seal.style.transform =
          `translate3d(${(px * -TRAVEL_SEAL).toFixed(2)}px, ` +
          `${(py * -TRAVEL_SEAL * 0.6).toFixed(2)}px, 0) ` +
          `rotate(${(px * 2.4 - 4).toFixed(2)}deg)`;
      }

      /* Shafts drift across the room far slower than anything else. */
      const shafts = shaftRef.current;
      if (shafts) {
        shafts.style.transform = `translate3d(${(
          Math.sin(t * 0.055) * 3.4
        ).toFixed(2)}%, 0, 0)`;
      }
    },
    [pointer, target],
  );

  const subscribe = clock.subscribe;
  useEffect(() => subscribe(writeFrame), [subscribe, writeFrame]);

  /* Reduced motion, and the beat before the loop starts: compose one frame.
     `dt === 0` tells writeFrame to snap rather than damp, and parks the light
     pass mid-rake. */
  useEffect(() => {
    const id = requestAnimationFrame(() => writeFrame(6, 0));
    return () => cancelAnimationFrame(id);
  }, [writeFrame, env.ready]);

  /* ------------------------------------------------------------------ */

  const liveText =
    selected < 0
      ? "Showing all seven juices."
      : shots[selected]
        ? `${juices[selected].name}, ${formatPrice(juices[selected].price)}, selected.`
        : `${juices[selected].name}, ${formatPrice(juices[selected].price)}, selected. Photography coming soon, showing the full lineup.`;

  return (
    <section
      ref={rootRef}
      aria-labelledby="hero-heading"
      className="relative isolate flex min-h-[calc(100svh-3.75rem)] flex-col justify-center overflow-hidden"
    >
      {/* ---------- the room ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        {/* Key light, upper left: the direction the photographs are lit from,
            so the page and the picture agree about where the lamp is. */}
        <div className="absolute -top-[30%] -left-[15%] h-[85vh] w-[80vw] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(243,218,139,0.09),transparent_68%)] blur-[70px]" />
        <div className="absolute left-1/2 top-[-24%] h-[62vh] w-[150vw] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(212,166,60,0.14),transparent_66%)] blur-[60px] lg:left-[68%] lg:top-[-10%] lg:h-[96vh] lg:w-[76vw]" />
        <div className="absolute inset-y-0 left-5 w-px bg-gradient-to-b from-transparent via-gold/12 to-transparent sm:left-8 lg:left-[max(2rem,calc(50%-36rem))]" />
        <div className="absolute inset-y-0 right-5 w-px bg-gradient-to-b from-transparent via-gold/12 to-transparent sm:right-8 lg:right-[max(2rem,calc(50%-36rem))]" />
        <div
          className="absolute inset-0 opacity-[0.055] mix-blend-screen"
          style={{ backgroundImage: GRAIN }}
        />
        {/* Volumetric shafts, raked from the key light. */}
        <div
          className="absolute -inset-x-[20%] inset-y-0 overflow-hidden"
          style={{
            maskImage:
              "radial-gradient(ellipse 58% 54% at 32% 24%, #000, transparent 76%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 58% 54% at 32% 24%, #000, transparent 76%)",
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
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink" />
      </div>

      {/* On phones this is a single column — mark, then the photograph, then
          the headline — so the product is above the fold. From lg it becomes
          two columns with the stage spanning both rows on the right. */}
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pt-10 sm:px-8 sm:pt-12 lg:grid lg:grid-cols-[1fr_1.12fr] lg:grid-rows-[auto_auto] lg:items-center lg:gap-x-10 lg:gap-y-0 lg:pt-12">
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
            {/* One step down at lg, and it is not a taste call: at 7xl the
                script line runs wider than the left column and breaks as
                "Pressed the / morning / it reaches you," — a one-word line in
                the middle of a three-line rag. The <br/> below is the only
                break this sentence is supposed to have. */}
            <span className="text-foil block font-script text-5xl leading-[1.05] sm:text-6xl">
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

        {/* ---------- the stage ---------- */}
        {/* From lg the stage bleeds 4rem past the container. At 1440 there is
            9rem of dead margin on that side and the photograph is the reason
            anyone is on the page — letting it run into some of that is what
            stops the hero reading as two equal columns of content. */}
        <div className="order-2 lg:order-none lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:-mr-10 xl:-mr-16">
          <div
            ref={sceneRef}
            /* `color` is the flavour. The bloom and both particle fields paint
               in currentColor, so picking a juice is one interpolated property
               rather than a scene-wide repaint.
               The box is very slightly taller than square: enough for the
               group shot to crop to its subject, shallow enough that the
               square shots lose nothing off their sides. */
            className="relative mx-auto aspect-[1/1.02] w-full max-w-[25rem] transition-[color] duration-700 ease-out sm:aspect-[1/1.05] sm:max-w-[27rem] lg:max-w-none"
            style={{ color: accent }}
          >
            {/* --- the lamp behind the set --- */}
            <div
              ref={bloomRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[46%] h-[84%] w-[106%] rounded-[50%] blur-[70px]"
              style={{
                background:
                  "radial-gradient(closest-side, currentColor, transparent 74%)",
                opacity: BLOOM_OP,
                transform: "translate(-50%, -50%)",
                zIndex: 0,
                willChange: "transform, opacity",
              }}
            />
            {/* A gold core that does *not* follow the flavour. Without it the
                whole scene turns green on Apple and the brand goes with it. */}
            <div
              ref={coreRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-[40%] h-[46%] w-[54%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(247,228,168,0.3),rgba(212,166,60,0.14)_52%,transparent_76%)] blur-[52px]"
              style={{
                transform: "translate(-50%, -50%)",
                zIndex: 0,
                willChange: "transform, opacity",
              }}
            />

            {/* --- air behind the product --- */}
            <div
              ref={hazeRef}
              className="absolute inset-0 z-[1]"
              style={{ willChange: "transform" }}
            >
              <ParticleField
                subscribe={clock.subscribe}
                count={env.particleCount}
                tint={accent}
                role="haze"
                still={!animate}
              />
            </div>

            {/* --- the perspective rig --- */}
            <div
              className="absolute inset-0 z-[2]"
              style={{ perspective: "1400px", perspectiveOrigin: "50% 44%" }}
            >
              <div
                ref={stageRef}
                className="absolute inset-0"
                style={{ willChange: "transform" }}
              >
                {/* The plate. The mask lives here so it feathers the
                    photograph, the light pass and nothing else — and so a
                    layer that scales past the frame during a crossfade is cut
                    by a gradient rather than by a hard rectangle. */}
                <div
                  ref={plateRef}
                  className="absolute inset-0"
                  style={{
                    maskImage: PLATE_MASK,
                    WebkitMaskImage: PLATE_MASK,
                    maskComposite: "intersect",
                    WebkitMaskComposite: "source-in",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    willChange: "transform",
                  }}
                >
                  {([0, 1] as const).map((k) => {
                    const shot = stack.slots[k];
                    if (!shot) return null;
                    const isFront = stack.front === k;
                    return (
                      <div
                        key={k}
                        className="absolute inset-0"
                        style={{
                          opacity: isFront ? 1 : 0,
                          /* Both layers push in slightly. A dissolve where one
                             image is moving and the other is not reads as a
                             swap; two images drifting the same way reads as a
                             camera move, which is what a film dissolve is. */
                          transform: isFront ? "scale(1)" : "scale(1.035)",
                          transition:
                            `opacity ${FADE_MS}ms cubic-bezier(0.22,1,0.36,1), ` +
                            `transform ${FADE_MS + 400}ms cubic-bezier(0.22,1,0.36,1)`,
                        }}
                      >
                        <Image
                          src={shot.src}
                          alt={isFront ? shot.alt : ""}
                          aria-hidden={isFront ? undefined : true}
                          fill
                          sizes={HERO_SIZES}
                          /* Only ever the resting shot. Seven preloaded hero
                             images is worse than none. */
                          priority={shot.key === LINEUP.key}
                          placeholder={shot.blurDataURL ? "blur" : "empty"}
                          blurDataURL={shot.blurDataURL}
                          onLoad={() => markLoaded(shot.key)}
                          /* objectFit goes in `style`, not a class, because
                             next/image sizes the blur placeholder from the
                             inline value — set it in a class and the
                             placeholder is cropped differently from the
                             photograph it is standing in for. */
                          style={{
                            objectFit: shot.fit,
                            objectPosition: shot.focus,
                          }}
                        />
                      </div>
                    );
                  })}

                  {/* Seats the photograph on the page. Under the light pass,
                      so the rake reads as light on the picture rather than
                      light on a piece of glass laid over it. */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                    style={{ background: PLATE_VIGNETTE }}
                  />

                  {/* --- the light pass ---
                      A rake of warm light crossing the glass. `screen` over a
                      dark photograph brightens without washing it out, which
                      a white overlay at any opacity cannot do. */}
                  <div
                    ref={lightRef}
                    aria-hidden="true"
                    data-hero-light=""
                    className="pointer-events-none absolute -inset-y-[14%] left-0 w-[30%] mix-blend-screen"
                    style={{
                      background:
                        "linear-gradient(100deg, transparent 0%, rgba(255,240,205,0.10) 34%, rgba(255,248,228,0.28) 50%, rgba(255,240,205,0.10) 66%, transparent 100%)",
                      transform: "translate3d(-30%, 0, 0) rotate(9deg)",
                      opacity: 0,
                      willChange: "transform, opacity",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* --- spray, in front of everything.
                    Cut on weak devices: it is the one layer whose absence
                    nobody can name. --- */}
            {env.lowPower ? null : (
              <div
                ref={sprayRef}
                className="absolute inset-0 z-[3]"
                style={{ willChange: "transform" }}
              >
                <ParticleField
                  subscribe={clock.subscribe}
                  count={Math.round(env.particleCount * 0.45)}
                  tint={accent}
                  role="spray"
                  still={!animate}
                />
              </div>
            )}

            {/* --- the seal ---
                The real label, shot flat, resting against the frame like a
                foil sticker on a print ad. It is the nearest object in the
                scene, so it takes the most parallax; that difference is what
                stops the photograph reading as a flat panel.
                Top left rather than bottom left: every one of these
                photographs is dark bokeh in that corner and a busy pile of
                fruit in the other, and a seal laid over the fruit is clutter
                where a seal laid over the air is a stamp. Decorative — the
                wordmark is already set as type in the next column. --- */}
            <div
              ref={sealRef}
              aria-hidden="true"
              className="pointer-events-none absolute top-[3%] left-[0.5%] z-[4] aspect-square h-[13%] w-auto sm:left-[2%]"
              style={{
                transform: "rotate(-4deg)",
                willChange: "transform",
              }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-full shadow-[0_18px_36px_-14px_rgba(0,0,0,0.9)] ring-1 ring-gold/25">
                <Image
                  src="/brand/label.jpg"
                  alt=""
                  fill
                  sizes="(max-width: 767px) 20vw, 8rem"
                  /* The render sits on a pale card with a margin around the
                     disc. Scaling past the circular clip is what removes it —
                     cropping the file would have been the other way, and the
                     file is shared with the rest of the site. */
                  className="scale-[1.16] object-cover"
                />
                <div className="absolute inset-0 rounded-full bg-[linear-gradient(128deg,rgba(255,244,214,0.22)_0%,transparent_38%,transparent_62%,rgba(0,0,0,0.34)_100%)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- flavour chips ---------- */}
      <div className="mx-auto w-full max-w-6xl px-5 pt-2 pb-10 sm:px-8 sm:pt-3 lg:pb-12">
        <div className="rule-foil mx-auto mb-4 max-w-xs" aria-hidden="true" />
        <p
          id="hero-flavours-label"
          className="mb-3 text-center font-sans text-[0.625rem] tracking-label text-cream-faint uppercase"
        >
          Seven pressed daily &middot; {juices[0].size}
        </p>
        {/* On phones the eight chips wrap into a ragged block, so they become
            a single scrolling rail instead. The negative margin lets it bleed
            to the screen edge, which is the cue that it scrolls. */}
        <div className="-mx-5 overflow-x-auto px-5 pb-1 sm:mx-0 sm:overflow-visible sm:px-0 sm:pb-0">
          <div
            role="group"
            aria-labelledby="hero-flavours-label"
            className="flex w-max items-center gap-2 sm:mx-auto sm:w-auto sm:max-w-4xl sm:flex-wrap sm:justify-center sm:gap-2.5"
          >
            {/* The way back. Without it, picking a flavour is a one-way door
                and the group photograph — the best image of the seven — can
                only be seen by reloading the page. */}
            <button
              type="button"
              aria-pressed={selected < 0}
              onPointerEnter={() => warm(LINEUP)}
              onFocus={() => warm(LINEUP)}
              onClick={() => select(-1)}
              className={
                "group inline-flex shrink-0 items-center gap-2 rounded-[2px] border px-3 py-2 " +
                "font-sans text-[0.6875rem] tracking-[0.1em] whitespace-nowrap uppercase " +
                "transition-[background-color,border-color,color] duration-300 " +
                (selected < 0
                  ? "border-gold/70 bg-gold/[0.09] text-gold-bright"
                  : "border-ink-line bg-ink-card/60 text-cream-dim hover:border-gold-deep/70 hover:text-cream")
              }
            >
              <span aria-hidden="true" className="text-gold">
                &#9679;&#9679;&#9679;
              </span>
              <span>All Seven</span>
            </button>

            {juices.map((j, i) => {
              const on = i === selected;
              return (
                <button
                  key={j.id}
                  type="button"
                  aria-pressed={on}
                  /* Hovering primes the back slot, so by the time the click
                     lands the photograph has usually already decoded and the
                     dissolve starts on the same frame as the press. On touch
                     there is no hover and the click does both, which is what
                     the reveal timeout above is for. */
                  onPointerEnter={() => warm(shots[i])}
                  onFocus={() => warm(shots[i])}
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
                    className={"numeric " + (on ? "text-gold" : "text-cream-faint")}
                  >
                    {formatPrice(j.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <p aria-live="polite" className="sr-only">
          {liveText}
        </p>
      </div>
    </section>
  );
}

export default CinematicHero;
