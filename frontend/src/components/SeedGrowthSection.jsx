import { useEffect, useRef } from 'react';
import seedGrowthVideo from '../assets/seed-growth.mp4';
import seedGrowthPoster from '../assets/seed-growth-poster.jpg';

/* ─────────────────────────────────────────────────────────────
   SeedGrowthSection — a real macro timelapse video, filling the
   FULL WIDTH of the page as a pinned background, with the seed/
   seedling subject sitting naturally center-frame where everyone
   sees it. The existing dashboard content (AI Crop Advisory,
   Treatment Finder, Weather & Disease Risk, "Get answers in
   seconds") scrolls in two columns directly on top of that
   background, left and right of the growing plant.

   The video's own `currentTime` is driven by scroll position
   (GSAP ScrollTrigger `scrub`) across a fixed, short scroll
   distance (~2.5 screens — "2-3 scrolls") so the seed is a fully
   grown plant well before the flanking content finishes scrolling
   past; scrolling back up scrubs the footage backwards for free.

   The background itself is pinned with GSAP ScrollTrigger's
   `pin` (the standard technique for "fixed background, scrolling
   foreground") rather than CSS position:sticky, because sticky
   breaks the moment any ancestor clips overflow — pin doesn't.

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

// How many "screens" of scrolling the seed takes to become a full plant.
const GROWTH_SCREENS = 2.6;

// Scroll-progress bands driving the text label (the footage itself is one
// continuous real clip, scrubbed directly by progress).
const STAGE_LABELS = [
  { end: 0.28, label: 'Seed' },
  { end: 0.55, label: 'Sprout' },
  { end: 0.8, label: 'Seedling' },
  { end: 1, label: 'Young Plant' },
];

export default function SeedGrowthSection({ leftContent, rightContent }) {
  const sectionRef = useRef(null);
  const bgRef = useRef(null);
  const videoRef = useRef(null);
  const labelRef = useRef(null);
  const progressFillRef = useRef(null);
  const tintRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = window.matchMedia('(min-width: 981px)').matches;

    if (prefersReduced) {
      if (video) {
        const showFinalFrame = () => {
          try { video.currentTime = Math.max(0, video.duration - 0.3); } catch { /* ignore */ }
        };
        if (video.readyState >= 1) showFinalFrame();
        else video.addEventListener('loadedmetadata', showFinalFrame, { once: true });
      }
      if (labelRef.current) labelRef.current.textContent = STAGE_LABELS[STAGE_LABELS.length - 1].label;
      return undefined;
    }

    if (!isDesktop) {
      // Mobile: skip pin + scroll-scrub entirely (perf + avoids mobile
      // browser address-bar/viewport-height jank). Just let the real
      // footage play on its own, looping gently.
      if (video) {
        video.loop = true;
        video.autoplay = true;
        video.play?.().catch(() => {});
      }
      if (labelRef.current) labelRef.current.textContent = STAGE_LABELS[STAGE_LABELS.length - 1].label;
      return undefined;
    }

    let cancelled = false;
    let ctx;
    let scrollTriggerInstance;

    loadGsap().then(({ gsap, ScrollTrigger }) => {
      if (cancelled || !sectionRef.current || !bgRef.current || !video) return;

      const bindScrub = () => {
        if (cancelled) return;
        const duration = video.duration || 0;
        if (!duration) return;

        ctx = gsap.context(() => {
          scrollTriggerInstance = ScrollTrigger.create({
            trigger: bgRef.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * GROWTH_SCREENS}`,
            pin: true,
            pinSpacing: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const progress = self.progress;

              if (video.readyState >= 2) {
                const targetTime = Math.min(duration - 0.02, Math.max(0, progress * duration));
                if (Math.abs(video.currentTime - targetTime) > 0.02) {
                  video.currentTime = targetTime;
                }
              }

              if (progressFillRef.current) {
                progressFillRef.current.style.height = `${progress * 100}%`;
              }
              const band = STAGE_LABELS.find((b) => progress <= b.end) || STAGE_LABELS[STAGE_LABELS.length - 1];
              if (labelRef.current) labelRef.current.textContent = band.label;
              if (tintRef.current) tintRef.current.style.opacity = String(0.22 - progress * 0.1);
            },
          });
        }, sectionRef);
      };

      if (video.readyState >= 1 && video.duration) {
        bindScrub();
      } else {
        video.addEventListener('loadedmetadata', bindScrub, { once: true });
      }
    }).catch((err) => {
      console.warn('[SeedGrowthSection] GSAP unavailable, showing static frame:', err);
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
      aria-label="From seed to harvest, alongside AI crop advisory, treatment, and weather tools"
      style={{ position: 'relative', width: '100%' }}
    >
      <style>{`
        .seed-pin-bg { position: relative; width: 100%; height: 100vh; overflow: hidden; background-color: #04140b; }
        .seed-bg-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
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
        <video
            ref={videoRef}
            src={seedGrowthVideo}
            poster={seedGrowthPoster}
            muted
            playsInline
            preload="auto"
            aria-hidden="true"
            className="seed-bg-video"
            style={{ filter: 'saturate(1.15) brightness(1.05) contrast(1.05)' }}
          />

          {/* Green wash so the real footage reads as this site's own palette */}
          <div
            ref={tintRef}
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.22,
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
