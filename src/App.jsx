import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import farmCopilotLogo from './assets/farm-copilot-logo.png';
import Home from './pages/Home';
import Advisory from './pages/Advisory';
import Treatment from './pages/Treatment';
import Weather from './pages/Weather';
import Orders from './pages/Orders';
import Equipment from './pages/Equipment';
import Farms from './pages/Farms';
import SoilTest from './pages/SoilTest';
import AuthModal from './components/AuthModal';
import TrackerBar from './components/TrackerBar';
import AgriDoodleBackground from './components/AgriDoodleBackground';
import PageThemedBackdrop from './components/PageThemedBackdrop';
import { TrackingProvider } from './context/TrackingContext';
import './App.css';

const navItems = [
  { path: '/advisory', label: 'Advisory' },
  { path: '/treatment', label: 'Treatment' },
  { path: '/weather', label: 'Weather' },
  { path: '/orders', label: 'Orders' },
  { path: '/equipment', label: 'Equipment' },
  { path: '/farms', label: 'My Farms' },
  { path: '/soil', label: 'Soil Test' },
];

const mobileNavItems = [
  { path: '/', label: 'Home' },
  { path: '/advisory', label: 'Advisory' },
  { path: '/treatment', label: 'Treatment' },
  { path: '/weather', label: 'Weather' },
  { path: '/orders', label: 'Orders' },
  { path: '/equipment', label: 'Equipment' },
  { path: '/farms', label: 'My Farms' },
  { path: '/soil', label: 'Soil Test' },
];

/* Per-page accent, all colors already used elsewhere in this app —
   violet (brand default), indigo (Treatment's own product-card color),
   emerald (existing success/online color), amber & sky-blue (already
   used throughout Orders.jsx / Equipment.jsx). Matches the accent
   system on the home page's feature showcase. */
const NAV_ACCENTS = {
  '/advisory': '34,197,94',
  '/treatment': '99,102,241',
  '/weather': '16,185,129',
  '/orders': '245,158,11',
  '/equipment': '96,165,250',
  '/farms': '52,211,153',
  '/soil': '251,146,60',
};
const DEFAULT_ACCENT_RGB = '34,197,94';

