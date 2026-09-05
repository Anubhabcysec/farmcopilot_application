import { useEffect, useRef } from 'react';

/* ScrollGrowthPlant — a single procedurally-drawn seedling (thin stem +
   roots + 4 leaves, built entirely from SVG paths) that continuously grows
   as the visitor scrolls through the surrounding "growth zone" (see
   Home.jsx, where this sits in the CENTER grid column between the left
   feature copy and the right interactive dashboards).

   This is deliberately NOT an image sequence / slideshow. There is exactly
   one plant on screen at all times; scroll position drives:
     - the stem's length, via stroke-dasharray/stroke-dashoffset on a single
       <path> (the classic SVG "line draw" technique) — so the stem
       continuously elongates rather than jumping between states,
     - each leaf's unfold, via a per-leaf scale/rotate/opacity ramp over its
       own slice of the scroll range, eased so it settles softly into place
       instead of snapping,
     - the root system's fade-in near the very start of the scroll range.
   Scrolling back up runs every one of those continuously in reverse — there
   is no discrete "frame" to snap back to.

   Scroll → growth mapping mirrors the rest of this codebase's scroll-driven
   components: `zoneRef` points at the outer 3-column grid wrapper, whose
   height is set entirely by the left/right feature content (this component
   adds ZERO extra scroll distance of its own). On scroll/resize we read the
   wrapper's current getBoundingClientRect() and compute a raw 0..1 progress
   purely as a function of current scroll position, then a
   requestAnimationFrame loop lerps a smoothed value toward that target
   every frame — no jumps/flicker from fast or jittery scrolling. That loop
   only runs while the zone actually intersects the viewport
   (IntersectionObserver), so it costs nothing on the rest of the page, and
   growth is applied by writing SVG attributes/styles directly via refs —
   no React state, so scrolling never triggers a re-render.

   This is a purely visual, `pointer-events: none`, non-focusable,
   aria-hidden layer that lives inside its own grid cell — never an
   absolute/fixed overlay spanning the page — so it can never block a
   click, hover, or keyboard interaction on the surrounding dashboards. */

// Fraction of overall scroll progress (0..1) at which the stem finishes
// elongating — the remaining tail of the scroll range is spent purely on
// the last leaf unfolding, so growth doesn't all finish at once.
const STEM_FINISH = 0.85;

