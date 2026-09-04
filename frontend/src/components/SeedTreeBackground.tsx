// @ts-nocheck
/* SeedTreeBackground.tsx — a procedurally-generated, textured 3D plant,
   built and grown with three.js, that lives as a FIXED full-bleed
   background behind every section of the homepage below the hero
   (Everything in one platform / How it works / stats / CTA). It does
   not sit in normal document flow — it measures the "growth zone"
   wrapper (passed in via `zoneRef`) and maps how far that zone has
   scrolled through the viewport onto a 0→1 growth value.

   Shape: a central stem that gently zig-zags left/right as it rises,
   with long, nearly-horizontal branches sprouting out from almost every
   point along its height (alternating sides) and running all the way
   toward the edges of the screen. The brief from the reference sketches
   was explicit: leaf COUNT can stay low, but the branches themselves
   must be big enough to spread across the ENTIRE background — behind
   the flanking dashboards and copy, not just the empty middle column —
   by the time the visitor has scrolled through the section, rather than
   staying clustered around the center. Every leaf, on the main stem or
   on any branch, is sized the same (only the tiniest natural jitter), so
   the plant reads as one consistent species rather than leaves of
   differing sizes.

   The stem and branches use a procedurally-painted bark texture
   (canvas-generated at runtime, no external image assets) with smooth
   shading instead of a flat color, and each leaf is a textured,
   organically-edged silhouette with veins baked into its texture rather
   than a plain vector shape.

   As the visitor scrolls down past the hero:
   - a small seed/mound sits at the base before anything else appears
   - the central stem grows upward one short zig-zag segment at a time
   - once a given stem segment finishes growing, the branch rooted at
     that point starts growing outward through its own segments, and
     leaves along both the stem and its branches ease in one at a time
     as their host segment finishes — so branches and leaves keep
     appearing continuously as scrolling continues, covering more and
     more of the background, rather than everything popping in at once
   - once mostly grown, the whole plant settles into a gentle idle sway,
     and each leaf flutters very slightly and independently

   The whole thing fades in just before the zone enters the viewport
   and fades out again as the footer approaches, so it never overlaps
   the (separately animated) photo hero above it.

   Three.js is loaded from a CDN at runtime — same pattern already used
   by FarmBackdrop.jsx — so no npm install / build step is required for
   it specifically. This file itself is TypeScript (.tsx) per the
   project's newest component; the rest of the app is still plain
   JavaScript/JSX, which Vite + esbuild happily builds side-by-side with
   no extra config.
*/
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

// Small deterministic PRNG (mulberry32) so the generated plant shape is
// stable across reloads instead of re-randomizing every page load.
function mulberry32(seed: number) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// How many short straight segments make up the wavy central stem — each
// one tilts slightly the opposite way from the last, approximating the
// gentle S-curve in the reference sketch.
const NUM_STEM_SEGMENTS = 20;
const STEM_SEGMENT_LENGTH = 0.62;
const STEM_BASE_RADIUS = 0.07;
const STEM_TIP_RADIUS = 0.022;

// Growth range the central stem occupies; branches and leaves are
// revealed afterward, each keyed off its own attachment point's end.
const STEM_GROWTH_START = 0.06;
const STEM_GROWTH_END = 0.8;

// Branches start almost immediately (only the very base of the stem is
// bare) and sprout from nearly every remaining segment, alternating
// sides. Each branch runs many segments long and nearly horizontal so
// the plant spreads all the way to the edges of the background instead
// of staying clustered around the central stem — leaf COUNT stays low
// (see BRANCH_LEAVES_PER_SEGMENT), the reach is what needed to grow.
const BRANCH_START_INDEX = 1;
const BRANCH_SEGMENTS = 9;
const BRANCH_BASE_LENGTH = 0.95;
const BRANCH_LEAVES_PER_SEGMENT = 1;

const LEAF_COLORS = [0x5fb35a, 0x4a9c46, 0x6dbd63, 0x3f8a3f, 0x7fc46f];
// All leaves share one target size (only a tiny jitter) so the plant
// reads as a single consistent species rather than mismatched leaves.
const LEAF_UNIFORM_SIZE = 1.3;

type StemSeg = {
  length: number;
  radius: number;
  tiltZ: number;
  tiltX: number;
};

function buildStemPlan(rand: () => number): StemSeg[] {
  const segs: StemSeg[] = [];
  for (let i = 0; i < NUM_STEM_SEGMENTS; i++) {
    const t = i / (NUM_STEM_SEGMENTS - 1);
    const radius = STEM_BASE_RADIUS + (STEM_TIP_RADIUS - STEM_BASE_RADIUS) * t;
    const side = i % 2 === 0 ? 1 : -1; // alternate zig-zag direction
    segs.push({
      length: STEM_SEGMENT_LENGTH * (0.92 + rand() * 0.16),
      radius,
      tiltZ: side * (0.16 + rand() * 0.08),
      tiltX: (rand() - 0.5) * 0.12,
    });
  }
  return segs;
}

