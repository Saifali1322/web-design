/**
 * Assembles the 330ml bottle out of lathes.
 *
 * Five meshes, because five materials: transmissive PET, opaque juice, the
 * juice surface, the moulded closure and the neck support ring — plus the
 * label, which rides on its own curved patch so the artwork can be a flat
 * texture instead of a projection.
 *
 * Everything returned is owned by the caller. `dispose()` releases the
 * geometries, materials and textures; the caller still has to deal with the
 * renderer and the environment map.
 */

import {
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  FrontSide,
  Group,
  LatheGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  Vector2,
  type Texture,
} from "three";

import {
  CAP_RIB_BAND,
  CAP_RIB_COUNT,
  LABEL_CY,
  LABEL_HALF_ARC,
  LABEL_R,
  LIQUID_TOP_Y,
  UNIT,
  capProfile,
  innerProfile,
  insetProfile,
  neckRingProfile,
  outerProfile,
  toHeight,
  toRadius,
  type Pt,
} from "./bottleProfile";
import {
  dropletLayout,
  makeCondensationNormal,
  makeCondensationRoughness,
  makeJuiceTexture,
  makeLabelTexture,
  makeSurfaceTexture,
} from "./bottleTextures";

/* ------------------------------------------------------------------ *
 * Profile queries
 * ------------------------------------------------------------------ */

/** Right-hand silhouette x at an SVG y, by linear search along the profile. */
function radiusAtY(pts: readonly Pt[], y: number): number {
  for (let j = 0; j < pts.length - 1; j++) {
    const [ax, ay] = pts[j];
    const [bx, by] = pts[j + 1];
    if ((y <= ay && y >= by) || (y >= ay && y <= by)) {
      const t = ay === by ? 0 : (y - ay) / (by - ay);
      return ax + (bx - ax) * t;
    }
  }
  return pts[pts.length - 1][0];
}

/**
 * The lathe's V for an SVG y.
 *
 * `LatheGeometry` sets `uv.y = j / (points.length - 1)` — the *index* along the
 * profile, not the height. Anything that needs to line up with a real height
 * (the label keep-out in the condensation map) has to go through here.
 */
function vAtY(pts: readonly Pt[], y: number): number {
  const n = pts.length;
  for (let j = 0; j < n - 1; j++) {
    const ay = pts[j][1];
    const by = pts[j + 1][1];
    if ((y <= ay && y >= by) || (y >= ay && y <= by)) {
      const t = ay === by ? 0 : (y - ay) / (by - ay);
      return (j + t) / (n - 1);
    }
  }
  return y > pts[0][1] ? 0 : 1;
}

/** SVG-space profile → lathe points in world space. */
function toLathe(pts: readonly Pt[]): Vector2[] {
  return pts.map((p) => new Vector2(toRadius(p[0]), toHeight(p[1])));
}

/* ------------------------------------------------------------------ *
 * Cap knurling
 * ------------------------------------------------------------------ */

/** 1 inside the rib band, easing to 0 over `feather` world units. */
function bandFactor(y: number, top: number, bottom: number, feather: number) {
  if (y > top || y < bottom) return 0;
  return Math.min(1, Math.min(top - y, y - bottom) / feather);
}

/**
 * Pushes the cap's radius in and out around its circumference to make ribs.
 *
 * Modulating the lathe beats modelling individual rib meshes: the ribs end up
 * in the silhouette as well as the shading, they follow the cap's bevels for
 * free, and it stays one draw call.
 */
function knurl(
  geo: BufferGeometry,
  segments: number,
  ribs: number,
  amplitude: number,
  topY: number,
  bottomY: number,
): void {
  const pos = geo.attributes.position;
  const perMeridian = pos.count / (segments + 1);

  for (let i = 0; i <= segments; i++) {
    const phi = (i / segments) * Math.PI * 2;
    const wave = 0.5 - 0.5 * Math.cos(ribs * phi);
    for (let j = 0; j < perMeridian; j++) {
      const idx = i * perMeridian + j;
      const f = bandFactor(pos.getY(idx), topY, bottomY, 0.012);
      if (f === 0) continue;
      const x = pos.getX(idx);
      const z = pos.getZ(idx);
      const r = Math.hypot(x, z);
      if (r < 1e-6) continue;
      const k = 1 + (amplitude * f * (wave - 0.5)) / r;
      pos.setX(idx, x * k);
      pos.setZ(idx, z * k);
    }
  }

  pos.needsUpdate = true;
  geo.computeVertexNormals();

  /* computeVertexNormals treats the lathe's duplicated seam meridian as two
     unrelated edges, which leaves a hairline crease running up the cap.
     Averaging the two rings puts it back. */
  const nrm = geo.attributes.normal;
  const last = segments * perMeridian;
  for (let j = 0; j < perMeridian; j++) {
    const a = j;
    const b = last + j;
    const nx = (nrm.getX(a) + nrm.getX(b)) / 2;
    const ny = (nrm.getY(a) + nrm.getY(b)) / 2;
    const nz = (nrm.getZ(a) + nrm.getZ(b)) / 2;
    const len = Math.hypot(nx, ny, nz) || 1;
    nrm.setXYZ(a, nx / len, ny / len, nz / len);
    nrm.setXYZ(b, nx / len, ny / len, nz / len);
  }
  nrm.needsUpdate = true;
}