function Navbar({ user, onLogin, onSignup, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="app-navbar" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      backgroundColor: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.06)',
    }}>
      <nav className="nav-grid-container" style={{
        width: '100%',
        maxWidth: '1280px',
        margin: '0 auto',
        height: '56px',
        alignItems: 'center',
      }}>
        {/* LEFT: Logo on Desktop, Hamburger Button on Mobile */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          {/* Desktop Logo */}
          <Link to="/" className="nav-desktop-only" style={{
            alignItems: 'center', gap: '8px',
            color: '#111827', fontWeight: 600, fontSize: '15px',
            textDecoration: 'none', letterSpacing: '-0.2px',
          }}>
            <span
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              style={{
                width: '38px', height: '38px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                // A warm cream chip behind the mark, not a color filter on
                // it — the logo's own black linework and amber grain color
                // (matched exactly to the uploaded brand mark) only read
                // clearly against a light backing, and this keeps that
                // backing constant regardless of the navbar's own theme,
                // instead of guessing at a contrast trick per background.
                backgroundColor: '#faf4e5',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.18)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer',
              }}
            >
              <img
                src={farmCopilotLogo}
                alt="Farm Copilot"
                style={{ width: '30px', height: '30px', objectFit: 'contain', display: 'block' }}
              />
            </span>
            Farm Copilot
          </Link>

          {/* Mobile Hamburger Icon Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="nav-mobile-only"
            style={{
              background: mobileMenuOpen ? 'rgba(34, 197, 94,0.14)' : 'rgba(0,0,0,0.04)',
              border: mobileMenuOpen ? '1px solid rgba(34, 197, 94,0.35)' : '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
              color: '#111827',
              width: '44px',
              height: '44px',
              padding: 0,
              cursor: 'pointer',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
          </button>
        </div>

        {/* CENTER: Desktop Nav links */}
        <div className="nav-desktop-only" style={{ alignItems: 'center', gap: '4px' }}>
          {navItems.map((item) => {
            const rgb = NAV_ACCENTS[item.path];
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: isActive ? `rgb(${rgb})` : '#6b7280',
                  textDecoration: 'none',
                  backgroundColor: isActive ? `rgba(${rgb},0.12)` : 'transparent',
                  border: isActive ? `1px solid rgba(${rgb},0.24)` : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#111827'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = '#6b7280'; }}
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>

        {/* RIGHT: Auth buttons or user info */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
          <div className="nav-desktop-only" style={{ width: '1px', height: '14px', backgroundColor: 'rgba(0,0,0,0.1)' }} />
          {user ? (
            <div className="nav-desktop-only" style={{ alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.6), 0 0 14px rgba(34, 197, 94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: '#fff',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#374151' }}>
                  {user.name.split(' ')[0]}
                </span>
              </div>
              <button
                onClick={onLogout}
                style={{
                  background: 'none', border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px', cursor: 'pointer',
                  color: '#6b7280', fontSize: '12px', fontWeight: 500,
                  padding: '5px 12px', transition: 'all 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#6b7280'; }}
              >
                Log out
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Auth Buttons */}
              <button
                onClick={onLogin}
                className="nav-desktop-only"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#6b7280', fontSize: '13px', fontWeight: 500,
                  transition: 'color 0.15s',
                }}
              >
                Log in
              </button>
              <button
                onClick={onSignup}
                className="nav-desktop-only"
                style={{
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                Sign up
              </button>

              {/* Mobile Auth Pill Button */}
              <button
                onClick={onLogin}
                className="nav-mobile-only"
                style={{
                  backgroundColor: '#16a34a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '9px 16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Log in / Sign up
              </button>
            </>
          )}
        </div>
      </nav>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="nav-mobile-only nav-drawer-enter" style={{
          backgroundColor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          padding: '12px 16px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          boxShadow: '0 20px 30px rgba(0,0,0,0.12)',
        }}>
          {mobileNavItems.map((item) => {
            const rgb = NAV_ACCENTS[item.path] || DEFAULT_ACCENT_RGB;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isActive ? `rgb(${rgb})` : '#1f2937',
                  textDecoration: 'none',
                  backgroundColor: isActive ? `rgba(${rgb},0.12)` : 'rgba(0,0,0,0.03)',
                  border: isActive ? `1px solid rgba(${rgb},0.25)` : '1px solid rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                })}
              >
                <span>{item.label}</span>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>→</span>
              </NavLink>
            );
          })}

          {/* Account row — folded in here instead of crowding the top bar */}
          {user && (
            <div style={{
              marginTop: '8px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(0,0,0,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg, #22c55e, #15803d)',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.6), 0 0 14px rgba(34, 197, 94,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#fff',
                }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{
                  fontSize: '14px', fontWeight: 600, color: '#1f2937',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.name}
                </span>
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                style={{
                  background: 'none', border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
                  color: '#6b7280', fontSize: '12px', fontWeight: 500,
                  padding: '9px 14px',
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

/* Page wrapper — gives each section its own themed background.
   Pass `theme` to use a photorealistic PageThemedBackdrop (treatment, weather,
   orders, advisory), or `doodle` for legacy SVG doodle pages (equipment, farms,
   soil) — purely decorative, pointer-events:none, z-index:0 behind content. */
function PageWrapper({ title, subtitle, doodle, theme, children }) {
  return (
    <div style={{ position: 'relative', paddingTop: '56px', minHeight: '100vh' }}>
      {/* Photorealistic themed backdrop (treatment, weather, orders, advisory) */}
      {theme && <PageThemedBackdrop theme={theme} />}
      {/* Legacy SVG doodle backdrop for other pages */}
      {!theme && doodle && <AgriDoodleBackground />}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          borderBottom: '1px solid rgba(0,0,0,0.07)',
          padding: '28px 0 20px',
          marginBottom: '20px',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px' }}>
            <h1 style={{
              fontSize: '30px',
              fontWeight: 700,
              color: '#111827',
              letterSpacing: '-0.5px',
              margin: 0,
            }}>{title}</h1>
            {subtitle && (
              <p style={{
                marginTop: '8px', fontSize: '15px', margin: '8px 0 0',
                // These headers sit directly on the photographic themed
                // backdrop (PageThemedBackdrop) with nothing behind them —
                // the old medium-gray was tuned for a plain light page and
                // washes out against a photo. Bright, near-white text plus
                // a dark drop shadow keeps it legible against any of the
                // theme photos regardless of how light or dark that patch
                // of the image is.
                color: 'rgba(255,255,255,0.92)',
                textShadow: '0 1px 3px rgba(0,0,0,0.75), 0 1px 10px rgba(0,0,0,0.45)',
              }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 32px 80px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export { PageWrapper };

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fc_user')); } catch { return null; }
  });
  const [authModal, setAuthModal] = useState(null); // 'login' | 'signup' | null

  // Restore session on reload
  useEffect(() => {
    const token = localStorage.getItem('fc_token');
    const savedUser = localStorage.getItem('fc_user');
    if (token && savedUser) {
      try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('fc_token');
    localStorage.removeItem('fc_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
    <TrackingProvider>
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'transparent',
        fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        {/* Subtle glow at top — greenish to match the agricultural ambience.
            The real farm photography now lives only inside the Home page's
            hero (see Home.jsx + FarmBackdrop.jsx), not site-wide. */}
        <div style={{
          position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '900px', height: '500px', pointerEvents: 'none', zIndex: 0,
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(74,222,128,0.12) 0%, transparent 70%)',
        }} />

        <Navbar
          user={user}
          onLogin={() => setAuthModal('login')}
          onSignup={() => setAuthModal('signup')}
          onLogout={handleLogout}
        />

        {/* Auth Modal */}
        {authModal && (
          <AuthModal
            mode={authModal}
            onClose={() => setAuthModal(null)}
            onSuccess={(userData) => setUser(userData)}
          />
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/advisory"
              element={
                <PageWrapper theme="advisory" title="AI Advisory" subtitle="Describe your crop issue or upload a photo for instant AI-powered diagnosis">
                  <Advisory user={user} onLogin={() => setAuthModal('login')} />
                </PageWrapper>
              }
            />
            <Route
              path="/treatment"
              element={
                <PageWrapper theme="treatment" title="Treatment Finder" subtitle="Get pesticide & fertilizer recommendations based on your crop disease">
                  <Treatment />
                </PageWrapper>
              }
            />
            <Route
              path="/weather"
              element={
                <PageWrapper theme="weather" title="Weather & Disease Risk" subtitle="Real-time disease risk prediction based on your local weather conditions">
                  <Weather user={user} />
                </PageWrapper>
              }
            />
            <Route
              path="/orders"
              element={
                <PageWrapper theme="orders" title="Orders & Stock Confirmation" subtitle="Track live stock availability & place chemical orders from local vendors">
                  <Orders user={user} onLogin={() => setAuthModal('login')} />
                </PageWrapper>
              }
            />
            <Route
              path="/soil"
              element={
                <PageWrapper theme="soil" title="Soil Test" subtitle="Read your NPK meter live over USB, save each stable reading, and build your farm's soil history">
                  <SoilTest user={user} onLogin={() => setAuthModal('login')} />
                </PageWrapper>
              }
            />
            <Route
              path="/farms"
              element={
                <PageWrapper theme="farms" title="My Farms" subtitle="Manage each of your fields separately — its location, its crop, and its own soil history">
                  <Farms user={user} onLogin={() => setAuthModal('login')} />
                </PageWrapper>
              }
            />
            <Route
              path="/equipment"
              element={
                <PageWrapper theme="equipment" title="Equipment & Machinery Rental" subtitle="Rent tractors, harvesters, and farm machinery from nearby equipment owners at fixed rates">
                  <Equipment user={user} onLogin={() => setAuthModal('login')} />
                </PageWrapper>
              }
            />
          </Routes>
        </div>
        <TrackerBar />
      </div>
    </TrackingProvider>
    </BrowserRouter>
  );
}