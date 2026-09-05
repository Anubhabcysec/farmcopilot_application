import React from 'react';
import wetLeafBg from '../assets/wet-leaf-bg.jpg';
import advisoryFieldBg from '../assets/advisory-field-bg.jpg';
import weatherSkyBg from '../assets/weather-sky-bg.jpg';
import ordersHarvestBg from '../assets/orders-harvest-bg.jpg';
import equipmentTractorBg from '../assets/equipment-tractor-bg.jpg';
import farmsAerialBg from '../assets/farms-aerial-bg.jpg';
import soilGroundBg from '../assets/soil-ground-bg.jpg';

/**
 * PageThemedBackdrop:
 * A rich, dynamic, themed ambient background for Farm Copilot pages.
 * Integrates:
 * 1. Animated floating ambient glow orbs matched to the page's theme palette
 * 2. Theme-specific crisp SVG agricultural doodle illustrations (e.g. weather clouds/sun/drops for Weather,
 *    field furrows/boundaries for Farms, tractors & tools for Equipment, chemistry/molecules & crops for Treatment)
 * 3. Subtle floating particles / motes for an alive, premium look
 * 4. 100% non-blocking (pointer-events: none) to guarantee zero interference with buttons, inputs, maps, and text readability.
 */
export default function PageThemedBackdrop({ theme = 'default' }) {
  // Theme styling configurations
  const themeConfigs = {
    weather: {
      accentColor: '#0284c7', // Sky blue
      strokeColor: '#0284c7',
      bgGradients: [
        'radial-gradient(circle at 18% 22%, rgba(56, 189, 248, 0.22) 0%, transparent 50%)',
        'radial-gradient(circle at 82% 18%, rgba(251, 191, 36, 0.20) 0%, transparent 45%)',
        'radial-gradient(circle at 50% 85%, rgba(14, 165, 233, 0.18) 0%, transparent 60%)',
      ],
      doodleOpacity: 0.24,
      badgeText: 'Live Agro-Meteorology & Microclimate Mesh',
    },
    treatment: {
      accentColor: '#16a34a', // Emerald / Bio-green
      strokeColor: '#15803d',
      bgGradients: [
        'radial-gradient(circle at 15% 25%, rgba(34, 197, 94, 0.22) 0%, transparent 50%)',
        'radial-gradient(circle at 85% 20%, rgba(16, 185, 129, 0.20) 0%, transparent 48%)',
        'radial-gradient(circle at 50% 80%, rgba(132, 204, 22, 0.18) 0%, transparent 55%)',
      ],
      doodleOpacity: 0.23,
      badgeText: 'AI Crop Pathology & Botanical Diagnostics',
    },
    equipment: {
      accentColor: '#ea580c', // Warm amber-orange machinery
      strokeColor: '#c2410c',
      bgGradients: [
        'radial-gradient(circle at 20% 20%, rgba(249, 115, 22, 0.20) 0%, transparent 48%)',
        'radial-gradient(circle at 80% 30%, rgba(234, 88, 12, 0.18) 0%, transparent 52%)',
        'radial-gradient(circle at 50% 80%, rgba(34, 197, 94, 0.16) 0%, transparent 55%)',
      ],
      doodleOpacity: 0.23,
      badgeText: 'Heavy Agricultural Machinery & Telematics Network',
    },
    farms: {
      accentColor: '#059669', // Lush field green
      strokeColor: '#047857',
      bgGradients: [
        'radial-gradient(circle at 15% 30%, rgba(16, 185, 129, 0.22) 0%, transparent 50%)',
        'radial-gradient(circle at 85% 25%, rgba(34, 197, 94, 0.20) 0%, transparent 52%)',
        'radial-gradient(circle at 45% 85%, rgba(101, 163, 13, 0.18) 0%, transparent 60%)',
      ],
      doodleOpacity: 0.24,
      badgeText: 'Field Geospatial Boundaries & Crop Cycles',
    },
    soil: {
      accentColor: '#8b5cf6', // Bio-chemical violet
      strokeColor: '#7c3aed',
      bgGradients: [
        'radial-gradient(circle at 20% 20%, rgba(139, 92, 246, 0.20) 0%, transparent 50%)',
        'radial-gradient(circle at 80% 25%, rgba(59, 130, 246, 0.18) 0%, transparent 50%)',
        'radial-gradient(circle at 50% 85%, rgba(34, 197, 94, 0.16) 0%, transparent 55%)',
      ],
      doodleOpacity: 0.23,
      badgeText: 'Real-time USB NPK Meter & Soil Health Spectrum',
    },
    orders: {
      accentColor: '#2563eb', // Logistics blue
      strokeColor: '#1d4ed8',
      bgGradients: [
        'radial-gradient(circle at 15% 25%, rgba(37, 99, 235, 0.20) 0%, transparent 48%)',
        'radial-gradient(circle at 85% 20%, rgba(34, 197, 94, 0.18) 0%, transparent 50%)',
        'radial-gradient(circle at 50% 80%, rgba(99, 102, 241, 0.16) 0%, transparent 55%)',
      ],
      doodleOpacity: 0.23,
      badgeText: 'Regional Agri-Chemical Stock & Fulfillment',
    },
    advisory: {
      accentColor: '#16a34a', // Fresh emerald AI crop green
      strokeColor: '#15803d',
      bgGradients: [
        'radial-gradient(circle at 18% 22%, rgba(34, 197, 94, 0.22) 0%, transparent 50%)',
        'radial-gradient(circle at 82% 18%, rgba(52, 211, 153, 0.20) 0%, transparent 48%)',
        'radial-gradient(circle at 50% 80%, rgba(74, 222, 128, 0.18) 0%, transparent 55%)',
      ],
      doodleOpacity: 0.24,
      badgeText: 'AI Agricultural Advisory & Multilingual Crop Intelligence',
    },
    default: {
      accentColor: '#16a34a',
      strokeColor: '#15803d',
      bgGradients: [
        'radial-gradient(circle at 20% 20%, rgba(34, 197, 94, 0.18) 0%, transparent 50%)',
        'radial-gradient(circle at 80% 30%, rgba(16, 185, 129, 0.16) 0%, transparent 50%)',
      ],
      doodleOpacity: 0.22,
      badgeText: '',
    }
  };

  const config = themeConfigs[theme] || themeConfigs.default;

  return (
    <div
      className="page-themed-backdrop"
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* ── Keyframe Animations Embedded ────────────────────────────── */}
      <style>{`
        @keyframes orbDriftA {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(45px, -35px) scale(1.08); }
        }
        @keyframes orbDriftB {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, 30px) scale(0.95); }
        }
        @keyframes weatherPulseSun {
          0%, 100% { opacity: 0.85; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.04) rotate(15deg); }
        }
        @keyframes rainMoteDrift {
          0% { transform: translateY(-20px); opacity: 0; }
          40% { opacity: 0.6; }
          100% { transform: translateY(120px); opacity: 0; }
        }
      `}</style>

      {/* ── Farms Theme: Photorealistic Aerial Drone View of Agricultural Fields ── */}
      {theme === 'farms' ? (
        <div
          className="farms-aerial-bg-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${farmsAerialBg})`,
            backgroundPosition: 'center 40%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.01)',
          }}
        >
          {/* Subtle transparent dark-green gradient:
              Keeps the patchwork crop fields, natural paths, and mountain horizon
              clearly visible from above while field cards, maps, and soil history
              tables remain crisp and fully readable on top */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 38%, rgba(7, 26, 14, 0.28) 0%, rgba(5, 20, 11, 0.40) 65%, rgba(3, 14, 8, 0.56) 100%),
                linear-gradient(180deg, rgba(6, 22, 12, 0.24) 0%, rgba(4, 18, 10, 0.18) 42%, rgba(3, 14, 8, 0.44) 100%)
              `,
            }}
          />
        </div>
      ) : theme === 'soil' ? (
        <div
          className="soil-ground-bg-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${soilGroundBg})`,
            backgroundPosition: 'center 55%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.01)',
          }}
        >
          {/* Real, richly-tilled dark earth photo now sits behind everything
              below — the layered brown/red-clay/black-earth gradients that
              used to stand in for "soil" (and read as a flat solid color)
              are gone. Everything else here (mineral-seam tint, root
              filaments, molecule accents, vignette) is now a light overlay
              on top of that photo instead of the whole background. */}
          {/* Subtle red clay and mineral seam tint over the photo */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 30% 55%, rgba(139, 58, 18, 0.22) 0%, transparent 40%),
                radial-gradient(ellipse at 70% 40%, rgba(101, 44, 12, 0.20) 0%, transparent 38%),
                radial-gradient(ellipse at 55% 80%, rgba(160, 72, 22, 0.16) 0%, transparent 35%)
              `,
            }}
          />
          {/* Organic matter and humus highlight layer — alive soil shimmer */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 50%, rgba(34, 197, 94, 0.06) 0%, transparent 65%),
                radial-gradient(ellipse at 15% 65%, rgba(74, 222, 128, 0.05) 0%, transparent 40%),
                radial-gradient(ellipse at 85% 55%, rgba(34, 197, 94, 0.05) 0%, transparent 38%)
              `,
            }}
          />
          {/* SVG root system filaments */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.18 }}
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <g fill="none" stroke="rgba(230,210,180,0.9)" strokeWidth="0.8" strokeLinecap="round">
              <path d="M 960,0 Q 940,180 960,360 Q 950,540 940,720 Q 950,900 960,1080" />
              <path d="M 960,216 Q 820,270 680,346 Q 540,410 390,486 Q 250,540 115,626" />
              <path d="M 960,216 Q 1100,280 1245,366 Q 1382,432 1536,518 Q 1690,580 1805,668" />
              <path d="M 680,346 Q 576,410 480,475 Q 384,540 306,626" strokeWidth="0.5" />
              <path d="M 1245,366 Q 1344,432 1420,518 Q 1497,594 1574,680" strokeWidth="0.5" />
              <path d="M 960,432 Q 845,497 730,562 Q 634,626 538,714" strokeWidth="0.5" />
              <path d="M 960,432 Q 1075,496 1190,562 Q 1286,626 1382,714" strokeWidth="0.5" />
              <path d="M 390,486 Q 326,540 268,605 Q 211,670 173,734" strokeWidth="0.4" opacity="0.7" />
              <path d="M 1536,518 Q 1613,580 1670,645 Q 1728,712 1747,778" strokeWidth="0.4" opacity="0.7" />
            </g>
            <g fill="rgba(190,148,96,0.35)">
              <circle cx="346" cy="410" r="2.5" />
              <circle cx="538" cy="670" r="1.8" />
              <circle cx="806" cy="842" r="2.2" />
              <circle cx="1152" cy="768" r="1.6" />
              <circle cx="1421" cy="594" r="2.0" />
              <circle cx="1574" cy="410" r="1.5" />
              <circle cx="230" cy="734" r="1.9" />
              <circle cx="1690" cy="778" r="2.1" />
              <circle cx="672" cy="497" r="1.4" />
              <circle cx="1248" cy="475" r="1.6" />
              <circle cx="960" cy="648" r="2.8" />
            </g>
            <g fill="rgba(210,185,140,0.22)">
              <circle cx="288" cy="562" r="1.0" />
              <circle cx="634" cy="778" r="0.8" />
              <circle cx="1056" cy="518" r="1.1" />
              <circle cx="1344" cy="713" r="0.9" />
              <circle cx="1632" cy="518" r="0.8" />
              <circle cx="845"  cy="950" r="1.0" />
              <circle cx="154"  cy="475" r="0.9" />
              <circle cx="1766" cy="626" r="1.0" />
            </g>
          </svg>
          {/* Subtle dark overlay behind cards — does NOT heavily darken the entire image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(ellipse at 50% 35%, rgba(18, 6, 2, 0.22) 0%, rgba(10, 4, 1, 0.35) 65%, rgba(8, 3, 1, 0.50) 100%)`,
            }}
          />
          {/* Top seedling-emergence green glow */}
          <div
            style={{
              position: 'absolute',
              top: '-5%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '700px',
              height: '380px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.14) 0%, rgba(16, 185, 129, 0.08) 45%, transparent 72%)',
              filter: 'blur(40px)',
            }}
          />
        </div>
      ) : theme === 'equipment' ? (
        <div
          className="equipment-tractor-bg-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${equipmentTractorBg})`,
            backgroundPosition: 'center 38%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.01)',
          }}
        >
          {/* Subtle dark-green transparent gradient:
              Keeps the modern tractor, crop rows, and golden sunlight clearly visible
              while making machinery rental cards, booking forms, and rate tables
              crisp and highly readable */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 42%, rgba(8, 28, 16, 0.30) 0%, rgba(5, 20, 12, 0.42) 68%, rgba(3, 14, 8, 0.58) 100%),
                linear-gradient(180deg, rgba(6, 22, 12, 0.26) 0%, rgba(4, 18, 10, 0.20) 38%, rgba(3, 14, 8, 0.46) 100%)
              `,
            }}
          />
        </div>
      ) : theme === 'orders' ? (
        <div
          className="orders-harvest-bg-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${ordersHarvestBg})`,
            backgroundPosition: 'center 45%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.01)',
          }}
        >
          {/* Light transparent dark-green & earthy gradient:
              Placed subtly over the background so harvested produce in rustic crates
              remains recognizable and atmospheric, while ensuring product cards, delivery forms,
              and stock tables in the Orders UI remain clearly readable and visually primary */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 40%, rgba(10, 30, 16, 0.32) 0%, rgba(6, 22, 12, 0.42) 70%, rgba(4, 16, 9, 0.58) 100%),
                linear-gradient(180deg, rgba(8, 26, 14, 0.28) 0%, rgba(6, 20, 11, 0.22) 40%, rgba(4, 16, 9, 0.45) 100%)
              `,
            }}
          />
        </div>
      ) : theme === 'weather' ? (
        <div
          className="weather-sky-bg-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${weatherSkyBg})`,
            backgroundPosition: 'center 40%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.01)',
          }}
        >
          {/* Subtle dark-green & slate gradient:
              Placed softly behind text & cards instead of heavily darkening the entire image,
              ensuring the dramatic clouds, breaking sunlight, and green farmland below remain clearly visible */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 45%, rgba(6, 26, 14, 0.28) 0%, rgba(4, 18, 10, 0.38) 72%, rgba(2, 12, 7, 0.52) 100%),
                linear-gradient(180deg, rgba(8, 22, 16, 0.22) 0%, rgba(5, 20, 11, 0.18) 35%, rgba(3, 16, 9, 0.42) 100%)
              `,
            }}
          />
        </div>
      ) : theme === 'advisory' ? (
        <div
          className="advisory-field-bg-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${advisoryFieldBg})`,
            backgroundPosition: 'center 45%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.01)',
          }}
        >
          {/* Subtle dark-green transparent gradient (20-30% opacity)
              Keeps farmland, curving crop rows, and warm morning sunrise clearly visible
              while guaranteeing high contrast and readability for text, diagnosis card, and voice selector */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 35%, rgba(10, 32, 18, 0.22) 0%, rgba(6, 24, 13, 0.32) 70%, rgba(3, 16, 9, 0.45) 100%),
                linear-gradient(180deg, rgba(8, 28, 15, 0.25) 0%, rgba(6, 22, 12, 0.18) 45%, rgba(4, 18, 10, 0.35) 100%)
              `,
            }}
          />
        </div>
      ) : theme === 'treatment' ? (
        <div
          className="treatment-wet-leaf-layer"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${wetLeafBg})`,
            backgroundPosition: 'center 35%',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            transform: 'scale(1.02)', // smooth bleed on edges
          }}
        >
          {/* Layered dark green & charcoal vignette overlay:
              Maintains high text/card readability and controlled brightness,
              whilst keeping natural leaf veins and dew droplet glimmers crisp and atmospheric */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(ellipse at 50% 35%, rgba(6, 30, 16, 0.62) 0%, rgba(4, 20, 11, 0.82) 75%, rgba(2, 12, 7, 0.94) 100%),
                linear-gradient(180deg, rgba(3, 18, 10, 0.72) 0%, rgba(6, 28, 16, 0.60) 40%, rgba(2, 14, 8, 0.88) 100%)
              `,
            }}
          />
          {/* Subtle bio-luminescent ambient depth light */}
          <div
            style={{
              position: 'absolute',
              top: '15%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '850px',
              height: '450px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(34, 197, 94, 0.12) 0%, transparent 70%)',
              filter: 'blur(50px)',
            }}
          />
        </div>
      ) : (
        <>
          {/* ── Layer 1: Ambient Colorful Glowing Orbs ─────────────────── */}
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-5%',
              width: '650px',
              height: '650px',
              borderRadius: '50%',
              background: config.bgGradients[0],
              filter: 'blur(60px)',
              animation: 'orbDriftA 16s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '5%',
              right: '-5%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: config.bgGradients[1] || config.bgGradients[0],
              filter: 'blur(60px)',
              animation: 'orbDriftB 20s ease-in-out infinite',
            }}
          />
          {config.bgGradients[2] && (
            <div
              style={{
                position: 'absolute',
                bottom: '5%',
                left: '30%',
                width: '700px',
                height: '500px',
                borderRadius: '50%',
                background: config.bgGradients[2],
                filter: 'blur(70px)',
              }}
            />
          )}

          {/* ── Layer 2: Theme-Specific Hand-Drawn Agricultural Pattern ──── */}
          <svg
            width="100%"
            height="100%"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: config.doodleOpacity,
              transition: 'opacity 0.5s ease',
            }}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id={`agri-pattern-${theme}`}
                width="320"
            height="320"
            patternUnits="userSpaceOnUse"
          >
            <g
              fill="none"
              stroke={config.strokeColor}
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >


              {/* === EQUIPMENT SPECIFIC DOODLE TILES === */}
              {theme === 'equipment' && (
                <>
                  {/* Heavy Tractor with high-traction tires */}
                  <g transform="translate(25, 40)">
                    <circle cx="26" cy="48" r="20" />
                    <circle cx="26" cy="48" r="10" />
                    <circle cx="82" cy="54" r="13" />
                    <circle cx="82" cy="54" r="6" />
                    <path d="M 26,28 L 46,28 L 52,10 L 86,10 L 96,36 L 96,54 L 82,54" />
                    <path d="M 18,28 L 18,-2 L 48,-2 L 48,28" />
                    <line x1="78" y1="10" x2="78" y2="-4" />
                    <circle cx="80" cy="-8" r="2" />
                    {/* Steering wheel */}
                    <line x1="44" y1="12" x2="38" y2="4" />
                  </g>

                  {/* Combine Harvester reel & cutter bar */}
                  <g transform="translate(190, 35)">
                    <rect x="10" y="20" width="50" height="30" rx="3" />
                    <circle cx="24" cy="52" r="12" />
                    <circle cx="50" cy="52" r="8" />
                    {/* Harvester cutter reel */}
                    <circle cx="-5" cy="42" r="10" strokeDasharray="3 3" />
                    <line x1="-5" y1="42" x2="10" y2="35" />
                    {/* Grain unloader chute pipe */}
                    <path d="M 35,20 L 45,2 L 65,-2" />
                  </g>

                  {/* Mechanical Spanner, Gear & Hardware wrench */}
                  <g transform="translate(45, 175)">
                    {/* Precision gear */}
                    <circle cx="25" cy="25" r="14" />
                    <circle cx="25" cy="25" r="6" />
                    <path d="M 25,7 L 25,4 M 25,43 L 25,46 M 7,25 L 4,25 M 43,25 L 46,25" />
                    <path d="M 12,12 L 9,9 M 38,38 L 41,41 M 12,38 L 9,41 M 38,12 L 41,9" />
                    {/* Crossed wrench */}
                    <line x1="45" y1="5" x2="80" y2="40" strokeWidth="2.5" />
                    <circle cx="45" cy="5" r="5" />
                  </g>

                  {/* Submersible Pump & Flow Valve */}
                  <g transform="translate(180, 165)">
                    <rect x="20" y="10" width="24" height="42" rx="4" />
                    <line x1="12" y1="22" x2="20" y2="22" />
                    <line x1="44" y1="40" x2="56" y2="40" />
                    <circle cx="32" cy="28" r="6" />
                    <path d="M 32,24 L 32,32 M 28,28 L 36,28" />
                    {/* Water flow waves */}
                    <path d="M 58,36 Q 64,32 70,36 T 82,36" />
                    <path d="M 58,44 Q 64,40 70,44 T 82,44" />
                  </g>

                  {/* Rotary Tiller Blade Tines & Soil furrows */}
                  <g transform="translate(100, 245)">
                    <path d="M 10,25 C 20,10 40,10 50,25 C 60,40 80,40 90,25" />
                    <path d="M 10,36 C 20,21 40,21 50,36 C 60,51 80,51 90,36" strokeDasharray="4 3" />
                  </g>
                </>
              )}

              {/* === FARMS SPECIFIC DOODLE TILES === */}
              {theme === 'farms' && (
                <>
                  {/* Field boundary plot / cadastral map polygons */}
                  <g transform="translate(35, 30)">
                    <polygon points="10,25 45,5 75,20 65,65 15,55" />
                    <line x1="10" y1="25" x2="45" y2="40" />
                    <line x1="45" y1="40" x2="75" y2="20" />
                    <line x1="45" y1="40" x2="65" y2="65" />
                    {/* Map GPS pinpoint */}
                    <circle cx="45" cy="40" r="3" fill={config.strokeColor} />
                  </g>

                  {/* Traditional Red Barn & Grain Silo */}
                  <g transform="translate(180, 25)">
                    <path d="M 15,35 L 38,15 L 61,35" />
                    <rect x="18" y="35" width="40" height="32" rx="2" />
                    <rect x="30" y="47" width="16" height="20" />
                    <line x1="30" y1="47" x2="46" y2="67" />
                    <line x1="46" y1="47" x2="30" y2="67" />
                    {/* Silo */}
                    <path d="M 64,67 L 64,28 A 8 8 0 0 1 80,28 L 80,67" />
                    <line x1="64" y1="40" x2="80" y2="40" />
                  </g>

                  {/* Clean Ag-Tech Wind Turbine */}
                  <g transform="translate(60, 150)">
                    <line x1="30" y1="75" x2="30" y2="15" strokeWidth="2" />
                    <circle cx="30" cy="15" r="3" fill={config.strokeColor} />
                    <path d="M 30,15 L 30,-10 C 33,-6 33,6 30,15" />
                    <path d="M 30,15 L 52,28 C 48,31 38,25 30,15" />
                    <path d="M 30,15 L 8,28 C 12,31 22,25 30,15" />
                  </g>

                  {/* Lush Wheat & Paddy sheaves */}
                  <g transform="translate(200, 145)">
                    <path d="M 25,60 Q 30,25 40,5" />
                    <path d="M 40,5 C 34,-2 28,4 38,2 C 42,10 40,15 40,5" />
                    <path d="M 36,15 C 24,10 20,4 30,-2 C 34,5 37,12 36,15" />
                    <path d="M 38,14 C 50,10 54,4 44,-2 C 40,5 37,12 38,14" />
                    <path d="M 32,28 C 20,23 16,17 26,11 C 30,18 33,25 32,28" />
                    <path d="M 34,27 C 46,23 50,17 40,11 C 36,18 33,25 34,27" />
                  </g>

                  {/* Farmer straw hat & Apple orchard fruit */}
                  <g transform="translate(125, 235)">
                    {/* Straw hat */}
                    <path d="M 8,24 C 8,24 24,16 48,16 C 72,16 88,24 88,24" />
                    <path d="M 24,18 C 24,6 72,6 72,18" />
                    {/* Sprout below */}
                    <circle cx="48" cy="40" r="10" />
                    <path d="M 48,30 C 48,24 53,22 55,24" />
                  </g>
                </>
              )}



              {/* === SOIL / NPK SPECIFIC DOODLE TILES === */}
              {theme === 'soil' && (
                <>
                  {/* Laboratory Flask & Soil extraction test */}
                  <g transform="translate(40, 35)">
                    <path d="M 30,10 L 30,22 L 12,54 A 8 8 0 0 0 20,64 L 52,64 A 8 8 0 0 0 60,54 L 42,22 L 42,10 Z" />
                    <line x1="26" y1="10" x2="46" y2="10" strokeWidth="2" />
                    <path d="M 18,50 Q 36,44 54,50" />
                    <circle cx="28" cy="56" r="2" fill={config.strokeColor} />
                    <circle cx="42" cy="58" r="1.5" fill={config.strokeColor} />
                  </g>

                  {/* NPK Digital Probe meter */}
                  <g transform="translate(180, 30)">
                    <rect x="20" y="10" width="34" height="48" rx="6" />
                    <rect x="26" y="16" width="22" height="16" rx="2" />
                    {/* Probes into ground */}
                    <line x1="28" y1="58" x2="28" y2="78" strokeWidth="2.5" />
                    <line x1="46" y1="58" x2="46" y2="78" strokeWidth="2.5" />
                  </g>

                  {/* Soil layers & strata horizons */}
                  <g transform="translate(30, 165)">
                    <path d="M 10,20 Q 30,12 50,20 T 90,20" />
                    <path d="M 10,34 Q 30,26 50,34 T 90,34" strokeDasharray="3 3" />
                    <path d="M 10,48 Q 30,40 50,48 T 90,48" strokeDasharray="4 2" />
                    {/* Earthworms & root capillaries */}
                    <path d="M 30,20 C 35,26 28,34 38,42" />
                    <path d="M 65,20 C 60,28 70,36 62,45" />
                  </g>

                  {/* Molecule Nodes (Nitrogen, Phosphorous, Potassium) */}
                  <g transform="translate(185, 160)">
                    <circle cx="25" cy="20" r="12" />
                    <circle cx="55" cy="45" r="12" />
                    <circle cx="20" cy="55" r="10" />
                    <line x1="33" y1="28" x2="47" y2="37" strokeWidth="2" />
                    <line x1="23" y1="32" x2="21" y2="45" strokeWidth="2" />
                    <line x1="45" y1="52" x2="30" y2="55" strokeWidth="2" />
                  </g>
                </>
              )}



              {/* === DEFAULT SHARED FARM ACCENTS (Organic sprouts, furrows) === */}
              {/* Little sprout accents */}
              <circle cx="15" cy="15" r="1.5" fill={config.strokeColor} />
              <circle cx="160" cy="160" r="1.5" fill={config.strokeColor} />
              <circle cx="305" cy="305" r="1.5" fill={config.strokeColor} />
              <circle cx="15" cy="305" r="1.5" fill={config.strokeColor} />
              <circle cx="305" cy="15" r="1.5" fill={config.strokeColor} />
            </g>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill={`url(#agri-pattern-${theme})`} />
      </svg>

      {/* ── Layer 3: Soft Edge Vignette for Crystal Clear Readability ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(244, 250, 245, 0.40) 0%, rgba(244, 250, 245, 0.08) 65%, rgba(238, 244, 238, 0.55) 100%)',
        }}
      />
    </>
  )}
    </div>
  );
}
