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
  FOAM_BOTTOM_Y,
  JC_BASELINE_Y,
  JC_PATCH_H,
  JC_PATCH_W,
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
  makeJCTexture,
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

/**
 * A patch of artwork wrapped on the bottle, as a lathe over the real profile.
 *
 * A cone would be simpler, but the label now reaches up onto the shoulder,
 * where a straight generatrix cuts inside the curve and lets the glass tear
 * through the artwork. Sampling the profile at uniform `y` keeps the lathe's
 * `uv.y` (which is index-based) linear in height, so the flat texture still
 * lands square on it.
 */
function curvedPatch(
  profile: readonly Pt[],
  yTop: number,
  yBottom: number,
  halfArc: number,
  midRadius: number,
  standoff: number,
  radialSegments: number,
  heightSegments: number,
): LatheGeometry {
  const pts: Vector2[] = [];
  for (let i = 0; i <= heightSegments; i++) {
    /* Bottom to top, so the lathe's normals face outward and v=0 is the foot. */
    const y = yBottom + ((yTop - yBottom) * i) / heightSegments;
    pts.push(new Vector2(toRadius(radiusAtY(profile, y)) + standoff, toHeight(y)));
  }
  return new LatheGeometry(
    pts,
    radialSegments,
    /* theta 0 faces +Z, so centring the sweep puts the artwork at the front. */
    -(halfArc / midRadius),
    (2 * halfArc) / midRadius,
  );
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
  /**
   * Swaps the drawn label for the photographed one, once it has decoded.
   *
   * The bottle is built synchronously so the first frame is never waiting on
   * the network, which means the real sticker — a file, and therefore a
   * promise — can only arrive afterwards. Ownership of `tex` transfers here:
   * it goes on the build's disposal list and the texture it replaces is freed
   * immediately.
   */
  useLabelTexture(tex: Texture): void;
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

  /* The foam line has to be placed in the lathe's index-based V, not as a
     fraction of the liquid's height, or it lands wherever the shoulder
     happened to be sampled most densely. */
  const juiceTex = track(
    makeJuiceTexture(accent, accentDeep, vAtY(inner, FOAM_BOTTOM_Y)),
  );
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

  const standoff = 0.008;
  const labelGeo = curvedPatch(
    outer,
    LABEL_CY - LABEL_R,
    LABEL_CY + LABEL_R,
    LABEL_HALF_ARC,
    labelMidR,
    standoff,
    lowPower ? 40 : 64,
    lowPower ? 8 : 14,
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
  label.renderOrder = 6;
  group.add(label);

  /* ---- JC. ----
     Its own patch, same trick as the label: a curved quad carrying flat
     artwork. Additive rather than alpha-blended would bloom over the juice, so
     it is a plain transparent map sitting a hair off the glass. */

  const jcMidR = radiusAtY(outer, JC_BASELINE_Y - JC_PATCH_H / 2) - 100;
  const jcHalfArc = JC_PATCH_W / 2;
  const jcGeo = curvedPatch(
    outer,
    JC_BASELINE_Y - JC_PATCH_H,
    JC_BASELINE_Y,
    jcHalfArc,
    jcMidR,
    standoff,
    lowPower ? 20 : 32,
    2,
  );
  geometries.push(jcGeo);

  const jcTex = track(makeJCTexture(lowPower ? 192 : 256));
  const jcMat = new MeshPhysicalMaterial({
    map: jcTex,
    transparent: true,
    depthWrite: false,
    metalness: 0,
    roughness: 0.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.9,
    side: FrontSide,
  });
  materials.push(jcMat);
  const jc = new Mesh(jcGeo, jcMat);
  jc.renderOrder = 6;
  group.add(jc);

  /* ---- cap ---- */

  const capSegments = lowPower ? 176 : 300;
  const ribs = lowPower ? 44 : CAP_RIB_COUNT;
  const capGeo = new LatheGeometry(toLathe(capProfile()), capSegments);
  /* ±1.1 SVG units of relief. The closure carries 76 fine ribs rather than
     the 40 coarse ones this used to model, and at that pitch anything deeper
     reads as a gear rather than knurling. */
  knurl(
    capGeo,
    capSegments,
    ribs,
    0.022,
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

    useLabelTexture(tex: Texture) {
      const previous = labelMat.map;
      labelMat.map = track(tex);
      labelMat.needsUpdate = true;
      if (previous) {
        /* Drop it from the disposal list as well as from the GPU — leaving a
           disposed texture there would double-free on unmount. */
        const i = textures.indexOf(previous);
        if (i >= 0) textures.splice(i, 1);
        previous.dispose();
      }
    },

    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const t of textures) t.dispose();
      group.clear();
    },
  };
}
