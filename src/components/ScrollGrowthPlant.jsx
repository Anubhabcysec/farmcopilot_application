import { useEffect, useRef } from 'react';

/* ScrollGrowthPlant — a real-photo gallery of varied agricultural subjects
   (different crops, seeds and farmland — not one plant's growth story)
   that crossfades from one photo to the next as the visitor scrolls
   through the surrounding "growth zone" (see Home.jsx, where this sits in
   the CENTER grid column between the left feature copy and the right
   interactive dashboards).

   Scroll → photo mapping:
   - `zoneRef` points at the outer 3-column grid wrapper. That wrapper's
     height is set entirely by however tall the left/right feature content
     already is — this component adds ZERO extra scroll distance of its
     own, and it never autoplays independently of scroll.
   - On scroll/resize we read the wrapper's current getBoundingClientRect()
     and compute a raw 0..1 progress purely as a function of the current
     scroll position (no timeline, no step re-triggering) — so scrolling
     back up smoothly reverses the sequence for free.
   - A requestAnimationFrame loop lerps the raw value toward a smoothed
     one every frame, which is what actually drives the crossfade — this
     removes jumps/flicker from fast or jittery scrolling. That loop only
     runs while the zone is actually intersecting the viewport
     (IntersectionObserver), so it costs nothing on the rest of the page.

   This is a purely visual, `pointer-events: none`, non-focusable,
   aria-hidden layer that lives inside its own grid cell — never an
   absolute/fixed overlay spanning the page — so it can never block a
   click, hover, or keyboard interaction on the surrounding dashboards. */

const PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1437252611977-07f74518abd7?q=80&w=1200&auto=format&fit=crop',
    label: 'Golden Wheat Fields',
  },
  {
    src: 'https://images.unsplash.com/photo-1561504935-4e7d4516a2d1?q=80&w=1200&auto=format&fit=crop',
    label: 'Rice Paddy Terraces',
  },
  {
    src: 'https://images.unsplash.com/photo-1594622112599-34833f681545?q=80&w=1200&auto=format&fit=crop',
    label: 'Seeds Ready to Sow',
  },
  {
    src: 'https://images.unsplash.com/photo-1533720335246-5d4e8d662010?q=80&w=1200&auto=format&fit=crop',
    label: 'Corn in Season',
  },
  {
    src: 'https://images.unsplash.com/photo-1683009118720-8424c9dd58e8?q=80&w=1200&auto=format&fit=crop',
    label: 'Tomato Harvest',
  },
  {
    src: 'https://images.unsplash.com/photo-1607702699860-847f43700310?q=80&w=1200&auto=format&fit=crop',
    label: 'Sunflower Fields',
  },
];

export default function ScrollGrowthPlant({ zoneRef }) {
  const imgRefs = useRef([]);
  const labelRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 901px)').matches;

    const applyProgress = (p) => {
      const n = PHOTOS.length;
      const pos = Math.min(n - 1, Math.max(0, p * (n - 1)));
      const i0 = Math.floor(pos);
      const frac = pos - i0;
      imgRefs.current.forEach((el, i) => {
        if (!el) return;
        let opacity = 0;
        if (i === i0) opacity = 1 - frac;
        else if (i === i0 + 1) opacity = frac;
        el.style.opacity = String(opacity);
      });
      if (labelRef.current) {
        const labelIndex = frac < 0.5 ? i0 : Math.min(n - 1, i0 + 1);
        labelRef.current.textContent = PHOTOS[labelIndex].label;
      }
      if (cardRef.current) {
        const scale = 1 + p * 0.02;
        cardRef.current.style.transform = `scale(${scale})`;
      }
    };

    if (prefersReduced || !isDesktop) {
      applyProgress(0);
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
    // on screen — well outside it, the gallery is pinned at whichever end
    // it last reached, and nothing runs.
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
      <div
        ref={cardRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '4 / 5',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#111814',
          boxShadow: '0 18px 40px rgba(15,40,20,0.22)',
          willChange: 'transform',
        }}
      >
        {PHOTOS.map((photo, i) => (
          <img
            key={photo.src}
            ref={(el) => { imgRefs.current[i] = el; }}
            src={photo.src}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: i === 0 ? 1 : 0,
              willChange: 'opacity',
            }}
          />
        ))}

        {/* Soft edge vignette so the photo card reads as one cohesive,
            premium object rather than a flat cutout. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            boxShadow: 'inset 0 0 60px rgba(15,40,20,0.18)',
            pointerEvents: 'none',
          }}
        />

        {/* Caption chip */}
        <div style={{
          position: 'absolute', left: '14px', bottom: '14px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '11px', fontWeight: 700, color: '#dcfce7',
          backgroundColor: 'rgba(21,128,61,0.55)', border: '1px solid rgba(74,222,128,0.4)',
          padding: '5px 12px', borderRadius: '100px', letterSpacing: '0.3px',
          backdropFilter: 'blur(6px)',
        }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
          <span ref={labelRef}>Golden Wheat Fields</span>
        </div>
      </div>
    </div>
  );
}
