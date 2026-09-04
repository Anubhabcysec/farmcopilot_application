// AgriIcon — a single, reusable set of line-drawn agricultural icons used across
// the whole app in place of emoji. One consistent visual language: clean sketch
// lines, natural proportions, restrained color (inherits currentColor unless a
// color prop is passed), uniform stroke weight. Every icon shares the same
// 24x24 viewBox and stroke conventions so they read as one family wherever
// they appear — weather cards, treatment instructions, equipment listings,
// farm cards, order dashboards, and the homepage.
//
// Usage: <AgriIcon name="sun" size={18} color="#b45309" />
export default function AgriIcon({ name, size = 18, color = 'currentColor', strokeWidth = 1.6, style, className }) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { flexShrink: 0, ...style },
    className,
  };

  switch (name) {
    // ── Weather ──────────────────────────────────────────────────────────
    case 'sun':
      return (<svg {...p}><circle cx="12" cy="12" r="4.5" /><path d="M12 3v2.2M12 18.8V21M4.5 12H6.7M17.3 12h2.2M6.3 6.3l1.5 1.5M16.2 16.2l1.5 1.5M17.7 6.3l-1.5 1.5M7.8 16.2l-1.5 1.5" /></svg>);
    case 'moon':
      return (<svg {...p}><path d="M20 14.5a8 8 0 0 1-10.5-10.4A8 8 0 1 0 20 14.5Z" /></svg>);
    case 'cloud':
      return (<svg {...p}><path d="M7 18h10a4 4 0 0 0 .6-7.95 5.5 5.5 0 0 0-10.6 1.6A3.5 3.5 0 0 0 7 18Z" /></svg>);
    case 'cloud-sun':
      return (<svg {...p}><circle cx="7.5" cy="6.5" r="2.6" /><path d="M7.5 2.2v1.2M4 6.5H2.8M11.5 3.5l-.9.9M3.6 10.4l.9-.9" /><path d="M9 18h8.2a3.5 3.5 0 0 0 .5-6.96 4.6 4.6 0 0 0-8.7 1.4A3 3 0 0 0 9 18Z" /></svg>);
    case 'cloud-moon':
      return (<svg {...p}><path d="M8.3 8.8a2.6 2.6 0 1 0 3-3.7 2.6 2.6 0 0 0-3 3.7Z" /><path d="M9 18h8.2a3.5 3.5 0 0 0 .5-6.96 4.6 4.6 0 0 0-8.7 1.4A3 3 0 0 0 9 18Z" /></svg>);
    case 'cloud-drizzle':
      return (<svg {...p}><path d="M7 14h10a4 4 0 0 0 .6-7.95 5.5 5.5 0 0 0-10.6 1.6A3.5 3.5 0 0 0 7 14Z" /><path d="M8 18v1.4M12 18v1.4M16 18v1.4" /></svg>);
    case 'cloud-rain':
      return (<svg {...p}><path d="M7 13h10a4 4 0 0 0 .6-7.95 5.5 5.5 0 0 0-10.6 1.6A3.5 3.5 0 0 0 7 13Z" /><path d="M8.5 17 7.3 20M13 17l-1.2 3M17.5 17l-1.2 3" /></svg>);
    case 'cloud-rain-heavy':
      return (<svg {...p}><path d="M7 12h10a4 4 0 0 0 .6-7.95 5.5 5.5 0 0 0-10.6 1.6A3.5 3.5 0 0 0 7 12Z" /><path d="M7 16l-1.3 3.4M11 16l-1.3 3.4M15 16l-1.3 3.4M19 16l-1.3 3.4" /></svg>);
    case 'thunderstorm':
      return (<svg {...p}><path d="M7 12h9.5a4 4 0 0 0 .5-7.97A5.5 5.5 0 0 0 6.5 5.6 3.5 3.5 0 0 0 7 12Z" /><path d="M13 13.5 10 18h3l-2 4.5" /></svg>);
    case 'snow':
      return (<svg {...p}><path d="M7 12h10a4 4 0 0 0 .6-7.95 5.5 5.5 0 0 0-10.6 1.6A3.5 3.5 0 0 0 7 12Z" /><path d="M9 17v4M7.3 18.3l3.4 1.4M11.3 18.3l-3.4 1.4M15 17v4M13.3 18.3l3.4 1.4M17.3 18.3l-3.4 1.4" /></svg>);
    case 'fog':
      return (<svg {...p}><path d="M6 10h9.5a3.3 3.3 0 0 0 .5-6.57A4.5 4.5 0 0 0 7.4 4.9 2.9 2.9 0 0 0 6 10Z" /><path d="M4 14h16M6 18h12M4 22h16" /></svg>);
    case 'wind':
      return (<svg {...p}><path d="M3.5 8.5h11a2.3 2.3 0 1 0-2.2-3" /><path d="M3.5 13h14.6a2.6 2.6 0 1 1-2.4 3.6" /><path d="M3.5 17.5h8" /></svg>);
    case 'thermometer':
      return (<svg {...p}><path d="M12 14.8V5.2a2 2 0 1 0-4 0v9.6a3.4 3.4 0 1 0 4 0Z" /><path d="M10 8v6" /></svg>);
    case 'droplet':
      return (<svg {...p}><path d="M12 3.5s6 6.7 6 11a6 6 0 0 1-12 0c0-4.3 6-11 6-11Z" /></svg>);

    // ── Status / alerts ──────────────────────────────────────────────────
    case 'check-circle':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M8.2 12.3 11 15l5-6" /></svg>);
    case 'check':
      return (<svg {...p}><path d="M5 13l4.5 4.5L19 8" /></svg>);
    case 'x-circle':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.3 9.3l5.4 5.4M14.7 9.3l-5.4 5.4" /></svg>);
    case 'alert-triangle':
      return (<svg {...p}><path d="M12 4 3 20h18Z" /><path d="M12 10v4" /><path d="M12 17h.01" /></svg>);
    case 'alert-circle':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 8v5" /><path d="M12 16h.01" /></svg>);
    case 'zap':
      return (<svg {...p}><path d="M13 3 6 13.5h5L11 21l7-10.5h-5L13 3Z" /></svg>);
    case 'bell':
      return (<svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2.5h-15Z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>);
    case 'bell-off':
      return (<svg {...p}><path d="M8 6.4A6 6 0 0 1 18 11v5l1.5 2.5H7" /><path d="M6 9.5V11l-1.5 5.5H4" /><path d="M10 20a2 2 0 0 0 4 0" /><path d="M3.5 3.5l17 17" /></svg>);
    case 'megaphone':
      return (<svg {...p}><path d="M4 10v4a1.5 1.5 0 0 0 1.5 1.5H7l4 3.5v-13L7 9.5H5.5A1.5 1.5 0 0 0 4 10Z" /><path d="M11 8.3a6 6 0 0 1 0 7.4M14 6.2a9.3 9.3 0 0 1 0 11.6" /></svg>);

    // ── Crops / botanical ────────────────────────────────────────────────
    case 'sprout':
      return (<svg {...p}><path d="M12 21v-8" /><path d="M12 13c0-3.5-2.5-6-6.5-6.3C5.9 10.8 8.4 13 12 13Z" /><path d="M12 11c0-3.9 2.8-6.6 7-7 0 4.3-2.8 7-7 7Z" /></svg>);
    case 'leaf':
      return (<svg {...p}><path d="M5 19c9 1.5 14-3.5 14-13-9.5 0-14.5 4.5-14 13Z" /><path d="M6 18c3-3.3 5.5-6.5 12-11" /></svg>);
    case 'wheat':
      return (<svg {...p}><path d="M12 22V9" /><path d="M12 9c-1.6-.6-2.6-1.9-2.6-3.4C9.4 4 10.7 3 12 3s2.6 1 2.6 2.6C14.6 7.1 13.6 8.4 12 9Z" /><path d="M12 13.5c-1.8-.5-3-1.8-3-3.4M12 13.5c1.8-.5 3-1.8 3-3.4M12 17.5c-1.8-.5-3-1.8-3-3.4M12 17.5c1.8-.5 3-1.8 3-3.4" /></svg>);
    case 'tomato':
      return (<svg {...p}><circle cx="12" cy="13.5" r="6.5" /><path d="M12 7 10.3 4.6M12 7l1.7-2.4M12 7l-.3-2.8M9 6.2c1-.6 2-.9 3-.9s2 .3 3 .9" /></svg>);
    case 'potato':
      return (<svg {...p}><path d="M6 12c-1-2.6.5-5.4 3-6.2 1-2 3.2-3 5.3-2.2 2.3.8 3.5 3.3 2.8 5.7 2 .8 3 3.2 2 5.3-1 2.3-3.6 3.4-5.9 2.5-1.6 1.5-4 1.8-6 .6-2.4-1.4-3.2-4.5-1.9-6.9Z" /><circle cx="9.5" cy="10.5" r=".4" fill={color} stroke="none" /><circle cx="14" cy="14" r=".4" fill={color} stroke="none" /></svg>);
    case 'corn':
      return (<svg {...p}><path d="M12 3c2.8 1 4.5 4 4.5 8.5C16.5 17 14.5 21 12 21s-4.5-4-4.5-9.5C7.5 7 9.2 4 12 3Z" /><path d="M9 7.5h6M8.3 11h7.4M8.3 14.5h7.4M9 18h6" /></svg>);
    case 'chili':
      return (<svg {...p}><path d="M12 3c1.5 1 1 3-.3 3.3" /><path d="M11.7 6.3c3 0 5.3 2.4 6 5.7.8 3.8-1.3 8-4.7 9-3 .9-5.8-.7-6.4-3.6-.8-3.7 1.4-8 5.1-11.1Z" /></svg>);
    case 'grape':
      return (<svg {...p}><path d="M12 3v3" /><circle cx="12" cy="8.3" r="2.1" /><circle cx="9.3" cy="11.3" r="2.1" /><circle cx="14.7" cy="11.3" r="2.1" /><circle cx="7.6" cy="14.8" r="2.1" /><circle cx="12" cy="14.8" r="2.1" /><circle cx="16.4" cy="14.8" r="2.1" /><circle cx="9.8" cy="18.2" r="2.1" /><circle cx="14.2" cy="18.2" r="2.1" /></svg>);
    case 'mango':
      return (<svg {...p}><path d="M9 4.5c3.5-1.6 6 .3 6 3.4 3.7.4 6 3.6 5 7.2-1.1 4-5.2 6.4-9.1 5.4-4-1-6.3-5.2-5.2-9.3.8-3 3-4.3 3.3-6.7Z" /></svg>);
    case 'onion':
      return (<svg {...p}><path d="M12 4c.7 1.4.4 2.6-.6 3.4 3.7.5 6.1 3.7 5.7 7.6-.4 3.9-3.7 6.7-7.4 6.3-3.7-.4-6.4-3.9-6-7.8.3-3.1 2.6-5.2 5.6-5.9-1-1-1.2-2.4-.3-3.6Z" /><path d="M12 7.4c1.6.6 2.7 1.8 3.2 3.3M8.6 10.4c.5-1.4 1.4-2.5 2.7-3.2" /></svg>);
    case 'bean':
      return (<svg {...p}><path d="M8 5c-3 1.6-4.6 4.7-3.6 8 1 3.5 4.6 5.5 8 4.4 3.6-1.1 4.8-4 5.6-7.6" /><circle cx="9" cy="9.3" r="1.9" /><circle cx="13.7" cy="14.4" r="1.9" /></svg>);
    case 'cotton':
      return (<svg {...p}><path d="M12 21v-9" /><circle cx="12" cy="8.5" r="3.2" /><circle cx="8" cy="10.5" r="2.4" /><circle cx="16" cy="10.5" r="2.4" /><path d="M12 12v3M9.5 12.5 9 15M14.5 12.5l.5 2.5" /></svg>);
    case 'mushroom':
      return (<svg {...p}><path d="M4.5 11.5c0-4.4 3.4-7.5 7.5-7.5s7.5 3.1 7.5 7.5c-1.7.8-4.4 1.3-7.5 1.3s-5.8-.5-7.5-1.3Z" /><path d="M9.5 12.6V17a2.5 2.5 0 0 0 5 0v-4.4" /></svg>);
    case 'bug':
      return (<svg {...p}><rect x="8.5" y="9" width="7" height="9" rx="3.5" /><path d="M12 9V6.5M9.5 7l-1.7-1.7M14.5 7l1.7-1.7M6 12h2.5M15.5 12H18M6.5 16.5l2-1.3M17.5 16.5l-2-1.3M9 21l1-2M15 21l-1-2" /></svg>);
    case 'tree':
      return (<svg {...p}><path d="M12 21v-6.5" /><path d="M12 3.5c3 0 5.3 2.4 5.3 5.3 0 .5-.05.9-.16 1.4a4.2 4.2 0 0 1-1.24 8.2H8.1a4.2 4.2 0 0 1-1.24-8.2 5 5 0 0 1-.16-1.4c0-2.9 2.3-5.3 5.3-5.3Z" /></svg>);

    // ── Science / chemical / treatment ───────────────────────────────────
    case 'flask':
      return (<svg {...p}><path d="M10 3.5h4M10.5 3.5V10L6.2 17.4A2 2 0 0 0 7.9 20.5h8.2a2 2 0 0 0 1.7-3.1L13.5 10V3.5" /><path d="M8.6 15.5h6.8" /></svg>);
    case 'spray':
      return (<svg {...p}><path d="M9 10h6.5A2.5 2.5 0 0 1 18 12.5v6A1.5 1.5 0 0 1 16.5 20h-6A1.5 1.5 0 0 1 9 18.5v-8.5Z" /><path d="M12 10V7.5M10.3 7.5h3.4l1-2.3h-5.4l1 2.3Z" /><path d="M18.5 13.5H21M18.5 16.5H20" /></svg>);
    case 'shield':
      return (<svg {...p}><path d="M12 3.5 5 6v5.5c0 5 3 8.3 7 9.5 4-1.2 7-4.5 7-9.5V6l-7-2.5Z" /></svg>);
    case 'shield-check':
      return (<svg {...p}><path d="M12 3.5 5 6v5.5c0 5 3 8.3 7 9.5 4-1.2 7-4.5 7-9.5V6l-7-2.5Z" /><path d="M9 12l2 2 4-4.5" /></svg>);
    case 'pill':
      return (<svg {...p}><rect x="3.5" y="9.5" width="17" height="7" rx="3.5" transform="rotate(-35 12 13)" /><path d="M11 9.2l2.6 5.6" /></svg>);
    case 'book':
      return (<svg {...p}><path d="M5 5.2c2-.9 4.7-.9 7 0 2.3-.9 5-.9 7 0v13c-2-.9-4.7-.9-7 0-2.3-.9-5-.9-7 0V5.2Z" /><path d="M12 5.2v13" /></svg>);
    case 'ruler':
      return (<svg {...p}><rect x="3" y="9" width="18" height="6" rx="1.2" /><path d="M7 9v2M11 9v3M15 9v2M19 9v3" /></svg>);
    case 'stopwatch':
      return (<svg {...p}><circle cx="12" cy="13" r="8" /><path d="M12 13V9M9.5 3.5h5" /></svg>);
    case 'clock':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></svg>);
    case 'search':
      return (<svg {...p}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.8-4.8" /></svg>);
    case 'camera':
      return (<svg {...p}><path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h2l1-2h7l1 2h2A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-9Z" /><circle cx="12" cy="13" r="3.4" /></svg>);
    case 'folder':
      return (<svg {...p}><path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l1.7 2H18.5A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5v-11Z" /></svg>);
    case 'brain':
      return (<svg {...p}><path d="M9.5 4.2A3 3 0 0 0 6.7 8a3 3 0 0 0-.4 5.7A3 3 0 0 0 9 18a2.6 2.6 0 0 0 2.5-2V6.5A2.3 2.3 0 0 0 9.5 4.2Z" /><path d="M14.5 4.2A3 3 0 0 1 17.3 8a3 3 0 0 1 .4 5.7A3 3 0 0 1 15 18a2.6 2.6 0 0 1-2.5-2V6.5a2.3 2.3 0 0 1 2-2.3Z" /></svg>);
    case 'globe':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.4 3.8 5.6 3.8 9s-1.3 6.6-3.8 9c-2.5-2.4-3.8-5.6-3.8-9S9.5 5.4 12 3Z" /></svg>);
    case 'robot':
      return (<svg {...p}><rect x="5" y="9" width="14" height="10" rx="2.5" /><path d="M12 9V6M9.5 6h5" /><circle cx="9.3" cy="14" r="1.1" fill={color} stroke="none" /><circle cx="14.7" cy="14" r="1.1" fill={color} stroke="none" /><path d="M9 17.3h6" /></svg>);
    case 'star':
      return (<svg {...p}><path d="M12 3.5l2.4 5.1 5.6.6-4.2 3.9 1.1 5.6L12 15.9l-4.9 2.8 1.1-5.6-4.2-3.9 5.6-.6L12 3.5Z" /></svg>);
    case 'play':
      return (<svg {...p}><path d="M7 4.5v15l13-7.5-13-7.5Z" /></svg>);

    // ── Equipment ────────────────────────────────────────────────────────
    case 'tractor':
      return (<svg {...p}><circle cx="6.5" cy="17.5" r="3" /><circle cx="17" cy="18" r="2.2" /><path d="M6.5 14.5V9h4l1.5 4M11.5 9h4.3L18 12.5v3.4h-2M9.5 17.5h5.3" /></svg>);
    case 'harvester':
      return (<svg {...p}><rect x="9" y="8" width="9" height="6" rx="1" /><circle cx="11" cy="17.5" r="2.3" /><circle cx="16.5" cy="17.5" r="1.6" /><path d="M9 11H5.5l-2 2M18 10l3-1" /></svg>);
    case 'rotate':
      return (<svg {...p}><path d="M19 12a7 7 0 1 1-2.3-5.2" /><path d="M19 4v4h-4" /></svg>);
    case 'pump':
      return (<svg {...p}><rect x="8" y="6" width="8" height="12" rx="2" /><path d="M5 10h3M16 12h3" /><circle cx="12" cy="11" r="1.6" /><path d="M12 12.6v2M10.5 12l3 2" /></svg>);
    case 'seed-drill':
      return (<svg {...p}><rect x="4" y="7" width="16" height="4.5" rx="1" /><circle cx="7" cy="17.5" r="2" /><circle cx="12" cy="17.5" r="2" /><circle cx="17" cy="17.5" r="2" /><path d="M7 11.5v3.7M12 11.5v3.7M17 11.5v3.7" /></svg>);
    case 'truck':
      return (<svg {...p}><rect x="1.5" y="7" width="13" height="9.5" rx="1" /><path d="M14.5 10.5H18l3 3v3h-6.5" /><circle cx="6.5" cy="18.5" r="1.6" /><circle cx="17" cy="18.5" r="1.6" /></svg>);
    case 'package':
      return (<svg {...p}><path d="M21 8.5v7a1 1 0 0 1-.5.87l-8 4.5a1 1 0 0 1-1 0l-8-4.5A1 1 0 0 1 3 15.5v-7a1 1 0 0 1 .5-.87l8-4.5a1 1 0 0 1 1 0l8 4.5a1 1 0 0 1 .5.87Z" /><path d="M3.3 8.1 12 13l8.7-4.9" /><path d="M12 13v8.5" /></svg>);
    case 'coin':
      return (<svg {...p}><circle cx="12" cy="12" r="9" /><path d="M9.3 14.3a2.6 2.6 0 0 0 2.5 1.7c1.5 0 2.7-.9 2.7-2s-1-1.6-2.7-2c-1.7-.4-2.7-.9-2.7-2s1.2-2 2.7-2a2.6 2.6 0 0 1 2.5 1.7" /><path d="M12 6.5v11" /></svg>);

    // ── Location / logistics ─────────────────────────────────────────────
    case 'pin':
      return (<svg {...p}><path d="M12 21s-6.5-6-6.5-11.5A6.5 6.5 0 0 1 18.5 9.5C18.5 15 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.3" /></svg>);
    case 'map':
      return (<svg {...p}><path d="M9 4.5 4 6.5v13l5-2 6 2 5-2v-13l-5 2-6-2Z" /><path d="M9 4.5v13M15 6.5v13" /></svg>);
    case 'navigation':
      return (<svg {...p}><path d="M12 3l7 16.5-7-3.8-7 3.8L12 3Z" /></svg>);
    case 'phone':
      return (<svg {...p}><path d="M4.5 4h3.2l1.4 4-2 1.5a11 11 0 0 0 5.4 5.4l1.5-2 4 1.4v3.2a1.5 1.5 0 0 1-1.6 1.5A15.5 15.5 0 0 1 3 5.6 1.5 1.5 0 0 1 4.5 4Z" /></svg>);
    case 'store':
      return (<svg {...p}><path d="M4 9.5 5 4h14l1 5.5" /><path d="M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-5.5h4V20" /></svg>);
    case 'traffic-light':
      return (<svg {...p}><rect x="9" y="3" width="6" height="16" rx="3" /><circle cx="12" cy="7" r="1" fill={color} stroke="none" /><circle cx="12" cy="11" r="1" fill={color} stroke="none" /><circle cx="12" cy="15" r="1" fill={color} stroke="none" /><path d="M12 19v2" /></svg>);
    case 'refresh':
      return (<svg {...p}><path d="M19 12a7 7 0 1 1-2.3-5.2" /><path d="M19 4v4h-4" /></svg>);

    default:
      return null;
  }
}
