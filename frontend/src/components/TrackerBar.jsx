import { Link } from 'react-router-dom';
import { useTracking } from '../context/TrackingContext';
import AgriIcon from './AgriIcon';

// Small floating bar shown on EVERY page (Orders, Equipment, Advisory, etc.)
// whenever a delivery/equipment is being tracked, so switching pages never
// hides or pauses the tracking — only closing this bar or arriving does.
export default function TrackerBar() {
  const { tracking, arrived, secondsLeft, stopTracking } = useTracking();
  if (!tracking) return null;

  const icon = tracking.type === 'order' ? 'package' : 'tractor';

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(18px + env(safe-area-inset-bottom, 0px))',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '9px 10px 9px 16px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.97)',
      border: '1px solid rgba(0,0,0,0.1)',
      boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
      backdropFilter: 'blur(10px)',
      maxWidth: 'calc(100vw - 24px)',
    }}>
      <span style={{
        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
        backgroundColor: arrived ? '#34d399' : '#f97316',
        boxShadow: arrived ? '0 0 8px #34d399' : '0 0 8px #f97316',
      }} />
      <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
        <AgriIcon name={arrived ? 'check-circle' : icon} size={13} color={arrived ? '#15803d' : '#111827'} />
        {arrived
          ? `${tracking.label} arrived`
          : `${tracking.label} — ETA ${secondsLeft}s`}
      </span>
      <Link
        to="/treatment"
        style={{ fontSize: '11px', color: '#15803d', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
      >
        View Map
      </Link>
      <button
        onClick={stopTracking}
        aria-label="Dismiss tracking"
        style={{ background: 'none', border: 'none', color: '#777', cursor: 'pointer', fontSize: '13px', padding: '0 2px', lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  );
}