// A branch: several segments continuing roughly the same outward
// direction (set by the first segment) with a little wiggle after that,
// tapering thinner than the segment it grows out of.
function buildBranchPlan(rand: () => number, parentRadius: number, side: 1 | -1): StemSeg[] {
  const segs: StemSeg[] = [];
  // Nearly horizontal (63°-97° from the stem) so the branch runs out
  // toward the edge of the screen rather than curling back up alongside
  // the stem — that's what lets a handful of long branches cover the
  // full width of the background instead of just the center column.
  const outwardAngle = side * (1.1 + rand() * 0.5);
  for (let j = 0; j < BRANCH_SEGMENTS; j++) {
    const t = j / (BRANCH_SEGMENTS - 1);
    const radius = Math.max(0.012, parentRadius * 0.55 * (1 - t * 0.75));
    segs.push({
      length: BRANCH_BASE_LENGTH * (0.85 + rand() * 0.3),
      // Only a small wiggle after the initial outward turn — enough to
      // look organic, not enough to fold the branch back toward center.
      tiltZ: j === 0 ? outwardAngle : (rand() - 0.5) * 0.16,
      tiltX: (rand() - 0.5) * 0.14,
      radius,
    });
  }
  return segs;
}

const LEAF_WORLD_WIDTH = 0.46;
const LEAF_WORLD_HEIGHT = 0.7;

// A flat plane sized to the leaf texture below; the actual leaf
// silhouette (organic edge, veins) comes entirely from that texture's
// alpha channel, not from the geometry itself.
function buildLeafGeometry(THREE: any) {
  const geo = new THREE.PlaneGeometry(LEAF_WORLD_WIDTH, LEAF_WORLD_HEIGHT, 1, 1);
  geo.translate(0, LEAF_WORLD_HEIGHT / 2, 0); // base (attachment point) at y=0
  return geo;
}

// A hand-drawn-looking leaf, rendered once to an offscreen canvas and
// used as a texture: a pointed-at-both-ends silhouette with a slightly
// irregular (not perfectly smooth) edge, a center vein and a few side
// veins baked in as alpha/darkness detail. The fill itself is near-white
// so each leaf's actual green comes from its own MeshStandardMaterial
// color (multiplied against this texture) — one shared texture, many
// tinted instances.
function buildLeafTexture(THREE: any, rand: () => number) {
  const w = 128;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const topY = 8;
  const botY = h - 8;
  const halfW = w * 0.33;
  const steps = 16;

  ctx.beginPath();
  ctx.moveTo(cx, botY);
  for (let i = 1; i <= steps; i++) {
    const tt = i / steps;
    const y = botY - tt * (botY - topY);
    const widthFactor = Math.sin(tt * Math.PI);
    const jitter = tt > 0.04 && tt < 0.96 ? (rand() - 0.5) * 5 : 0;
    ctx.lineTo(cx + halfW * widthFactor + jitter, y);
  }
  for (let i = steps - 1; i >= 0; i--) {
    const tt = i / steps;
    const y = botY - tt * (botY - topY);
    const widthFactor = Math.sin(tt * Math.PI);
    const jitter = tt > 0.04 && tt < 0.96 ? (rand() - 0.5) * 5 : 0;
    ctx.lineTo(cx - halfW * widthFactor - jitter, y);
  }
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, topY, 0, botY);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(228,232,222,1)');
  grad.addColorStop(1, 'rgba(255,255,255,1)');
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.strokeStyle = 'rgba(35,55,25,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, botY - 3);
  ctx.lineTo(cx, topY + 3);
  ctx.stroke();

  const veinPairs = 5;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(35,55,25,0.28)';
  for (let i = 1; i <= veinPairs; i++) {
    const tt = i / (veinPairs + 1);
    const y = botY - tt * (botY - topY);
    const widthFactor = Math.sin(tt * Math.PI);
    const xr = cx + halfW * widthFactor * 0.7;
    const xl = cx - halfW * widthFactor * 0.7;
    ctx.beginPath();
    ctx.moveTo(cx, y + 6);
    ctx.lineTo(xr, y - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, y + 6);
    ctx.lineTo(xl, y - 6);
    ctx.stroke();
  }
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

