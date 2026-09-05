import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const getApiUrl = (path) => `${API_BASE_URL}${path}`;

export default function Weather({ user }) {
  const [weather, setWeather] = useState(null);
  const [risks, setRisks] = useState([]);
  const [overallRisk, setOverallRisk] = useState('');
  const [riskSummary, setRiskSummary] = useState(null);
  const [alertMsg, setAlertMsg] = useState('');
  const [source, setSource] = useState('');
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  
  const [forecastAlerts, setForecastAlerts] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    localStorage.getItem('weatherNotificationsEnabled') === 'true'
  );
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchWeather();
  }, []);

  const fetchWeather = () => {
    setLoading(true);
    setLocationError('');

    const fallbackToIpLocation = async () => {
      try {
        const ipRes = await axios.get(getApiUrl('/api/treatment/ip-location'));
        if (ipRes.data && ipRes.data.success && ipRes.data.lat && ipRes.data.lng) {
          setLocationError('');
          loadWeatherData(ipRes.data.lat, ipRes.data.lng);
          return;
        }
      } catch (err) {
        /* fallback if IP fetch fails */
      }
      loadWeatherData(28.6139, 77.2090);
      setLocationError('Using default location (New Delhi) due to location access settings.');
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocationError('');
          loadWeatherData(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          fallbackToIpLocation();
        },
        { timeout: 3000, maximumAge: 60000 }
      );
    } else {
      fallbackToIpLocation();
    }
  };

  const loadWeatherData = async (lat, lng) => {
    try {
      // Parallelize weather & forecast alerts requests for 2x faster loading
      const [res, alertsRes] = await Promise.all([
        axios.get(getApiUrl(`/api/weather?lat=${lat}&lng=${lng}`)),
        axios.get(getApiUrl(`/api/weather/forecast-alerts?lat=${lat}&lng=${lng}`)).catch(() => ({ data: { success: false } }))
      ]);

      if (res.data && res.data.success) {
        const d = res.data.data;
        setWeather(d.weather);
        setRisks(d.risks);
        setOverallRisk(d.overallRisk);
        setRiskSummary(d.riskSummary);
        setAlertMsg(d.alert);
        setSource(res.data.source);
      }

      if (alertsRes.data && alertsRes.data.success) {
        setForecastAlerts(alertsRes.data.alerts);
        if (localStorage.getItem('weatherNotificationsEnabled') === 'true') {
          triggerNotifications(alertsRes.data.alerts);
        }
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }
    const permission = await Notification.requestPermission();
    const enabled = permission === 'granted';
    setNotificationsEnabled(enabled);
    localStorage.setItem('weatherNotificationsEnabled', enabled.toString());
    if (enabled && forecastAlerts.length > 0) {
        triggerNotifications(forecastAlerts);
    }
  };

  const triggerNotifications = (alerts) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    // Only notify for critical or high severity
    const severeAlerts = alerts.filter(a => a.severity === 'critical' || a.severity === 'high');
    
    severeAlerts.forEach(alertItem => {
      // Check if we already notified for this specific alert to avoid spamming
      const notificationKey = `notified_${alertItem.type}_${alertItem.startTime}`;
      if (!sessionStorage.getItem(notificationKey)) {
        new Notification(alertItem.title, {
          body: `${alertItem.detail || ''}\n${alertItem.timeWindow}`,
          icon: '/favicon.ico' // fallback icon
        });
        sessionStorage.setItem(notificationKey, 'true');
      }
    });
  };

  // ── Demo mode: inject fake severe alerts for hackathon presentation ──
  const simulateAlert = async () => {
    // Ensure notifications are enabled first
    if ('Notification' in window && Notification.permission !== 'granted') {
      await Notification.requestPermission();
    }
    setNotificationsEnabled(true);
    localStorage.setItem('weatherNotificationsEnabled', 'true');

    const now = new Date();
    const in2h = new Date(now.getTime() + 2 * 3600000);
    const in5h = new Date(now.getTime() + 5 * 3600000);
    const in8h = new Date(now.getTime() + 8 * 3600000);
    const in12h = new Date(now.getTime() + 12 * 3600000);

    const demoAlerts = [
      {
        type: 'severe_storm',
        severity: 'critical',
        icon: '🌪️',
        title: 'Severe Thunderstorm Warning',
        detail: 'Weather code 95 — active thunderstorm with possible hail',
        farmAction: 'Move livestock to shelter immediately. Secure greenhouse structures and irrigation equipment. Harvest any mature crops if possible.',
        startTime: in2h.toISOString(),
        endTime: in5h.toISOString(),
        startsIn: 'in 2h',
        timeWindow: `Today ${in2h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} – ${in5h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      },
      {
        type: 'heavy_rain',
        severity: 'high',
        icon: '🌧️',
        title: 'Heavy Rainfall — Flood Risk',
        detail: 'Cumulative 48mm of rain predicted over 3 hours',
        farmAction: 'Clear drainage channels. Cover seedbeds and nursery areas. Avoid pesticide/fertilizer application — it will wash off.',
        startTime: in5h.toISOString(),
        endTime: in8h.toISOString(),
        startsIn: 'in 5h',
        timeWindow: `Today ${in5h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} – ${in8h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      },
      {
        type: 'strong_wind',
        severity: 'high',
        icon: '💨',
        title: 'Strong Wind Warning',
        detail: 'Wind gusts up to 62 km/h',
        farmAction: 'Stake tall crops (maize, sugarcane). Secure poly-houses and shade nets. Postpone any spraying operations.',
        startTime: in8h.toISOString(),
        endTime: in12h.toISOString(),
        startsIn: 'in 8h',
        timeWindow: `Tomorrow ${in8h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} – ${in12h.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`,
      },
    ];

    // FIX: Merge demo alerts ON TOP of real alerts — don't wipe real ones
    // Only replace matching demo types, keep all other real alerts
    const demoTypes = demoAlerts.map(a => a.type);
    setForecastAlerts(prev => [
      ...demoAlerts,
      ...prev.filter(a => !demoTypes.includes(a.type)),
    ]);

    // Show in-page toast notifications (works without any browser permission)
    showToast('🌪️ CRITICAL: Severe Thunderstorm Warning', 'Active thunderstorm with hail expected in 2 hours. Take immediate protective measures.', 'critical');
    setTimeout(() => {
      showToast('🌧️ HIGH: Heavy Rainfall — Flood Risk', '48mm of rain predicted in 5 hours. Clear drainage channels and cover seedbeds.', 'high');
    }, 1500);
    setTimeout(() => {
      showToast('💨 HIGH: Strong Wind Warning', 'Wind gusts up to 62 km/h expected. Stake tall crops and secure structures.', 'high');
    }, 3000);

    // Also try browser notification as a bonus
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🌪️ CRITICAL: Severe Thunderstorm Warning', {
        body: 'Active thunderstorm with hail expected in 2 hours.\nTake immediate protective measures for crops and livestock.',
        icon: '/favicon.ico',
        requireInteraction: true,
      });
    }

    // ── Send real email + SMS if user is logged in ──
    const token = localStorage.getItem('fc_token');
    if (token) {
      try {
        await axios.post(
          getApiUrl('/api/weather/simulate-alert'),
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error('Notification send error:', err.message);
      }
    }
  };

  const showToast = (title, body, severity) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, body, severity }]);
    // Auto-remove after 6 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 6000);
  };

  const getWeatherIcon = (iconCode) => ({
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  }[iconCode] || '🌤️');

  // Muted, premium styling matching the brand colors (brand-400, violet)
  const getRiskStyles = (risk) => {
    const map = {
      'High': {
        color: '#b91c1c',
        bg: 'rgba(248, 113, 113, 0.1)',
        border: 'rgba(248, 113, 113, 0.3)',
        progress: 'linear-gradient(90deg, #16a34a, #ef4444)'
      },
      'Medium': {
        color: '#b45309',
        bg: 'rgba(251, 191, 36, 0.1)',
        border: 'rgba(251, 191, 36, 0.3)',
        progress: 'linear-gradient(90deg, #16a34a, #f59e0b)'
      },
      'Low': {
        color: '#15803d',
        bg: 'rgba(52, 211, 153, 0.1)',
        border: 'rgba(52, 211, 153, 0.3)',
        progress: 'linear-gradient(90deg, #166534, #34d399)'
      }
    };
    return map[risk] || map['Low'];
  };

  const getAlertSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return { border: 'rgba(239, 68, 68, 0.3)', bg: 'rgba(239, 68, 68, 0.08)', color: '#b91c1c' };
      case 'high':
        return { border: 'rgba(245, 158, 11, 0.3)', bg: 'rgba(245, 158, 11, 0.08)', color: '#b45309' };
      case 'medium':
        return { border: 'rgba(34, 197, 94, 0.3)', bg: 'rgba(34, 197, 94, 0.08)', color: '#15803d' };
      default:
        return { border: 'rgba(0, 0, 0, 0.1)', bg: 'rgba(0, 0, 0, 0.03)', color: '#111827' };
    }
  };

  const riskStyles = getRiskStyles(overallRisk);
  const progressPercent = overallRisk === 'High' ? '85%' : overallRisk === 'Medium' ? '50%' : '20%';

  return (
    <>
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-up">
      <style>{`
        .weather-card {
          background: rgba(255, 255, 255, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(2, 132, 199, 0.12);
          border-radius: 16px;
          padding: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(2, 132, 199, 0.04), 0 1px 3px rgba(0,0,0,0.05);
        }
        .weather-card:hover {
          border-color: rgba(2, 132, 199, 0.28);
          box-shadow: 0 12px 36px rgba(2, 132, 199, 0.12);
          transform: translateY(-2px);
        }
        .metric-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(2, 132, 199, 0.10);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          transition: all 0.2s ease;
        }
        .metric-card:hover {
          background: rgba(255, 255, 255, 0.95);
          border-color: rgba(2, 132, 199, 0.25);
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.08);
          transform: translateY(-1px);
        }
        .grid-layout {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 12px;
        }
        .risks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 20px;
        }
        .alerts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 16px;
        }
        @media (max-width: 640px) {
          .risks-grid, .alerts-grid {
            grid-template-columns: 1fr;
          }
          .metrics-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>

      {/* Location warning notification */}
      {locationError && (
        <div style={{
          backgroundColor: 'rgba(251, 191, 36, 0.08)',
          border: '1px solid rgba(251, 191, 36, 0.25)',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '13px',
          color: '#b45309',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>📍</span>
          <span>{locationError}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid-layout">
            <div className="shimmer" style={{ height: '180px', borderRadius: '16px' }} />
            <div className="shimmer" style={{ height: '180px', borderRadius: '16px' }} />
          </div>
          <div className="shimmer" style={{ height: '80px', borderRadius: '16px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
            <div className="shimmer" style={{ height: '120px', borderRadius: '16px' }} />
          </div>
        </div>
      )}

      {!loading && weather && (
        <>
          {/* Top Row: Weather Stats + Overall Disease Risk */}
          <div className="grid-layout">
            {/* Weather overview */}
            <div className="weather-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <span style={{ fontSize: '48px', lineHeight: '1' }}>{getWeatherIcon(weather.icon)}</span>
                  <div>
                    <h3 style={{ fontSize: '32px', fontWeight: 800, color: '#111827', margin: 0, letterSpacing: '-1px' }}>{weather.temperature}°C</h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0', textTransform: 'capitalize' }}>{weather.description}</p>
                  </div>
                </div>
                <button
                  onClick={fetchWeather}
                  style={{
                    background: 'rgba(0,0,0,0.03)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    color: '#6b7280',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)'; e.currentTarget.style.color = '#111827'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; e.currentTarget.style.color = '#6b7280'; }}
                >
                  🔄 Refresh
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                <div>
                  <span style={{ fontSize: '13px', color: '#1f2937', fontWeight: 500 }}>{weather.location}</span>
                  {source === 'mock' && (
                    <span style={{ marginLeft: '8px', fontSize: '9px', fontWeight: 600, color: '#6b7280', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', padding: '1px 6px', borderRadius: '100px' }}>Demo</span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: '#6b7280' }}>Live Forecast</span>
              </div>
            </div>

            {/* Disease Risk Progress Card */}
            <div className="weather-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280', fontWeight: 500 }}>Overall Outbreak Threat</span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: riskStyles.color,
                    backgroundColor: riskStyles.bg,
                    border: `1px solid ${riskStyles.border}`,
                    padding: '2px 8px',
                    borderRadius: '100px',
                    letterSpacing: '0.5px'
                  }}>{overallRisk.toUpperCase()} RISK</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: '8px', backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: '100px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{
                    height: '100%',
                    borderRadius: '100px',
                    background: riskStyles.progress,
                    width: progressPercent,
                    transition: 'width 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
                  }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px' }}>
                {riskSummary && (
                  <>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Assessments: <strong style={{ color: '#374151', fontWeight: 600 }}>{riskSummary.total}</strong>
                    </span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>•</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      Threats: <strong style={{ color: '#b91c1c', fontWeight: 600 }}>{riskSummary.high} High</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Alert Message Banner (if any threat detected) */}
          {alertMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.06)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }} className="weather-card">
              <span style={{ fontSize: '20px' }}>📢</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', animation: 'pulseGlow 2s infinite' }} />
                <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 500, lineHeight: '1.4' }}>{alertMsg}</span>
              </div>
            </div>
          )}

          {/* Second Row: Detailed weather metrics grid */}
          <div className="metrics-grid">
            {[
              { icon: '🌡️', value: `${weather.feelsLike}°C`, label: 'Feels Like', warn: false },
              { icon: '💧', value: `${weather.humidity}%`, label: 'Humidity', warn: weather.humidity > 75 },
              { icon: '🌧️', value: `${weather.rainfall}mm`, label: 'Precipitation', warn: weather.rainfall > 5 },
              { icon: '💨', value: `${weather.windSpeed} km/h`, label: 'Wind Speed', warn: false }
            ].map((metric) => (
              <div key={metric.label} className="metric-card" style={metric.warn ? {
                background: 'rgba(34, 197, 94, 0.08)',
                borderColor: 'rgba(34, 197, 94, 0.25)'
              } : {}}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>{metric.icon}</div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: metric.warn ? '#15803d' : '#111827', margin: 0 }}>{metric.value}</h4>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0' }}>{metric.label}</p>
              </div>
            ))}
          </div>

          {/* Forecast Alerts Section — always visible so simulate button is accessible */}
          {
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>Forecast Alerts</h3>
                  <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Predicted severe weather events over the next 48 hours</p>
                </div>
                <button
                  onClick={requestNotificationPermission}
                  style={{
                    background: notificationsEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${notificationsEnabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '8px',
                    color: notificationsEnabled ? '#15803d' : '#6b7280',
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={e => {
                    if (!notificationsEnabled) {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.2)';
                      e.currentTarget.style.color = '#111827';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!notificationsEnabled) {
                      e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)';
                      e.currentTarget.style.color = '#6b7280';
                    }
                  }}
                >
                  {notificationsEnabled ? '🔔 Notifications On' : '🔕 Enable Notifications'}
                </button>
                <button
                  onClick={simulateAlert}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '8px',
                    color: '#b91c1c',
                    fontSize: '12px',
                    fontWeight: 600,
                    padding: '6px 12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)'; }}
                >
                  ⚡ Simulate Alert
                </button>
              </div>

              {forecastAlerts.length > 0 ? (
              <div className="alerts-grid">
                {forecastAlerts.map((alertItem, idx) => {
                  const alertStyle = getAlertSeverityStyles(alertItem.severity);
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: alertStyle.bg,
                        border: `1px solid ${alertStyle.border}`,
                        borderRadius: '16px',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        transition: 'transform 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '24px' }}>{alertItem.icon}</span>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{alertItem.title}</h4>
                            <p style={{ fontSize: '12px', color: alertStyle.color, margin: '2px 0 0', fontWeight: 500 }}>
                              {alertItem.startsIn}
                            </p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: alertStyle.color,
                          backgroundColor: 'rgba(255,255,255,0.6)',
                          border: `1px solid ${alertStyle.border}`,
                          padding: '3px 10px',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {alertItem.severity}
                        </span>
                      </div>

                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.04)',
                        borderRadius: '8px',
                        padding: '12px',
                        marginTop: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '12px' }}>⏱️</span>
                          <span style={{ fontSize: '11px', color: '#374151', fontWeight: 600 }}>{alertItem.timeWindow}</span>
                        </div>
                        {alertItem.detail && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px' }}>📊</span>
                            <span style={{ fontSize: '11px', color: '#374151' }}>{alertItem.detail}</span>
                          </div>
                        )}
                      </div>

                      <div style={{
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        border: '1px solid rgba(0,0,0,0.06)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: alertStyle.color, letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>FARM ACTION</span>
                        <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: '1.5' }}>{alertItem.farmAction}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '32px 24px',
                  backgroundColor: 'rgba(52, 211, 153, 0.05)',
                  border: '1px solid rgba(52, 211, 153, 0.15)',
                  borderRadius: '16px',
                }}>
                  <span style={{ fontSize: '32px' }}>✅</span>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: '12px 0 0', lineHeight: '1.6' }}>
                    No severe weather events predicted in the next 48 hours. Click <strong style={{ color: '#b91c1c' }}>⚡ Simulate Alert</strong> to demo the notification system.
                  </p>
                </div>
              )}
            </div>
          }

          {/* Third Row: Individual Disease Assessments Grid */}
          {risks.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '12px' }}>
              <div style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>Disease Risk Analysis</h3>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>Specific threats identified based on current crop susceptibility models</p>
              </div>

              <div className="risks-grid">
                {risks.map((risk, i) => {
                  const itemStyles = getRiskStyles(risk.risk);
                  return (
                    <div
                      key={i}
                      className="weather-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        backgroundColor: '#ffffff',
                        borderColor: 'rgba(0,0,0,0.08)'
                      }}
                    >
                      {/* Risk Header info */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '24px' }}>{risk.icon}</span>
                          <div>
                            <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: 0 }}>{risk.disease}</h4>
                            <p style={{ fontSize: '11px', color: '#6b7280', margin: '2px 0 0' }}>Susceptible: {risk.crops.join(', ')}</p>
                          </div>
                        </div>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          color: itemStyles.color,
                          backgroundColor: itemStyles.bg,
                          border: `1px solid ${itemStyles.border}`,
                          padding: '3px 10px',
                          borderRadius: '100px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>{risk.risk}</span>
                      </div>

                      {/* Detail conditions triggers explanation */}
                      <div style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        border: '1px solid rgba(0, 0, 0, 0.06)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#6b7280', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>ANALYSIS TRIGGER</span>
                        <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: '1.6' }}>{risk.reason}</p>
                      </div>

                      {/* Environmental match triggers details tags */}
                      {risk.matchDetails && risk.matchDetails.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {risk.matchDetails.map((detail, idx) => (
                            <span key={idx} style={{
                              fontSize: '10px',
                              color: '#6b7280',
                              backgroundColor: 'rgba(0, 0, 0, 0.03)',
                              border: '1px solid rgba(0, 0, 0, 0.08)',
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}>
                              {detail}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Suggested action block */}
                      <div style={{
                        backgroundColor: 'rgba(34, 197, 94, 0.06)',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#15803d', letterSpacing: '0.5px', display: 'block', marginBottom: '4px' }}>RECOMMENDED ACTION PLAN</span>
                        <p style={{ fontSize: '12px', color: '#374151', margin: 0, lineHeight: '1.6' }}>{risk.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clean state layout if no threats present */}
          {risks.length === 0 && (
            <div className="weather-card" style={{ textAlign: 'center', padding: '48px 24px', backgroundColor: 'rgba(52, 211, 153, 0.05)', borderColor: 'rgba(52, 211, 153, 0.15)' }}>
              <span style={{ fontSize: '48px' }}>🌿</span>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#15803d', margin: '16px 0 8px' }}>All Susceptibility Clear</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: 0, lineHeight: '1.6' }}>
                Current weather matrices indicate minimal risk parameters. Continue standard care routines and moisture schedules.
              </p>
            </div>
          )}
        </>
      )}
    </div>

    {/* Toast notification overlay — fixed position, works without browser permission */}
    {toasts.length > 0 && (
      <div style={{
        position: 'fixed',
        top: '72px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '380px',
        width: '100%',
      }}>
        {toasts.map((toast) => {
          const borderColor = toast.severity === 'critical' ? 'rgba(239,68,68,0.5)' : toast.severity === 'success' ? 'rgba(52,211,153,0.5)' : toast.severity === 'info' ? 'rgba(96,165,250,0.5)' : 'rgba(245,158,11,0.5)';
          const glowColor = toast.severity === 'critical' ? 'rgba(239,68,68,0.15)' : toast.severity === 'success' ? 'rgba(52,211,153,0.1)' : toast.severity === 'info' ? 'rgba(96,165,250,0.1)' : 'rgba(245,158,11,0.1)';
          const accentColor = toast.severity === 'critical' ? '#dc2626' : toast.severity === 'success' ? '#15803d' : toast.severity === 'info' ? '#2563eb' : '#b45309';
          return (
            <div
              key={toast.id}
              style={{
                background: 'rgba(255, 255, 255, 0.97)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: `1px solid ${borderColor}`,
                borderRadius: '14px',
                padding: '16px 18px',
                boxShadow: `0 8px 32px ${glowColor}, 0 4px 16px rgba(0,0,0,0.1)`,
                animation: 'toastSlideIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
                cursor: 'pointer',
              }}
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                  animation: 'pulseGlow 1.5s infinite',
                }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827', letterSpacing: '-0.2px' }}>{toast.title}</span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0, lineHeight: '1.5', paddingLeft: '16px' }}>{toast.body}</p>
              <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', paddingLeft: '16px' }}>Click to dismiss</div>
            </div>
          );
        })}
      </div>
    )}
    </>
  );
}

