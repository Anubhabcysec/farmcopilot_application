import { useEffect, useRef, useState } from 'react';
import heroSmartFarm from '../assets/hero-smart-farm.jpg';

/* Real farm photography cycled behind the homepage hero only (it's an
   absolutely-positioned layer, scoped to whatever `position: relative`
   wrapper renders it — see Home.jsx). It's aria-hidden and
   pointer-events:none, so it never sits above or intercepts clicks on
   any button, link, or text.
   First image is the user-supplied smart-farm photo (solar, wind,
   greenhouse, weather station at sunset); the rest are supporting
   royalty-free farm photography for variety in the slow cross-fade. */
const FARM_IMAGES = [
  heroSmartFarm,
  'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1920&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1633410195091-bd66114cef5f?q=80&w=1920&auto=format&fit=crop',
];

const THREE_CDN = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

export default function FarmBackdrop() {
  const [activeIndex, setActiveIndex] = useState(0);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Slowly cross-fade between real farm photos
  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % FARM_IMAGES.length);
    }, 9000);
    return () => clearInterval(id);
  }, []);

  // three.js ambient layer: soft drifting green motes for a subtle 3D
  // depth effect over the photography. Loaded from a CDN at runtime so
  // no build/install step is required. Fails silently if it can't load
  // (e.g. offline) — the photo background still works on its own.
  useEffect(() => {
    let renderer, scene, camera, particles, frameId;
    let disposed = false;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return undefined;

    let resizeObserver;

    const getSize = () => ({
      w: container.clientWidth || window.innerWidth,
      h: container.clientHeight || window.innerHeight,
    });

    (async () => {
      try {
        const THREE = await import(/* @vite-ignore */ THREE_CDN);
        if (disposed) return;

        const { w, h } = getSize();

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
        camera.position.z = 12;

        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(w, h);

        const COUNT = 200;
        const positions = new Float32Array(COUNT * 3);
        const speeds = new Float32Array(COUNT);
        for (let i = 0; i < COUNT; i++) {
          positions[i * 3] = (Math.random() - 0.5) * 26;
          positions[i * 3 + 1] = (Math.random() - 0.5) * 16;
          positions[i * 3 + 2] = (Math.random() - 0.5) * 14;
          speeds[i] = 0.15 + Math.random() * 0.35;
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
          size: 0.08,
          color: new THREE.Color(0x8fe3a0),
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        });

        particles = new THREE.Points(geometry, material);
        scene.add(particles);

        const clock = new THREE.Clock();
        const animate = () => {
          if (disposed) return;
          const t = clock.getElapsedTime();
          const pos = geometry.attributes.position.array;
          for (let i = 0; i < COUNT; i++) {
            pos[i * 3 + 1] += speeds[i] * 0.01;
            if (pos[i * 3 + 1] > 8) pos[i * 3 + 1] = -8;
            pos[i * 3] += Math.sin(t * 0.4 + i) * 0.0015;
          }
          geometry.attributes.position.needsUpdate = true;
          particles.rotation.y = t * 0.015;
          renderer.render(scene, camera);
          frameId = requestAnimationFrame(animate);
        };
        animate();

        // Track the container's own size (it's no longer full-viewport —
        // it's just the hero section), not the window's.
        resizeObserver = new ResizeObserver(() => {
          if (!renderer || !camera) return;
          const { w: nw, h: nh } = getSize();
          camera.aspect = nw / nh;
          camera.updateProjectionMatrix();
          renderer.setSize(nw, nh);
        });
        resizeObserver.observe(container);
      } catch (err) {
        // Ambient 3D layer is a progressive enhancement — never block the page.
        console.warn('[FarmBackdrop] three.js ambient layer unavailable:', err);
      }
    })();

    return () => {
      disposed = true;
      if (resizeObserver) resizeObserver.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
      if (renderer) renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* Layer 1 — real farm photography, cross-fading with a slow Ken Burns
          pan. Only the currently-active slide's pan/zoom animation actually
          runs (animationPlayState 'paused' on the rest) — with all four
          full-screen, filtered images animating at once, the browser was
          fighting to composite three invisible layers on every frame,
          which is exactly what made the visible crossfade look laggy.
          Pausing the hidden ones frees that budget for a smooth fade. */}
      {FARM_IMAGES.map((src, i) => (
        <div
          key={src}
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(1.35) saturate(1.25) contrast(1.05)',
            opacity: i === activeIndex ? 1 : 0,
            transition: 'opacity 3s ease-in-out',
            animation: 'farmKenBurns 26s ease-in-out infinite alternate',
            animationPlayState: i === activeIndex ? 'running' : 'paused',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Layer 2 — three.js ambient particle field (subtle 3D depth) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          mixBlendMode: 'screen',
          opacity: 0.6,
        }}
      />

      {/* Layer 3 — greenish agricultural tint + vignette so text/buttons stay legible */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse 90% 60% at 50% -10%, rgba(34,197,94,0.14) 0%, transparent 55%),
            linear-gradient(180deg, rgba(3,10,6,0.62) 0%, rgba(4,13,9,0.42) 35%, rgba(3,11,7,0.4) 65%, rgba(2,8,5,0.72) 100%)
          `,
        }}
      />
    </div>
  );
}
