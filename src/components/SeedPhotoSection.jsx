import { useEffect, useRef } from 'react';
import seedStage1 from '../assets/seed-stages/seed-stage-1.jpg';
import seedStage2 from '../assets/seed-stages/seed-stage-2.jpg';
import seedStage3 from '../assets/seed-stages/seed-stage-3.jpg';
import seedStage4 from '../assets/seed-stages/seed-stage-4.jpg';
import seedStage5 from '../assets/seed-stages/seed-stage-5.jpg';

/* ─────────────────────────────────────────────────────────────
   SeedPhotoSection — real macro photographs of a seed becoming a
   plant (not a video, not an illustration), pinned FULL WIDTH as
   a background with the seed sitting center-frame, while the
   existing dashboard content (AI Crop Advisory, Treatment Finder,
   Weather & Disease Risk, "Get answers in seconds") scrolls in two
   columns directly on top of it, left and right of the photo.

   As the visitor scrolls through this section, the CENTER PHOTO
   ITSELF CHANGES — crossfading from one real growth-stage photo to
   the next (seed → early sprout → rooting sprout → budding shoot →
   young leafy plant) — rather than playing continuous footage.
   Scroll position drives which two photos are blended and by how
   much, so scrolling back up reverses the crossfade for free.

   The section is pinned with GSAP ScrollTrigger's `pin` (the
   standard technique for "fixed background, scrolling foreground")
   rather than CSS position:sticky, because sticky breaks the
   moment any ancestor clips overflow — pin doesn't.

   GSAP + ScrollTrigger load from a CDN at runtime (both are free,
   including ScrollTrigger) — no npm install needed, same pattern
   already used for three.js in FarmBackdrop.jsx.
───────────────────────────────────────────────────────────────── */

const GSAP_CORE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
const SCROLLTRIGGER_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';

let gsapLoadPromise = null;
function loadGsap() {
  if (gsapLoadPromise) return gsapLoadPromise;
  gsapLoadPromise = new Promise((resolve, reject) => {
    if (window.gsap && window.ScrollTrigger) {
      resolve({ gsap: window.gsap, ScrollTrigger: window.ScrollTrigger });
      return;
    }
    const loadScript = (src) => new Promise((res, rej) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) {
        if (existing.getAttribute('data-loaded') === 'true') { res(); return; }
        existing.addEventListener('load', () => res());
        existing.addEventListener('error', rej);
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => { s.setAttribute('data-loaded', 'true'); res(); };
      s.onerror = rej;
      document.head.appendChild(s);
    });

    loadScript(GSAP_CORE_CDN)
      .then(() => loadScript(SCROLLTRIGGER_CDN))
      .then(() => {
        const { gsap, ScrollTrigger } = window;
        gsap.registerPlugin(ScrollTrigger);
        resolve({ gsap, ScrollTrigger });
      })
      .catch(reject);
  });
  return gsapLoadPromise;
}

// Real photos, in growth order — the actual images that crossfade as the
// visitor scrolls (see the big comment above).
const STAGES = [
  { src: seedStage1, label: 'Seed' },
  { src: seedStage2, label: 'Sprouting' },
  { src: seedStage3, label: 'Rooting' },
  { src: seedStage4, label: 'Budding Shoot' },
  { src: seedStage5, label: 'Young Plant' },
];

// How many "screens" of scrolling it takes to get through every photo.
const GROWTH_SCREENS = 2.6;

