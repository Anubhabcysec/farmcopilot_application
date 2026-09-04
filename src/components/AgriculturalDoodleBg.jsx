import React from 'react';

/**
 * AgriculturalDoodleBg:
 * Seamless, beautifully blended agricultural doodle background pattern.
 * Features hand-drawn farm motifs: tractors, wheat stalks, sprouts, sun & rain clouds,
 * watering cans, barns, leaves, pitchforks, soil furrows, wind turbines, and corn.
 *
 * Uses pointer-events: none and subtle organic opacity to ensure 100% readability
 * and zero interference with text, buttons, forms, maps, or interactive components.
 */
export default function AgriculturalDoodleBg({ className = '' }) {
  return (
    <div
      className={`agricultural-doodle-bg ${className}`}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Seamless repeating SVG agricultural doodle pattern */}
      <svg
        width="100%"
        height="100%"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.075,
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="agri-doodle-pattern"
            width="280"
            height="280"
            patternUnits="userSpaceOnUse"
          >
            {/* Group with uniform farm theme stroke styling */}
            <g
              fill="none"
              stroke="#15803d"
              strokeWidth="1.65"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* --- 1. Sprout / Seedling (Top Left: 35, 45) --- */}
              <path d="M 35,60 Q 35,38 35,22" />
              <path d="M 35,32 C 22,25 15,35 24,42 C 30,45 35,36 35,36" />
              <path d="M 35,26 C 46,18 52,28 44,36 C 39,40 35,30 35,30" />
              <ellipse cx="35" cy="62" rx="14" ry="3.5" strokeDasharray="3 3" />

              {/* --- 2. Sun & Cloud / Micro-climate (Top Center-Right: 160, 40) --- */}
              <circle cx="145" cy="30" r="10" />
              <path d="M 145,15 L 145,11 M 145,45 L 145,49 M 130,30 L 126,30 M 160,30 L 164,30" />
              <path d="M 135,20 L 132,17 M 155,40 L 158,43 M 135,40 L 132,43 M 155,20 L 158,17" />
              {/* Cloud overlapping */}
              <path d="M 152,48 H 182 A 9 9 0 0 0 180,31 A 14 14 0 0 0 155,26 A 11 11 0 0 0 144,37 A 9 9 0 0 0 152,48 Z" />
              {/* Rain drops */}
              <path d="M 156,54 L 153,60 M 168,54 L 165,60 M 178,54 L 175,60" />

              {/* --- 3. Wheat Stalk (Far Right: 245, 60) --- */}
              <path d="M 245,85 Q 248,50 255,25" />
              <path d="M 255,25 C 250,18 245,12 255,8 C 258,18 256,23 255,25" />
              <path d="M 252,35 C 242,30 236,25 244,18 C 249,25 251,32 252,35" />
              <path d="M 254,34 C 263,30 270,25 264,18 C 258,25 255,32 254,34" />
              <path d="M 250,48 C 240,43 234,38 241,32 C 247,38 249,45 250,48" />
              <path d="M 252,47 C 261,43 268,38 262,32 C 256,38 253,45 252,47" />
              <path d="M 248,62 C 238,58 232,53 238,47 C 244,52 247,59 248,62" />
              <path d="M 250,61 C 259,57 266,52 260,47 C 254,52 251,59 250,61" />

              {/* --- 4. Tractor (Middle-Left: 30, 150) --- */}
              {/* Big rear wheel */}
              <circle cx="38" cy="165" r="16" />
              <circle cx="38" cy="165" r="7" />
              {/* Small front wheel */}
              <circle cx="85" cy="171" r="10" />
              <circle cx="85" cy="171" r="4" />
              {/* Chassis & hood */}
              <path d="M 38,149 L 52,149 L 58,132 L 86,132 L 95,152 L 95,171 L 85,171" />
              {/* Cab / rollbar */}
              <path d="M 32,149 L 32,122 L 54,122 L 54,149" />
              {/* Exhaust pipe & puff */}
              <path d="M 78,132 L 78,120 L 81,120" />
              <path d="M 82,115 C 84,111 89,114 88,111" strokeDasharray="2 2" />
              {/* Steering wheel */}
              <path d="M 50,133 L 44,127" />

              {/* --- 5. Barn / Silo (Center: 140, 135) --- */}
              {/* Barn Roof */}
              <path d="M 125,142 L 140,126 L 155,142" />
              {/* Barn Body */}
              <rect x="127" y="142" width="26" height="28" rx="2" />
              {/* Barn Door with X */}
              <rect x="134" y="152" width="12" height="18" />
              <path d="M 134,152 L 146,170 M 146,152 L 134,170" />
              {/* Silo next to barn */}
              <path d="M 158,170 L 158,136 A 6 6 0 0 1 170,136 L 170,170" />
              <line x1="158" y1="145" x2="170" y2="145" />
              <line x1="158" y1="154" x2="170" y2="154" />

              {/* --- 6. Watering Can (Middle Right: 230, 150) --- */}
              <rect x="225" y="142" width="22" height="24" rx="4" />
              <path d="M 225,148 C 213,148 213,162 225,162" />
              {/* Top Handle */}
              <path d="M 230,142 C 230,132 242,132 242,142" />
              {/* Spout */}
              <path d="M 247,152 L 264,138" />
              <line x1="262" y1="134" x2="267" y2="143" />
              {/* Water drops */}
              <circle cx="269" cy="132" r="1" fill="#15803d" />
              <circle cx="273" cy="138" r="1" fill="#15803d" />
              <circle cx="271" cy="144" r="1" fill="#15803d" />

              {/* --- 7. Corn Cob (Bottom-Left: 40, 230) --- */}
              <path d="M 35,250 C 32,238 38,220 48,212 C 58,220 62,238 59,250 Z" />
              {/* Corn Kernels grid */}
              <line x1="47" y1="215" x2="47" y2="248" />
              <line x1="40" y1="228" x2="55" y2="228" />
              <line x1="38" y1="236" x2="57" y2="236" />
              <line x1="40" y1="244" x2="55" y2="244" />
              {/* Husk leaves */}
              <path d="M 33,248 C 26,240 25,225 35,218" />
              <path d="M 60,248 C 68,240 68,225 58,218" />

              {/* --- 8. Wind Turbine / Clean Ag-Tech (Center-Bottom: 135, 235) --- */}
              <line x1="135" y1="268" x2="135" y2="215" strokeWidth="2" />
              <circle cx="135" cy="215" r="3" fill="#15803d" />
              {/* 3 Blades */}
              <path d="M 135,215 L 135,193 C 137,196 137,208 135,215" />
              <path d="M 135,215 L 154,226 C 151,228 142,223 135,215" />
              <path d="M 135,215 L 116,226 C 119,228 128,223 135,215" />

              {/* --- 9. Pitchfork & Shovel / Soil Tools (Bottom-Right: 235, 235) --- */}
              {/* Crossed Shovel & Fork */}
              <line x1="220" y1="268" x2="255" y2="215" />
              <path d="M 252,219 L 260,210 L 263,214 L 257,222 Z" />
              <line x1="250" y1="268" x2="220" y2="215" />
              {/* Fork tines */}
              <path d="M 214,210 L 220,216 M 218,206 L 224,213 M 222,203 L 228,210" />

              {/* --- 10. Organic Leaf Sprigs & Soil Furrows (Filler accents) --- */}
              {/* Soil ridge lines near bottom */}
              <path d="M 75,258 Q 95,252 115,258 Q 135,264 155,258" strokeDasharray="4 3" />
              <path d="M 165,265 Q 185,259 205,265" strokeDasharray="4 3" />
              
              {/* Floating leaf near center */}
              <path d="M 98,82 C 90,74 95,62 108,65 C 114,75 106,85 98,82 Z" />
              <path d="M 98,82 Q 102,74 107,67" />

              {/* Floating apple / tomato */}
              <circle cx="195" cy="85" r="7" />
              <path d="M 195,78 C 196,74 200,72 201,73" />
              <path d="M 200,74 C 204,74 205,71 204,70" />

              {/* Little sprout dot */}
              <circle cx="95" cy="18" r="1.5" fill="#15803d" />
              <circle cx="215" cy="20" r="1.5" fill="#15803d" />
              <circle cx="15" cy="105" r="1.5" fill="#15803d" />
              <circle cx="270" cy="185" r="1.5" fill="#15803d" />
            </g>
          </pattern>
        </defs>

        {/* Fill the pattern across the full viewport */}
        <rect width="100%" height="100%" fill="url(#agri-doodle-pattern)" />
      </svg>

      {/* Gentle radial vignette: keeps central content crisp, softly accentuates margins */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(244, 250, 245, 0.45) 0%, rgba(244, 250, 245, 0.1) 70%, rgba(238, 244, 238, 0.5) 100%)',
        }}
      />
    </div>
  );
}
