"use client";

/**
 * The bottle viewer's front door — and the boundary that keeps three.js out of
 * the /menu bundle.
 *
 * Nothing in this module imports three. `BottleScene` is reached only through
 * `next/dynamic({ ssr: false })`, which compiles to a separate chunk fetched
 * the first time the component renders. Since the component is only rendered
 * once the modal is open, the renderer is downloaded when somebody asks for it
 * and never before.
 *
 * Underneath the canvas sits the vector bottle from the hero — the same
 * silhouette, the same gradients, painted instantly with no JS. It is the
 * poster, and it is also the fallback: if there is no WebGL2, or the scene
 * fails to build, the canvas simply never fades in and nobody sees an error.
 */

import dynamic from "next/dynamic";
import { useCallback, useId, useState } from "react";
import BottleArt, { VB_H, VB_W } from "@/components/hero/BottleArt";

const BottleScene = dynamic(() => import("./BottleScene"), {
  ssr: false,
  loading: () => null,
});

export interface Bottle3DViewerProps {
  accent: string;
  accentDeep: string;
  /** Product name, used to build the canvas's accessible name. */
  name: string;
  /** Varies the condensation between flavours. */
  seed?: number;
  /** False keeps the poster only — nothing WebGL is created. */
  active?: boolean;
  className?: string;
}

export default function Bottle3DViewer({
  accent,
  accentDeep,
  name,
  seed = 1,
  active = true,
  className = "",
}: Bottle3DViewerProps) {
  const uid = useId().replace(/:/g, "");
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const onReady = useCallback(() => setReady(true), []);
  const onUnsupported = useCallback(() => setFailed(true), []);

  const live = active && !failed;

  return (
    <div className={`relative h-full w-full ${className}`}>
      {/* Poster. Sized to 92% of the stage height, which is the share of the
          frame the 3D camera gives the bottle, so the cross-fade is a dissolve
          rather than a jump. It is also the permanent picture when there is no
          WebGL2, which is the other reason to get the size right. */}
      <div
        aria-hidden={ready ? "true" : undefined}
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ease-out ${
          ready ? "opacity-0" : "opacity-100"
        }`}
      >
        {/* Aspect straight off the art's own viewBox rather than a literal, so
            re-cutting the silhouette can never leave the poster letterboxed
            inside a box shaped like the previous bottle. */}
        <div className="h-[92%]" style={{ aspectRatio: `${VB_W} / ${VB_H}` }}>
          <BottleArt
            uid={`b3d-${uid}`}
            accent={accent}
            accentDeep={accentDeep}
            seed={seed}
            dropletCount={12}
            labelDetail="full"
            arcs
            width="100%"
            height="100%"
            title={`${name} — 330ml bottle`}
          />
        </div>
      </div>

      {live ? (
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            ready ? "opacity-100" : "opacity-0"
          }`}
        >
          <BottleScene
            accent={accent}
            accentDeep={accentDeep}
            seed={seed}
            label={`${name} bottle in 3D. Drag to spin it, or use the left and right arrow keys.`}
            onReady={onReady}
            onUnsupported={onUnsupported}
          />
        </div>
      ) : null}

      {/* Only promise an interaction that exists. On the SVG fallback there is
          nothing to drag. */}
      {live && ready ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[0.625rem] uppercase tracking-label text-cream-faint">
          Drag to spin
        </p>
      ) : null}
    </div>
  );
}