export default function SeedPhotoSection({ leftContent, rightContent }) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const labelRef = useRef(null);
  const progressFillRef = useRef(null);
  const imgRefs = useRef([]);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 981px)').matches;

    const setStageOpacities = (progress) => {
      const n = STAGES.length;
      const pos = Math.min(n - 1, Math.max(0, progress * (n - 1)));
      const i0 = Math.floor(pos);
      const frac = pos - i0;
      imgRefs.current.forEach((el, i) => {
        if (!el) return;
        let opacity = 0;
        if (i === i0) opacity = 1 - frac;
        else if (i === i0 + 1) opacity = frac;
        el.style.opacity = String(opacity);
      });
      const labelIndex = frac < 0.5 ? i0 : Math.min(n - 1, i0 + 1);
      if (labelRef.current) labelRef.current.textContent = STAGES[labelIndex].label;
      if (progressFillRef.current) progressFillRef.current.style.height = `${progress * 100}%`;
    };

    if (prefersReduced || !isDesktop) {
      // Reduced motion / mobile: skip the scroll-scrub entirely (perf +
      // avoids mobile browser address-bar/viewport-height jank) and just
      // show the final, fully-grown photo.
      setStageOpacities(1);
      return undefined;
    }

    let cancelled = false;
    let ctx;
    let scrollTriggerInstance;

    setStageOpacities(0);

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !sectionRef.current || !bgRef.current) return;

      ctx = gsap.context(() => {
        scrollTriggerInstance = ScrollTrigger.create({
          trigger: bgRef.current,
          start: 'top top',
          end: () => `+=${window.innerHeight * GROWTH_SCREENS}`,
          pin: true,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (self) => setStageOpacities(self.progress),
        });
      }, sectionRef);
    }).catch((err) => {
      console.warn('[SeedPhotoSection] GSAP unavailable, showing final photo:', err);
      setStageOpacities(1);
    });

    return () => {
      cancelled = true;
      scrollTriggerInstance?.kill();
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      aria-label="Real photos of a seed growing into a plant, alongside AI crop advisory, treatment, and weather tools"
      style={{ position: 'relative', width: '100%' }}
    >
      <style>{`
        .seed-pin-bg { position: relative; width: 100%; height: 100vh; overflow: hidden; background-color: #04140b; }
        .seed-bg-photo { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 0.05s linear; }
        .seed-content-shell { position: relative; margin-top: -100vh; z-index: 2; pointer-events: none; }
        .seed-flank-grid {
          display: grid; grid-template-columns: 1fr minmax(260px, 380px) 1fr;
          gap: clamp(24px, 4vw, 40px); align-items: start;
          max-width: 1300px; margin: 0 auto; padding: 0 clamp(20px, 5vw, 48px);
        }
        .seed-flank-col {
          pointer-events: auto; display: flex; flex-direction: column; gap: clamp(24px, 4vw, 32px);
          background: rgba(5, 22, 13, 0.5); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          border-radius: 20px; padding: clamp(16px, 2.4vw, 26px);
        }
        .seed-flank-spacer { min-height: 40vh; }
        .seed-hud {
          position: absolute; left: 0; right: 0; bottom: clamp(24px, 5vh, 56px);
          display: flex; justify-content: center; pointer-events: none; z-index: 1;
        }
        @media (max-width: 980px) {
          .seed-pin-bg { position: relative; height: 56vh; border-radius: 20px; overflow: hidden; margin: 0 clamp(16px, 4vw, 24px); }
          .seed-content-shell { margin-top: 16px; }
          .seed-flank-grid { grid-template-columns: 1fr; padding: 0 clamp(16px, 4vw, 24px); }
          .seed-flank-spacer { display: none; }
          .seed-flank-col { background: transparent; backdrop-filter: none; padding: 0; }
          .seed-hud { bottom: 14px; }
        }
      `}</style>

      <div ref={bgRef} className="seed-pin-bg">
        {STAGES.map((stage, i) => (
          <img
            key={stage.src}
            ref={(el) => { imgRefs.current[i] = el; }}
            src={stage.src}
            alt={i === STAGES.length - 1 ? 'A young plant grown from seed' : ''}
            aria-hidden={i === STAGES.length - 1 ? undefined : true}
            className="seed-bg-photo"
            style={{ opacity: 0, filter: 'saturate(1.1) brightness(1.02) contrast(1.03)' }}
          />
        ))}

        {/* Green wash so the real photos read as this site's own palette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.16,
            background: 'linear-gradient(160deg, rgba(6,32,18,0.55) 0%, rgba(6,32,18,0.1) 45%, rgba(6,32,18,0.4) 100%)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Edge vignette so flanking text panels always read clearly */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(2,10,6,0.75) 0%, rgba(2,10,6,0.15) 26%, transparent 50%, rgba(2,10,6,0.15) 74%, rgba(2,10,6,0.75) 100%)',
          }}
        />

        {/* Growth-stage HUD: label chip + vertical progress rail */}
        <div className="seed-hud">
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            fontSize: '12px', fontWeight: 700, color: '#dcfce7',
            backgroundColor: 'rgba(21,128,61,0.4)', border: '1px solid rgba(74,222,128,0.45)',
            padding: '6px 16px', borderRadius: '100px', letterSpacing: '0.3px',
            backdropFilter: 'blur(6px)',
          }}>
            <span aria-hidden="true" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' }} />
            <span ref={labelRef}>Seed</span>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            position: 'absolute', top: '20px', right: '20px', width: '3px', height: 'calc(100% - 40px)',
            borderRadius: '100px', backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden',
          }}
        >
          <div ref={progressFillRef} style={{
            position: 'absolute', bottom: 0, left: 0, width: '100%', height: '0%',
            background: 'linear-gradient(180deg, #4ade80, #16a34a)', borderRadius: '100px',
          }} />
        </div>
      </div>

      <div className="seed-content-shell">
        <div className="seed-flank-grid">
          <div className="seed-flank-col">{leftContent}</div>
          <div className="seed-flank-spacer" aria-hidden="true" />
          <div className="seed-flank-col">{rightContent}</div>
        </div>
        <p style={{
          textAlign: 'center', fontSize: '12px', color: '#9ca3af', margin: '20px 0 0',
          letterSpacing: '0.3px', position: 'relative', zIndex: 2,
        }}>
          From seed to harvest — scroll to watch it grow
        </p>
      </div>
    </section>
  );
}
