"use client";

/**
 * The WebGL half of the bottle viewer.
 *
 * This module is the ONLY place three.js is imported, and it is never imported
 * statically — `Bottle3DViewer` reaches it through `next/dynamic`, so the whole
 * renderer lands in its own chunk that the /menu route never downloads until
 * somebody actually asks to spin a bottle. Anything added here is added to that
 * chunk; keep the light stuff in `Bottle3DViewer`.
 *
 * Three rules this file exists to keep:
 *
 *  1. It never crashes the page. Anything that can fail — context creation,
 *     PMREM, canvas 2D — fails into `onUnsupported()` and the caller quietly
 *     keeps showing the SVG poster.
 *  2. It gives the context back. Browsers cap live WebGL contexts at around 16
 *     and mobile Safari is stricter still, so opening the viewer twenty times
 *     has to leave zero contexts behind. See the teardown at the bottom.
 *  3. It only draws when the picture would differ from the last one. The
 *     transmission pass renders the scene twice per frame; painting a bottle
 *     that has not moved is the single most expensive thing this could do.
 */

import { useEffect, useRef } from "react";
import {
  ACESFilmicToneMapping,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Mesh,
  MeshLambertMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SRGBColorSpace,
  WebGLRenderer,
  type Color,
  type MeshStandardMaterial,
  type WebGLRenderTarget,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

import { BOTTLE_HEIGHT } from "./bottleProfile";
import { buildBottle } from "./buildBottle";
import { loadImageTexture } from "./loadImageTexture";
import type { PhotoFruit } from "./photoAssets";

/** Seconds of no input before the bottle starts turning by itself. */
const IDLE_DELAY = 2.6;
/** How long the auto-rotate takes to fade in, so it never snaps on. */
const AUTO_FADE = 1.4;
const AUTO_SPEED = 0.34; // rad/s
/** Fraction of a flick's speed left after one second. */
const FRICTION = 0.02;
/**
 * Ceiling on throw speed, rad/s. Pointer events arrive in bursts — several
 * `pointermove`s can land between two frames, and a coalesced burst divided by
 * a two-millisecond gap computes as an absurd velocity. Roughly half a turn
 * per second is as fast as a bottle should ever be flung.
 */
const MAX_SPEED = 7;
/** Below this the bottle is treated as stopped and the loop can idle. */
const REST = 0.015;
/** Arrow-key step. */
const KEY_STEP = 0.18;
/**
 * How long the first frame will wait for the photographed sticker, ms.
 *
 * The label is a file and the bottle is not, so there is a window where the
 * model exists and its artwork does not. Holding the poster cross-fade for a
 * beat means the usual visitor never sees the drawn label at all — they get
 * the real one, first frame. Past this the bottle appears with the drawn label
 * and sharpens when the file lands, which is a better trade than staring at a
 * static poster on a slow connection.
 */
const LABEL_GRACE = 1200;

export interface BottleSceneProps {
  accent: string;
  accentDeep: string;
  seed: number;
  /** Accessible name for the interactive canvas. */
  label: string;
  /**
   * The real sticker, cut out of the product photograph. Optional: without it
   * the bottle keeps the drawn label, which is also what happens if the file
   * fails to load.
   */
  labelSrc?: string;
  /** Cut fruit to drift around the bottle. Empty is fine. */
  fruit?: readonly PhotoFruit[];
  /** Fired after the first painted frame, so the poster can cross-fade out. */
  onReady?: () => void;
  /** No WebGL2, or setup blew up. Caller should stay on the SVG. */
  onUnsupported?: () => void;
  className?: string;
}

/** Warm studio backdrop. Opaque on purpose — see the note in the effect. */
function makeBackdrop(): CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  /* Not pure black. The empty glass above the juice can only show what is
     behind it, so a black ground turns the whole shoulder into a silhouette
     with nothing to refract. A lifted warm core gives it something to bend. */
  const g = ctx.createRadialGradient(128, 96, 6, 128, 128, 210);
  g.addColorStop(0, "#7a5f34");
  g.addColorStop(0.22, "#3a2d1b");
  g.addColorStop(0.55, "#16120c");
  g.addColorStop(1, "#050403");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/**
 * Warms up RoomEnvironment before it is baked.
 *
 * The stock room is neutral white, which turns the bottle into a fridge
 * product shot. Tinting the emissive panels — cream from the -x side where
 * BottleArt puts its hard specular, gold from +x where it puts the rim — and
 * dropping the walls to a dark warm brown reproduces the SVG's lighting in a
 * form the PBR materials can actually reflect.
 */
function tintRoom(room: RoomEnvironment): void {
  room.traverse((o) => {
    const mesh = o as Mesh;
    if (!(mesh as { isMesh?: boolean }).isMesh) return;
    const mat = mesh.material as MeshStandardMaterial | MeshLambertMaterial;
    if (Array.isArray(mat)) return;

    const emissive = (mat as MeshStandardMaterial).emissive as Color | undefined;
    const intensity = (mat as MeshStandardMaterial).emissiveIntensity ?? 1;

    if (emissive && intensity > 1) {
      /* Area light panel. */
      if (mesh.position.x > 0) emissive.setHex(0xf3da8b);
      else emissive.setRGB(1, 0.94, 0.84);
    } else if (mat.color) {
      mat.color.setHex(0x2a2118);
    }
  });
}

/**
 * Two studio strip lights behind the bottle, baked into the same environment.
 *
 * A `DirectionalLight` on near-mirror glass gives a pinpoint, not an edge.
 * What actually draws the gold line down the side of a bottle is a tall,
 * narrow source *behind* it — at the silhouette the surface normal is
 * perpendicular to the eye, so it reflects whatever is directly behind.
 * These reproduce BottleArt's white-left / gold-right edge treatment.
 *
 * Added as children of the room so `RoomEnvironment.dispose()`, which walks
 * its own tree, cleans them up too. The room sits 3.5 units low, hence the
 * offset on every y.
 */
function addStripLights(room: RoomEnvironment): void {
  const geometry = new PlaneGeometry(1, 1);
  const strip = (
    hex: number,
    intensity: number,
    w: number,
    h: number,
    x: number,
    y: number,
    z: number,
  ) => {
    const mesh = new Mesh(
      geometry,
      new MeshLambertMaterial({
        color: 0x000000,
        emissive: hex,
        emissiveIntensity: intensity,
        side: DoubleSide,
      }),
    );
    mesh.scale.set(w, h, 1);
    mesh.position.set(x, y + 3.5, z);
    mesh.lookAt(0, 3.5, 0);
    room.add(mesh);
  };

  /* The gold strip uses the deeper #d4a63c rather than the bright #f3da8b:
     ACES pushes anything this intense towards white, and a white rim on the
     right would lose the half of the brand that is gold. */
  strip(0xd4a63c, 20, 2.0, 12, 6.0, 0.4, -5.2); // gold, camera right
  strip(0xfff2da, 11, 2.6, 12, -6.2, 1.0, -4.6); // cream, camera left
  strip(0xfff4e2, 7, 9.0, 3.0, 0, 7.5, -1.0); // top kicker over the cap
}

export default function BottleScene({
  accent,
  accentDeep,
  seed,
  label,
  onReady,
  onUnsupported,
  className = "",
}: BottleSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  /* Callbacks are read from refs so a parent re-render never tears the scene
     down and rebuilds it — that would burn a WebGL context per render. */
  const readyRef = useRef(onReady);
  const failRef = useRef(onUnsupported);
  readyRef.current = onReady;
  failRef.current = onUnsupported;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    /* --- capability gate ------------------------------------------------
       The probe is a real context and counts against the browser's ~16, so it
       is thrown away immediately rather than left for the collector. Opening
       the viewer twice a second would otherwise burn two contexts a go. */
    const probe = document.createElement("canvas").getContext("webgl2");
    probe?.getExtension("WEBGL_lose_context")?.loseContext();
    if (!probe) {
      failRef.current?.();
      return;
    }

    const motionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    let reduced = motionQuery?.matches ?? false;

    /* Same blunt tiering as the hero: hardwareConcurrency is the only signal
       that is cheap and universally available. */
    const cores = navigator.hardwareConcurrency ?? 8;
    const lowPower = cores <= 4 || window.innerWidth < 640;
    const maxDpr = lowPower ? 1.5 : 2;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        antialias: !lowPower,
        /* Opaque canvas. Three clears the transmission buffer to half-alpha
           white when the clear alpha is below 1, which turns the empty
           headspace into frosted milk glass. An opaque scene background is
           also what the glass gets to refract, and refracting something is
           what makes it look like glass. */
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch {
      failRef.current?.();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.outputColorSpace = SRGBColorSpace;
    /* The transmission pass re-renders the scene into an MSAA target every
       frame. Half resolution is invisible through refracting glass and roughly
       halves the cost of the most expensive thing on screen. */
    renderer.transmissionResolutionScale = lowPower ? 0.5 : 0.75;

    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    /* Vertical drags belong to the page. `pan-y` lets the browser take them
       and cancel our pointer stream, so a thumb-scroll past the viewer on a
       phone scrolls instead of spinning. */
    canvas.style.touchAction = "pan-y";
    host.appendChild(canvas);

    const scene = new Scene();
    const camera = new PerspectiveCamera(30, 1, 0.1, 100);

    let backdrop: CanvasTexture | null = null;
    let envRT: WebGLRenderTarget | null = null;
    let bottle: ReturnType<typeof buildBottle> | null = null;

    try {
      backdrop = makeBackdrop();
      scene.background = backdrop;

      const room = new RoomEnvironment();
      tintRoom(room);
      addStripLights(room);
      const pmrem = new PMREMGenerator(renderer);
      envRT = pmrem.fromScene(room, 0.04);
      scene.environment = envRT.texture;
      scene.environmentIntensity = 1.15;
      room.dispose();
      pmrem.dispose();

      bottle = buildBottle({
        accent,
        accentDeep,
        seed,
        lowPower,
        anisotropy: renderer.capabilities.getMaxAnisotropy(),
      });
      scene.add(bottle.group);
    } catch {
      bottle?.dispose();
      envRT?.dispose();
      backdrop?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      failRef.current?.();
      return;
    }

    /* --- lighting -------------------------------------------------------
       Direct lights on top of the bake. The strip lights in the environment
       draw the long edges; these add the tight specular pops on the shoulder
       and cap, laid out the way BottleArt lays out its gradients — hard white
       catch down the left, warm gold down the right. */
    const key = new DirectionalLight(0xfff6e6, 2.4);
    key.position.set(-3.4, 4.6, 6.2);
    const rimGold = new DirectionalLight(0xf3da8b, 5.2);
    rimGold.position.set(5.2, 1.4, -4.6);
    const rimCool = new DirectionalLight(0xfff4dd, 2.6);
    rimCool.position.set(-5.0, 2.2, -4.2);
    const bounce = new DirectionalLight(0xd4a63c, 1.1);
    bounce.position.set(2.8, -2.6, 2.4);
    scene.add(key, rimGold, rimCool, bounce);

    /* --- framing --------------------------------------------------------- */
    let radPerPx = 0.008;

    const frame = () => {
      const w = host.clientWidth || 1;
      const h = host.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;

      /* Fit whichever axis is tighter, so the bottle never crops in a short
         landscape panel or a narrow phone sheet. */
      const vFov = (camera.fov * Math.PI) / 180;
      const distV = BOTTLE_HEIGHT * 0.58 / Math.tan(vFov / 2);
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const distH = 0.95 / Math.tan(hFov / 2);

      camera.position.set(0, 1.25, Math.max(distV, distH));
      camera.lookAt(0, 0.05, 0);
      camera.updateProjectionMatrix();

      /* One full turn per ~1.4 container widths of drag. */
      radPerPx = (Math.PI * 2) / (w * 1.4);
    };
    frame();

    /* --- interaction ----------------------------------------------------- */
    const spin = {
      angle: 0,
      velocity: 0,
      /* Seconds since the last deliberate input. */
      idle: 0,
      autoWeight: 0,
    };
    let dragging = false;
    let pending = false; // touch gesture not yet resolved as horizontal
    let pointerId = -1;
    let lastX = 0;
    let lastMoveAt = 0;
    let startX = 0;
    let startY = 0;
    let dirty = true;

    const nudge = () => {
      spin.idle = 0;
      spin.autoWeight = 0;
      dirty = true;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      lastX = startX = e.clientX;
      startY = e.clientY;
      lastMoveAt = e.timeStamp;
      spin.velocity = 0;
      nudge();
      if (e.pointerType === "touch") {
        /* Wait for the gesture to declare itself before capturing it. */
        pending = true;
      } else {
        dragging = true;
        pointerId = e.pointerId;
        canvas.setPointerCapture(e.pointerId);
      }
      host.focus({ preventScroll: true });
    };

    const onPointerMove = (e: PointerEvent) => {
      if (pending) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) {
          /* Vertical — hand it back to the page. */
          pending = false;
          return;
        }
        pending = false;
        dragging = true;
        pointerId = e.pointerId;
        canvas.setPointerCapture(e.pointerId);
        lastX = e.clientX;
        lastMoveAt = e.timeStamp;
        return;
      }
      if (!dragging || e.pointerId !== pointerId) return;

      const dx = e.clientX - lastX;
      const dt = Math.max(8, e.timeStamp - lastMoveAt) / 1000;
      lastX = e.clientX;
      lastMoveAt = e.timeStamp;

      const turn = dx * radPerPx;
      spin.angle += turn;
      /* Velocity comes off the pointer's own timestamps rather than the frame
         clock, then gets averaged with the previous sample so one jittery
         event cannot decide how far the bottle coasts. */
      const sample = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, turn / dt));
      spin.velocity = spin.velocity * 0.4 + sample * 0.6;
      nudge();
    };

    const endDrag = (e: PointerEvent) => {
      pending = false;
      if (!dragging || e.pointerId !== pointerId) return;
      dragging = false;
      pointerId = -1;
      /* Held still before letting go? Then it was a placement, not a throw. */
      if (e.timeStamp - lastMoveAt > 90) spin.velocity = 0;
      if (canvas.hasPointerCapture(e.pointerId)) {
        canvas.releasePointerCapture(e.pointerId);
      }
      nudge();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      let step = 0;
      if (e.key === "ArrowLeft") step = -KEY_STEP;
      else if (e.key === "ArrowRight") step = KEY_STEP;
      else if (e.key === "Home") {
        spin.angle = 0;
        spin.velocity = 0;
        nudge();
        e.preventDefault();
        return;
      } else return;
      e.preventDefault();
      spin.angle += step;
      spin.velocity = 0;
      nudge();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    host.addEventListener("keydown", onKeyDown);

    /* --- loop ------------------------------------------------------------ */
    let raf: number | null = null;
    let last = performance.now();
    let visible = document.visibilityState === "visible";
    let onScreen = true;
    let announced = false;

    const draw = (now: number) => {
      /* Clamped: a long GC pause or a missed visibility event would otherwise
         teleport the bottle a third of a turn on the next frame. */
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;

      if (!dragging) {
        if (Math.abs(spin.velocity) > REST) {
          spin.angle += spin.velocity * dt;
          spin.velocity *= Math.pow(FRICTION, dt);
          dirty = true;
        } else if (spin.velocity !== 0) {
          spin.velocity = 0;
        }

        if (!reduced) {
          spin.idle += dt;
          if (spin.idle > IDLE_DELAY && Math.abs(spin.velocity) <= REST) {
            spin.autoWeight = Math.min(1, spin.autoWeight + dt / AUTO_FADE);
            spin.angle += AUTO_SPEED * spin.autoWeight * dt;
            dirty = true;
          }
        }
      }

      if (dirty) {
        dirty = false;
        if (bottle) bottle.group.rotation.y = spin.angle;
        renderer.render(scene, camera);
        if (!announced) {
          announced = true;
          readyRef.current?.();
        }
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (raf !== null || !visible || !onScreen) return;
      last = performance.now(); // drop the time spent paused
      raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (raf === null) return;
      cancelAnimationFrame(raf);
      raf = null;
    };

    const onVisibility = () => {
      visible = document.visibilityState === "visible";
      if (visible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    /* Follow the switch rather than sampling it once — someone who turns
       reduced motion off should get the idle spin back without reopening. */
    const onMotionChange = () => {
      reduced = motionQuery?.matches ?? false;
      spin.idle = 0;
      spin.autoWeight = 0;
    };
    motionQuery?.addEventListener("change", onMotionChange);

    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver(
        (entries) => {
          onScreen = entries[0]?.isIntersecting ?? true;
          if (onScreen) start();
          else stop();
        },
        { rootMargin: "80px" },
      );
      io.observe(host);
    }

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => {
        frame();
        dirty = true;
        start();
      });
      ro.observe(host);
    }

    start();

    /* --- teardown --------------------------------------------------------
       Order matters. Drop our own GPU objects first so their deletes go
       through a live context, then hand the context back.
       `forceContextLoss()` is the part that actually frees it — `dispose()`
       alone leaves the context alive until GC gets round to it, which on a
       page where the viewer is opened repeatedly is how you hit the browser's
       ~16 context ceiling. It also takes the renderer's internal transmission
       render target with it, which is not reachable from the public API. */
    return () => {
      stop();
      io?.disconnect();
      ro?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      motionQuery?.removeEventListener("change", onMotionChange);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endDrag);
      canvas.removeEventListener("pointercancel", endDrag);
      host.removeEventListener("keydown", onKeyDown);

      scene.remove(key, rimGold, rimCool, bounce);
      key.dispose();
      rimGold.dispose();
      rimCool.dispose();
      bounce.dispose();

      bottle?.dispose();
      scene.environment = null;
      scene.background = null;
      envRT?.dispose();
      backdrop?.dispose();
      scene.clear();

      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [accent, accentDeep, seed]);

  return (
    <div
      ref={hostRef}
      tabIndex={0}
      role="img"
      aria-roledescription="Interactive 3D model"
      aria-label={label}
      className={`h-full w-full outline-none focus-visible:outline-2 focus-visible:outline-gold ${className}`}
      style={{ touchAction: "pan-y", cursor: "grab" }}
    />
  );
}
