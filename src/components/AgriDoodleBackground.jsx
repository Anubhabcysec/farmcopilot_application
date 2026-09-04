/* AgriDoodleBackground — a subtle, tiled hand-drawn-style pattern of
   farm/agriculture doodles (wheat stalk, leaf, sprout, sun, cloud, rain
   drop, small tractor) used as a page background on the utility pages
   (Treatment, Weather, Orders, Equipment, My Farms, Soil Test).

   It is pure inline SVG (no image request, no external asset) drawn in
   the site's own green (#16a34a / #15803d, the same tones as the navbar
   logo and active nav links) at very low opacity so it reads as texture
   rather than imagery — the page's white cards and text keep their full
   contrast on top of it.

   Positioned absolute + inset:0 inside a `position: relative` ancestor
   (PageWrapper in App.jsx), with pointer-events:none and a z-index below
   the page content, so it never intercepts a click/hover or shifts any
   layout — it is purely decorative and sits behind everything. */
export default function AgriDoodleBackground() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      preserveAspectRatio="xMidYMin slice"
    >
      <defs>
        <pattern
          id="agriDoodleTile"
          width="360"
          height="360"
          patternUnits="userSpaceOnUse"
        >
          <g
            fill="none"
            stroke="#15803d"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.09"
          >
            {/* Wheat stalk */}
            <g transform="translate(24,30)">
              <path d="M10 70 L10 10" />
              <path d="M10 16 C 2 10, 0 2, 4 -4 C 10 2, 10 10, 10 16 Z" />
              <path d="M10 16 C 18 10, 20 2, 16 -4 C 10 2, 10 10, 10 16 Z" />
              <path d="M10 30 C 2 24, 0 16, 4 10 C 10 16, 10 24, 10 30 Z" />
              <path d="M10 30 C 18 24, 20 16, 16 10 C 10 16, 10 24, 10 30 Z" />
              <path d="M10 44 C 2 38, 0 30, 4 24 C 10 30, 10 38, 10 44 Z" />
              <path d="M10 44 C 18 38, 20 30, 16 24 C 10 30, 10 38, 10 44 Z" />
            </g>

            {/* Sprout / seedling */}
            <g transform="translate(150,250)">
              <path d="M0 40 L0 14" />
              <path d="M0 14 C -14 14, -18 0, -14 -10 C -2 -8, 0 6, 0 14 Z" />
              <path d="M0 20 C 14 20, 18 6, 14 -4 C 2 -2, 0 12, 0 20 Z" />
              <path d="M-10 40 L10 40" />
            </g>

            {/* Simple leaf */}
            <g transform="translate(270,60) rotate(18)">
              <path d="M0 0 C 26 -4, 42 12, 40 34 C 14 38, -2 22, 0 0 Z" />
              <path d="M2 2 C 16 8, 28 18, 38 32" />
            </g>

            {/* Sun */}
            <g transform="translate(300,180)">
              <circle cx="0" cy="0" r="12" />
              <path d="M0 -20 L0 -26" />
              <path d="M0 20 L0 26" />
              <path d="M-20 0 L-26 0" />
              <path d="M20 0 L26 0" />
              <path d="M-14 -14 L-18 -18" />
              <path d="M14 -14 L18 -18" />
              <path d="M-14 14 L-18 18" />
              <path d="M14 14 L18 18" />
            </g>

            {/* Cloud */}
            <g transform="translate(70,150)">
              <path d="M-16 10 a10 10 0 1 1 2 -19.6 a12 12 0 0 1 22.6 4 a9 9 0 0 1 -1.6 15.6 Z" />
            </g>

            {/* Rain drop */}
            <g transform="translate(210,300)">
              <path d="M0 0 C 8 10, 8 20, 0 24 C -8 20, -8 10, 0 0 Z" />
            </g>

            {/* Small tractor outline */}
            <g transform="translate(90,300) scale(0.85)">
              <circle cx="6" cy="30" r="9" />
              <circle cx="46" cy="30" r="14" />
              <path d="M0 30 L0 12 L20 12 L30 22 L46 22" />
              <path d="M20 12 L20 4 L28 4" />
            </g>

            {/* Second, smaller leaf pair for extra fill */}
            <g transform="translate(330,320) rotate(-24)">
              <path d="M0 0 C 16 -3, 26 7, 24 20 C 8 22, -2 13, 0 0 Z" />
            </g>
            <g transform="translate(150,60) rotate(200)">
              <path d="M0 0 C 16 -3, 26 7, 24 20 C 8 22, -2 13, 0 0 Z" />
            </g>
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#agriDoodleTile)" />
    </svg>
  );
}