// A tileable bark-like texture (vertical streaks + faint ring marks over
// a mottled brown base), rendered once to an offscreen canvas — used in
// place of a flat solid color so the stem and branches read as wood
// rather than smooth plastic.
function buildBarkTexture(THREE: any, rand: () => number) {
  const w = 64;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const base = ctx.createLinearGradient(0, 0, w, 0);
  base.addColorStop(0, '#5c4023');
  base.addColorStop(0.5, '#6f4e2c');
  base.addColorStop(1, '#4a3319');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 46; i++) {
    const x = rand() * w;
    const lighter = rand() > 0.5;
    ctx.strokeStyle = lighter
      ? `rgba(140,105,65,${0.12 + rand() * 0.22})`
      : `rgba(30,20,10,${0.14 + rand() * 0.22})`;
    ctx.lineWidth = 0.6 + rand() * 1.6;
    ctx.beginPath();
    let y = -rand() * 30;
    ctx.moveTo(x, y);
    while (y < h) {
      y += 14 + rand() * 22;
      ctx.lineTo(x + (rand() - 0.5) * 7, y);
    }
    ctx.stroke();
  }

  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const y = rand() * h;
    ctx.strokeStyle = `rgba(25,17,9,${0.06 + rand() * 0.1})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y + (rand() - 0.5) * 5);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 3);
  tex.needsUpdate = true;
  return tex;
}

export default function SeedTreeBackground({ zoneRef }: { zoneRef: RefObject<HTMLElement> }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootStyleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const rootEl = rootStyleRef.current;
    if (!canvas || !rootEl) return undefined;

    let disposed = false;
    let renderer: any, scene: any, camera: any, frameId: number;
    let stemPivots: { pivot: any; start: number; end: number }[] = [];
    let leaves: {
      mesh: any;
      startThreshold: number;
      stagger: number;
      baseRotZ: number;
      baseRotY: number;
      phase: number;
    }[] = [];
    let treeRoot: any;
    let resizeObserver: ResizeObserver | undefined;
    let growth = 0; // smoothed 0..1
    let targetGrowth = 0;
    let opacity = 0;
    let targetOpacity = 0;

    const getViewportSize = () => ({ w: window.innerWidth, h: window.innerHeight });

    const computeTargets = () => {
      const zoneEl = zoneRef.current;
      if (!zoneEl) return;
      const rect = zoneEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const zoneTop = rect.top; // relative to viewport, right now
      const zoneHeight = rect.height;

      // Growth progress: starts as soon as the zone's top reaches ~40% down
      // the viewport, completes by roughly halfway through the zone's
      // height — so the plant is already fully grown well before the
      // visitor reaches the bottom, leaving a long stretch of scrolling
      // with the fully-grown plant just gently swaying in place.
      const scrolledIntoZone = vh * 0.4 - zoneTop;
      const raw = zoneHeight > 0 ? scrolledIntoZone / (zoneHeight * 0.48) : 0;
      targetGrowth = Math.min(1, Math.max(0, raw));

      // Opacity: fade in over the 60% of viewport height before the zone
      // top arrives, fade out over the last 40% of viewport height of the
      // zone (as its bottom approaches / passes the viewport).
      const fadeInStart = vh * 0.9;
      const fadeInEnd = vh * 0.15;
      let fadeIn = 1;
      if (zoneTop > fadeInEnd) {
        fadeIn = 1 - smoothstep(fadeInEnd, fadeInStart, zoneTop);
      }
      const zoneBottom = zoneTop + zoneHeight;
      // fade out as the zone's bottom rises above roughly the top 25% of the viewport
      let fadeOutFactor = 1;
      if (zoneBottom < vh * 0.9) {
        fadeOutFactor = smoothstep(-vh * 0.1, vh * 0.55, zoneBottom);
      }
      targetOpacity = Math.min(1, Math.max(0, fadeIn * fadeOutFactor));
    };

    const onScroll = () => computeTargets();
    const onResize = () => {
      computeTargets();
      if (renderer && camera) {
        const { w: nw, h: nh } = getViewportSize();
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    };

    (async () => {
      try {
        const THREE = await import(/* @vite-ignore */ THREE_CDN);
        if (disposed) return;

        const { w, h } = getViewportSize();
        scene = new THREE.Scene();
        // Wide FOV and pulled well back — branches now reach far enough
        // sideways and the stem grows tall enough that the plant is meant
        // to fill the ENTIRE background behind the dashboards and copy,
        // not just a column behind the middle gap.
        camera = new THREE.PerspectiveCamera(62, w / h, 0.1, 120);
        camera.position.set(0, 5.2, 20);
        camera.lookAt(0, 4.6, 0);

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        const sun = new THREE.DirectionalLight(0xfff6e0, 1.0);
        sun.position.set(4, 8, 5);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.near = 1;
        sun.shadow.camera.far = 25;
        sun.shadow.camera.left = -6;
        sun.shadow.camera.right = 6;
        sun.shadow.camera.top = 9;
        sun.shadow.camera.bottom = -3;
        sun.shadow.bias = -0.001;
        scene.add(ambient, sun);

        // Ground mound + seed
        treeRoot = new THREE.Group();
        treeRoot.position.set(0, -2.4, 0);
        // Scale the whole plant up so the finished tree — stem plus its
        // wide-reaching branches — is genuinely big enough to run behind
        // the flanking dashboards and text, not just the empty middle gap.
        treeRoot.scale.setScalar(1.35);
        scene.add(treeRoot);

        const groundGeo = new THREE.CylinderGeometry(1.15, 1.35, 0.4, 8);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x8a6238, flatShading: true, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.position.y = 0;
        ground.receiveShadow = true;
        treeRoot.add(ground);

        const seedGeo = new THREE.SphereGeometry(0.16, 6, 5);
        const seedMat = new THREE.MeshStandardMaterial({ color: 0x5c3d20, flatShading: true, roughness: 0.9 });
        const seed = new THREE.Mesh(seedGeo, seedMat);
        seed.position.y = 0.24;
        treeRoot.add(seed);

        const rand = mulberry32(20260609);
        const stemPlan = buildStemPlan(rand);
        const leafGeo = buildLeafGeometry(THREE);
        const leafTexture = buildLeafTexture(THREE, rand);
        const barkTexture = buildBarkTexture(THREE, rand);
        const segRange = (STEM_GROWTH_END - STEM_GROWTH_START) / NUM_STEM_SEGMENTS;

        // Shared helper: attach one leaf to any pivot (central stem or a
        // branch segment) at a given local height, keeping every leaf's
        // size the same (per the reference sketch) and wiring it into the
        // same staggered reveal system as everything else.
        const spawnLeaf = (parentPivot: any, heightAlongPivot: number, side: 1 | -1, startThreshold: number) => {
          const leafMat = new THREE.MeshStandardMaterial({
            map: leafTexture,
            color: LEAF_COLORS[Math.floor(rand() * LEAF_COLORS.length)],
            side: THREE.DoubleSide,
            transparent: true,
            alphaTest: 0.4,
            flatShading: false,
            roughness: 0.55,
          });
          const leafMesh = new THREE.Mesh(leafGeo, leafMat);
          leafMesh.position.set(0, heightAlongPivot, 0);
          const baseRotZ = side * (1.0 + (rand() - 0.5) * 0.25);
          const baseRotY = (rand() - 0.5) * 0.5;
          leafMesh.rotation.z = baseRotZ;
          leafMesh.rotation.y = baseRotY;
          leafMesh.scale.setScalar(0.001);
          (leafMesh as any)._targetSize = LEAF_UNIFORM_SIZE + (rand() - 0.5) * 0.08;
          leafMesh.visible = false;
          leafMesh.receiveShadow = true;
          parentPivot.add(leafMesh);
          leaves.push({
            mesh: leafMesh,
            startThreshold,
            stagger: rand() * 0.4,
            baseRotZ,
            baseRotY,
            phase: rand() * Math.PI * 2,
          });
        };

        // Shared helper: build one wood segment (used for both the
        // central stem and every branch) with the bark texture, smooth
        // shading and shadows already wired up.
        const makeWoodMesh = (radiusTop: number, radiusBottom: number, length: number) => {
          const geo = new THREE.CylinderGeometry(radiusTop, radiusBottom, length, 8, 1);
          geo.translate(0, length / 2, 0);
          const mat = new THREE.MeshStandardMaterial({ map: barkTexture, flatShading: false, roughness: 0.9 });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          return mesh;
        };

        let parentAnchor = treeRoot;
        stemPlan.forEach((seg, i) => {
          const pivot = new THREE.Group();
          if (i === 0) {
            pivot.position.set(0, 0.2, 0);
            pivot.rotation.x = 0.06;
          } else {
            pivot.rotation.z = seg.tiltZ;
            pivot.rotation.x = seg.tiltX;
          }
          pivot.visible = false;
          pivot.scale.set(1, 0.001, 1);
          parentAnchor.add(pivot);

          const mesh = makeWoodMesh(seg.radius * 0.7, seg.radius, seg.length);
          pivot.add(mesh);

          const tip = new THREE.Group();
          tip.position.set(0, seg.length, 0);
          pivot.add(tip);

          const start = STEM_GROWTH_START + i * segRange;
          const end = start + segRange;
          stemPivots.push({ pivot, start, end });

          // A sparse leaf directly on the central stem (matches the
          // occasional standalone leaves in the reference sketch).
          if (i >= 1) {
            spawnLeaf(pivot, seg.length * 0.82, i % 2 === 0 ? 1 : -1, end);
          }

          // From partway up, every remaining stem segment also grows a
          // full branch out to the side — several segments long, each
          // carrying its own leaves — so branches keep appearing and
          // filling in the background the further the visitor scrolls.
          if (i >= BRANCH_START_INDEX) {
            const branchSide: 1 | -1 = i % 2 === 0 ? 1 : -1;
            const branchPlan = buildBranchPlan(rand, seg.radius, branchSide);
            const branchSpan = Math.max(0.06, (1 - end) * 0.85);
            const branchSegRange = branchSpan / BRANCH_SEGMENTS;
            let branchAnchor = tip;

            branchPlan.forEach((bseg, j) => {
              const bpivot = new THREE.Group();
              bpivot.rotation.z = bseg.tiltZ;
              bpivot.rotation.x = bseg.tiltX;
              bpivot.visible = false;
              bpivot.scale.set(1, 0.001, 1);
              branchAnchor.add(bpivot);

              const bmesh = makeWoodMesh(bseg.radius * 0.7, bseg.radius, bseg.length);
              bpivot.add(bmesh);

              const btip = new THREE.Group();
              btip.position.set(0, bseg.length, 0);
              bpivot.add(btip);

              const bstart = end + j * branchSegRange;
              const bend = bstart + branchSegRange;
              stemPivots.push({ pivot: bpivot, start: bstart, end: bend });

              for (let k = 0; k < BRANCH_LEAVES_PER_SEGMENT; k++) {
                spawnLeaf(bpivot, bseg.length * (0.5 + rand() * 0.4), k === 0 ? 1 : -1, bend);
              }

              branchAnchor = btip;
            });
          }

          parentAnchor = tip;
        });

        computeTargets();

        const clock = new THREE.Clock();
        const animate = () => {
          if (disposed) return;
          const t = clock.getElapsedTime();

          // Smooth (lerp) growth + opacity toward their targets so scroll
          // jumps don't pop the plant instantly.
          growth += (targetGrowth - growth) * 0.14;
          opacity += (targetOpacity - opacity) * 0.1;

          stemPivots.forEach(({ pivot, start, end }) => {
            const local = smoothstep(start, end, growth);
            pivot.visible = local > 0.001;
            pivot.scale.set(1, Math.max(0.001, local), 1);
          });

          // Each leaf only starts revealing once its host segment has
          // grown past its attachment point, then eases in on its own
          // staggered schedule — so branches and leaves keep appearing
          // one at a time as the visitor keeps scrolling, rather than
          // everything popping in together.
          leaves.forEach(({ mesh, startThreshold, stagger, baseRotZ, baseRotY, phase }) => {
            const revealWindow = 1 - startThreshold;
            const local = revealWindow > 0 ? (growth - startThreshold) / revealWindow : 0;
            const staggered = smoothstep(0, 1, Math.min(1, local * 1.6 - stagger));
            mesh.visible = staggered > 0.01;
            mesh.scale.setScalar(Math.max(0.001, staggered * (mesh._targetSize || 1)));
            // Subtle independent flutter once a leaf has (mostly) grown in
            // — small enough to read as a light breeze, not a wobble.
            const flutter = 0.05 * staggered;
            mesh.rotation.z = baseRotZ + Math.sin(t * 1.3 + phase) * flutter;
            mesh.rotation.y = baseRotY + Math.sin(t * 0.9 + phase * 1.7) * flutter * 0.6;
          });

          // Gentle idle sway once mostly grown
          const sway = Math.sin(t * 0.6) * 0.02 * smoothstep(0.3, 0.6, growth);
          treeRoot.rotation.z = sway;
          treeRoot.rotation.y = Math.sin(t * 0.25) * 0.015 * smoothstep(0.3, 0.6, growth);

          rootEl.style.opacity = String(opacity);
          renderer.render(scene, camera);
          frameId = requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        resizeObserver = new ResizeObserver(() => onResize());
        resizeObserver.observe(document.documentElement);
      } catch (err) {
        // Progressive enhancement only — page works fine without it.
        console.warn('[SeedTreeBackground] three.js unavailable:', err);
      }
    })();

    return () => {
      disposed = true;
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (resizeObserver) resizeObserver.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      if (renderer) renderer.dispose();
    };
  }, [zoneRef]);

  return (
    <div
      ref={rootStyleRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.2s linear',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
