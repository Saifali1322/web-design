/**
 * The cut fruit drifting around the bottle.
 *
 * This is where "the fruit spins and moves" actually belongs. It cannot be
 * baked into the bottle: each product photograph is one fixed camera angle of
 * a whole scene, and a flat photo wrapped on a turning cylinder tears the
 * moment it turns away from that angle. So the fruit lives *beside* the model
 * instead — real cutouts, at real depths, in the same scene, moving
 * independently of the bottle.
 *
 * Billboards rather than modelled fruit: each piece is a photograph taken from
 * one angle, so it only has one angle to give. Rolling them in the view plane
 * reads as tumbling; turning them out of it would show that they are flat.
 *
 * Lit by nothing. `MeshBasicMaterial` on purpose — the cutouts already carry
 * the shoot's key light, and running that through the scene's lights a second
 * time is how a composite starts looking like a composite.
 *
 * Everything here is the caller's to dispose, textures included.
 */

import {
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  type Texture,
} from "three";

import type { PhotoFruit } from "./photoAssets";

/** Peak drift, world units. Small enough to read as float, not as orbit. */
const DRIFT_X = 0.1;
const DRIFT_Y = 0.15;
const DRIFT_Z = 0.11;
/** Radians per second at rate 1 — one turn every ~75 seconds. */
const ROLL_SPEED = 0.085;

export interface FruitField {
  group: Group;
  /**
   * Re-reads the camera framing, so the layout's frame-relative coordinates
   * can be turned into world positions. Call whenever the stage resizes.
   */
  setFrame(cameraY: number, cameraZ: number, targetY: number, tanHalfFov: number, aspect: number): void;
  /** `seconds` since the scene opened. `still` freezes the resting pose. */
  update(seconds: number, still: boolean): void;
  dispose(): void;
}

interface Piece {
  mesh: Mesh;
  layout: PhotoFruit;
  phase: number;
  spin: number;
  /** Resting world position, recomputed by `setFrame`. */
  baseX: number;
  baseY: number;
}

/**
 * @param layout   Where each piece sits, from the generated manifest.
 * @param textures Same order as `layout`; `null` entries are skipped, so a
 *                 file that failed to load costs one missing orange rather
 *                 than a broken viewer.
 */
export function buildFruitField(
  layout: readonly PhotoFruit[],
  textures: readonly (Texture | null)[],
): FruitField {
  const group = new Group();
  const pieces: Piece[] = [];
  const geometry = new PlaneGeometry(1, 1);
  const materials: MeshBasicMaterial[] = [];

  layout.forEach((entry, i) => {
    const tex = textures[i];
    if (!tex) return;

    const material = new MeshBasicMaterial({
      map: tex,
      transparent: true,
      /* Off, so pieces never punch a hole in each other's soft edges. The
         renderer's back-to-front sort handles the ordering between them, and
         the bottle — which does write depth — still occludes anything behind
         it. */
      depthWrite: false,
      /* Held back from full strength so the fruit stays scenery. The piece
         nearest the camera is the most distracting, so it is also the most
         restrained. */
      opacity: entry.z > 0 ? 0.82 : 0.92,
    });
    materials.push(material);

    const mesh = new Mesh(geometry, material);
    mesh.scale.setScalar(entry.size);
    mesh.rotation.z = entry.roll;
    /* After the label and the JC. patch (6) in the transparent queue.
       Ordering there is by renderOrder first, and the label writes no depth,
       so drawing the fruit earlier would let the label paint straight over a
       piece that is physically in front of it. Going last is right in both
       directions: a piece BEHIND the bottle is already rejected by the
       glass's depth, whatever order it is drawn in. */
    mesh.renderOrder = 7;
    group.add(mesh);

    pieces.push({
      mesh,
      layout: entry,
      /* Golden angle: no two pieces ever fall into step, however long the
         modal stays open. */
      phase: i * 2.39996,
      spin: i % 2 ? -1 : 1,
      baseX: 0,
      baseY: 0,
    });
  });

  return {
    group,

    setFrame(cameraY, cameraZ, targetY, tanHalfFov, aspect) {
      for (const p of pieces) {
        /* The frustum is wider further from the camera, and the camera is
           tilted down a few degrees, so both the half-extents and the frame's
           own centre depend on the piece's depth. Without this, a layout tuned
           on a desktop panel would put fruit through the bottle on a phone. */
        const distance = cameraZ - p.layout.z;
        const halfH = distance * tanHalfFov;
        const halfW = halfH * aspect;
        const centreY = cameraY + ((targetY - cameraY) * distance) / cameraZ;
        p.baseX = p.layout.x * halfW;
        p.baseY = centreY + p.layout.y * halfH;
      }
    },

    update(seconds, still) {
      const t = still ? 0 : seconds;
      for (const p of pieces) {
        const { rate, z, roll } = p.layout;
        p.mesh.position.set(
          p.baseX + DRIFT_X * Math.sin(t * 0.23 * rate + p.phase),
          p.baseY + DRIFT_Y * Math.sin(t * 0.17 * rate + p.phase * 1.7),
          z + DRIFT_Z * Math.sin(t * 0.13 * rate + p.phase * 2.3),
        );
        p.mesh.rotation.z = roll + t * ROLL_SPEED * rate * p.spin;
      }
    },

    dispose() {
      geometry.dispose();
      for (const m of materials) {
        m.map?.dispose();
        m.dispose();
      }
      group.clear();
    },
  };
}