/* ------------------------------------------------------------------ *
 * Build
 * ------------------------------------------------------------------ */

export interface BottleBuildOptions {
  accent: string;
  accentDeep: string;
  /** Varies the condensation between flavours. */
  seed: number;
  /** Cuts segment counts and map sizes on weak hardware. */
  lowPower: boolean;
  /** From `renderer.capabilities.getMaxAnisotropy()`. */
  anisotropy: number;
}

export interface BottleBuild {
  /** Spin this on Y. Already centred on the origin. */
  group: Group;
  dispose(): void;
}

export function buildBottle(opts: BottleBuildOptions): BottleBuild {
  const { accent, accentDeep, seed, lowPower, anisotropy } = opts;

  const geometries: BufferGeometry[] = [];
  const materials: Material[] = [];
  const textures: Texture[] = [];

  const track = <T extends Texture>(t: T): T => {
    t.anisotropy = anisotropy;
    textures.push(t);
    return t;
  };

  const quality = lowPower ? 0.65 : 1;
  const bodySegments = lowPower ? 64 : 112;

  const group = new Group();

  /* ---- glass ---- */

  const outer = outerProfile(quality);
  const glassGeo = new LatheGeometry(toLathe(outer), bodySegments);
  geometries.push(glassGeo);

  /* Beads of condensation, kept off the label. The keep-out has to be
     expressed in the lathe's own V, which is index-based, not height-based. */
  const labelV: [number, number] = [
    vAtY(outer, LABEL_CY + LABEL_R),
    vAtY(outer, LABEL_CY - LABEL_R),
  ];
  const labelMidR = radiusAtY(outer, LABEL_CY) - 100;
  const labelHalfU = LABEL_HALF_ARC / (2 * Math.PI * labelMidR);
  const drops = dropletLayout(
    seed,
    lowPower ? 22 : 42,
    labelV,
    labelHalfU,
  );

  const condNormal = track(
    makeCondensationNormal(drops, lowPower ? 256 : 512, lowPower ? 512 : 1024),
  );
  const condRough = track(makeCondensationRoughness(drops, seed));

  const glassMat = new MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    /* The map carries the actual value; `roughness` is the multiplier. */
    roughness: 1,
    roughnessMap: condRough,
    transmission: 1,
    ior: 1.46,
    /* PET, not a paperweight. Thicker and the volume absorption crushes the
       empty shoulder into a black mass. */
    thickness: 0.3,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.7,
    normalMap: condNormal,
    normalScale: new Vector2(0.85, 0.85),
    side: FrontSide,
  });
  materials.push(glassMat);
  const glass = new Mesh(glassGeo, glassMat);
  glass.renderOrder = 2;
  group.add(glass);

  /* ---- juice ---- */

  const inner = insetProfile(innerProfile(quality), 2.2);
  const liquidGeo = new LatheGeometry(toLathe(inner), bodySegments);
  geometries.push(liquidGeo);

  const juiceTex = track(makeJuiceTexture(accent, accentDeep));
  /* Opaque on purpose. Three renders opaque geometry into the transmission
     buffer that the glass then samples, so an opaque juice is what makes the
     juice visible *through* the bottle. Give the juice its own transmission
     and it drops out of that buffer and the bottle reads as empty. */
  const liquidMat = new MeshPhysicalMaterial({
    map: juiceTex,
    metalness: 0,
    roughness: 0.24,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.6,
    side: FrontSide,
  });
  materials.push(liquidMat);
  group.add(new Mesh(liquidGeo, liquidMat));

  /* ---- juice surface ----
     The liquid lathe is open at the top, so without this you can see straight
     down into an empty shell from any raised camera angle. Sitting it a hair
     below the rim leaves the lathe's top ring showing as a meniscus lip. */
  const surfaceR = toRadius(radiusAtY(inner, LIQUID_TOP_Y));
  const surfaceGeo = new CircleGeometry(surfaceR, lowPower ? 48 : 72);
  surfaceGeo.rotateX(-Math.PI / 2);
  geometries.push(surfaceGeo);

  const surfaceTex = track(makeSurfaceTexture(accent, accentDeep));
  const surfaceMat = new MeshPhysicalMaterial({
    map: surfaceTex,
    metalness: 0,
    roughness: 0.08,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envMapIntensity: 1.1,
    side: DoubleSide,
  });
  materials.push(surfaceMat);
  const surface = new Mesh(surfaceGeo, surfaceMat);
  surface.position.y = toHeight(LIQUID_TOP_Y) - 0.006;
  group.add(surface);

  /* ---- label ---- */

  const labelTop = LABEL_CY - LABEL_R;
  const labelBottom = LABEL_CY + LABEL_R;
  const standoff = 0.008;
  const labelGeo = new CylinderGeometry(
    toRadius(radiusAtY(outer, labelTop)) + standoff,
    toRadius(radiusAtY(outer, labelBottom)) + standoff,
    LABEL_R * 2 * UNIT,
    lowPower ? 40 : 64,
    1,
    true,
    /* theta 0 faces +Z, so centring the sweep puts the label at the front. */
    -(LABEL_HALF_ARC / labelMidR),
    (2 * LABEL_HALF_ARC) / labelMidR,
  );
  geometries.push(labelGeo);

  const labelTex = track(makeLabelTexture(lowPower ? 768 : 1024));
  /* Transparent rather than alpha-tested, which forces it into the queue that
     runs *after* the transmissive glass. As an opaque object it would land in
     the transmission buffer instead and the glass would paint over it —
     a refracted, washed-out label sitting behind its own bottle. */
  const labelMat = new MeshPhysicalMaterial({
    map: labelTex,
    transparent: true,
    depthWrite: false,
    metalness: 0,
    roughness: 0.42,
    clearcoat: 0.75,
    clearcoatRoughness: 0.16,
    envMapIntensity: 1.05,
    side: FrontSide,
  });
  materials.push(labelMat);
  const label = new Mesh(labelGeo, labelMat);
  label.position.y = toHeight(LABEL_CY);
  label.renderOrder = 6;
  group.add(label);

  /* ---- cap ---- */

  const capSegments = lowPower ? 120 : 192;
  const ribs = lowPower ? 24 : CAP_RIB_COUNT;
  const capGeo = new LatheGeometry(toLathe(capProfile()), capSegments);
  /* ±1.5 SVG units of relief. Subtler and the knurling disappears under the
     cap's own specular; deeper and a 39-unit cap starts looking like a gear. */
  knurl(
    capGeo,
    capSegments,
    ribs,
    0.03,
    toHeight(CAP_RIB_BAND[0]),
    toHeight(CAP_RIB_BAND[1]),
  );
  geometries.push(capGeo);

  /* Open at the bottom, like a real closure — the glass neck runs up inside
     it. DoubleSide so the underside of the skirt is shaded rather than a hole
     when the bottle is tipped. */
  const capMat = new MeshPhysicalMaterial({
    color: 0xf2ede3,
    metalness: 0.12,
    roughness: 0.34,
    clearcoat: 0.55,
    clearcoatRoughness: 0.3,
    envMapIntensity: 1.05,
    side: DoubleSide,
  });
  materials.push(capMat);
  group.add(new Mesh(capGeo, capMat));

  /* ---- neck support ring ---- */

  const ringGeo = new LatheGeometry(
    toLathe(neckRingProfile()),
    lowPower ? 40 : 72,
  );
  geometries.push(ringGeo);
  const ringMat = new MeshPhysicalMaterial({
    color: 0xf7f1e4,
    metalness: 0,
    roughness: 0.22,
    transmission: 0.7,
    ior: 1.46,
    thickness: 0.05,
    envMapIntensity: 1.2,
    side: FrontSide,
  });
  materials.push(ringMat);
  const ring = new Mesh(ringGeo, ringMat);
  ring.renderOrder = 1;
  group.add(ring);

  return {
    group,
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
      group.clear();
    },
  };
}