// Each leaf: `frac` is where along the stem's path length (0..1) it
// attaches; `range` is the [start, end] of overall scroll progress over
// which it unfolds; `side` mirrors it left/right for a natural alternating
// look.
const LEAVES = [
  { frac: 0.3, range: [0.26, 0.4], side: 1 },
  { frac: 0.5, range: [0.46, 0.6], side: -1 },
  { frac: 0.7, range: [0.66, 0.8], side: 1 },
  { frac: 0.88, range: [0.84, 1.0], side: -1 },
];

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export default function ScrollGrowthPlant({ zoneRef }) {
  const stemRef = useRef(null);
  const rootsRef = useRef(null);
  const leafOuterRefs = useRef([]);
  const leafInnerRefs = useRef([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 901px)').matches;

    const stemEl = stemRef.current;
    const rootsEl = rootsRef.current;
    const totalLen = stemEl ? stemEl.getTotalLength() : 0;

    // One-time setup: prime the stem's dash technique and plant each leaf
    // at a fixed point along the stem (computed once from the actual
    // rendered path — never hardcoded pixel coordinates), then leave their
    // positions untouched for the rest of the component's life. Only each
    // leaf's *inner* group (scale/rotate/opacity) changes per frame.
    if (stemEl && totalLen) {
      stemEl.style.strokeDasharray = String(totalLen);
      stemEl.style.strokeDashoffset = String(totalLen);

      LEAVES.forEach((leaf, i) => {
        const outer = leafOuterRefs.current[i];
        if (!outer) return;
        const pt = stemEl.getPointAtLength(Math.min(totalLen, leaf.frac * totalLen));
        const angle = leaf.side === 1 ? -25 : 205;
        outer.setAttribute('transform', `translate(${pt.x.toFixed(2)},${pt.y.toFixed(2)}) rotate(${angle})`);
      });
    }

    const applyProgress = (p) => {
      if (stemEl && totalLen) {
        const stemT = Math.min(1, p / STEM_FINISH);
        stemEl.style.strokeDashoffset = String(totalLen * (1 - stemT));
      }
      if (rootsEl) {
        rootsEl.style.opacity = String(Math.min(1, p / 0.15));
      }
      LEAVES.forEach((leaf, i) => {
        const inner = leafInnerRefs.current[i];
        if (!inner) return;
        const [start, end] = leaf.range;
        const raw = Math.min(1, Math.max(0, (p - start) / (end - start)));
        const t = easeOutCubic(raw);
        // Unfurl: rotates in from a folded angle while scaling up from the
        // stem attachment point — never a hard cut between "closed"/"open".
        inner.setAttribute('transform', `rotate(${(1 - t) * -30}) scale(${t})`);
        inner.style.opacity = String(t);
      });
    };

    if (prefersReduced || !isDesktop) {
      // Reduced motion / small screens: render the finished young plant,
      // fully grown, with no animation loop.
      applyProgress(1);
      return undefined;
    }

    const hasIO = 'IntersectionObserver' in window;
    let rafId = null;
    let smoothed = 0;
    let target = 0;
    let disposed = false;
    // Without IntersectionObserver support, fall back to always running.
    // With it, start conservatively "not in view" — the observer's first
    // callback (fired synchronously off `observe()`) supplies the real
    // answer immediately, so this never actually delays anything visible;
    // it just avoids assuming visibility on a component that, on a real
    // page load, mounts while still below the fold.
    let inView = !hasIO;

    const computeTarget = () => {
      const zoneEl = zoneRef?.current;
      if (!zoneEl) return;
      const rect = zoneEl.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      let raw;
      if (total <= 0) {
        raw = rect.top < vh / 2 ? 1 : 0;
      } else {
        raw = -rect.top / total;
      }
      target = Math.min(1, Math.max(0, raw));
    };

    const tick = () => {
      if (disposed) return;
      smoothed += (target - smoothed) * 0.12;
      if (Math.abs(target - smoothed) < 0.0004) smoothed = target;
      applyProgress(smoothed);
      rafId = inView ? requestAnimationFrame(tick) : null;
    };

    const ensureLoop = () => {
      if (inView && rafId === null && !disposed) rafId = requestAnimationFrame(tick);
    };

    computeTarget();
    applyProgress(0);
    ensureLoop();

    const onScroll = () => computeTarget();
    const onResize = () => computeTarget();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Only spend rAF/scroll-math cycles while the growth zone is actually
    // on screen — well outside it, growth is pinned at whichever end it
    // last reached, and nothing runs.
    let observer;
    if (zoneRef?.current && hasIO) {
      observer = new IntersectionObserver(
        ([entry]) => {
          inView = entry.isIntersecting;
          if (inView) ensureLoop();
        },
        { rootMargin: '200px 0px' },
      );
      observer.observe(zoneRef.current);
    }

    return () => {
      disposed = true;
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer?.disconnect();
    };
  }, [zoneRef]);

  return (
    <div
      aria-hidden="true"
      className="growth-plant-sticky"
      style={{ pointerEvents: 'none' }}
    >
      <svg
        viewBox="0 0 200 420"
        style={{
          width: '100%',
          maxWidth: '160px',
          height: 'auto',
          aspectRatio: '200 / 420',
          display: 'block',
          margin: '0 auto',
        }}
      >
        <defs>
          <linearGradient id="growthStemGrad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#3f6b2b" />
            <stop offset="100%" stopColor="#74b84c" />
          </linearGradient>
          <radialGradient id="growthSoilGrad" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#5a4632" />
            <stop offset="100%" stopColor="#33281c" />
          </radialGradient>
        </defs>

        {/* Soil — a small, always-present grounding cue; the seed/roots
            live in it before anything is visible above it. */}
        <ellipse cx="100" cy="387" rx="32" ry="7.5" fill="url(#growthSoilGrad)" />

        {/* Roots — fade in over the first 15% of scroll progress, just
            ahead of the stem starting to rise. */}
        <g ref={rootsRef} style={{ opacity: 0 }}>
          <path d="M100,383 C 93,395 84,399 74,405" stroke="#5c4a34" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M100,383 C 100,393 100,401 100,408" stroke="#5c4a34" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M100,383 C 107,395 116,399 126,405" stroke="#5c4a34" strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>

        {/* Stem — one continuous path; stroke-dasharray/dashoffset reveal
            it progressively from the base upward as scroll progress
            increases (and retract it just as smoothly on scroll-up). A
            gentle natural curve, not a rigid straight line. */}
        <path
          ref={stemRef}
          d="M100,385 C 92,330 108,292 96,252 C 88,214 104,186 98,148 C 92,110 100,80 100,40"
          stroke="url(#growthStemGrad)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* Leaves — each one a small outer group fixed once to its point
            on the stem, with an inner group that scales/rotates/fades in
            over its own slice of scroll progress (the actual "unfold"). */}
        {LEAVES.map((leaf, i) => (
          <g key={i} ref={(el) => { leafOuterRefs.current[i] = el; }}>
            <g ref={(el) => { leafInnerRefs.current[i] = el; }} style={{ opacity: 0 }}>
              <path
                d="M0,0 C 4,-5 14,-7 23,-2 C 25,-1 25,1 23,2 C 14,7 4,5 0,0 Z"
                fill={i % 2 === 0 ? '#5c9c3e' : '#6cae4a'}
                transform={`scale(${0.85 + i * 0.08})`}
              />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
