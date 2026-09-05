import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SOIL_API = `${API_BASE_URL}/api/soil`;
const VENDOR_API = `${API_BASE_URL}/api/vendor`;

const PARAMS = ['n', 'p', 'k', 'ph', 'moisture', 'temperature', 'tds'];

const PARAM_LABEL = {
  n: 'Nitrogen', p: 'Phosphorus', k: 'Potassium', ph: 'pH',
  moisture: 'Moisture', temperature: 'Soil Temp', tds: 'TDS',
};

const STATUS_COLOR = {
  low:     { rgb: '96,165,250', text: 'Low' },
  optimal: { rgb: '52,211,153', text: 'Good' },
  high:    { rgb: '251,146,60', text: 'High' },
};

const RISK_COLOR = { Low: '52,211,153', Medium: '251,146,60', High: '248,113,113' };
const URGENCY_COLOR = { now: '248,113,113', soon: '251,146,60', watch: '148,163,184' };

const cardStyle = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '20px',
};

const sectionTitle = {
  fontSize: '11px', fontWeight: 700, color: '#666',
  textTransform: 'uppercase', letterSpacing: '0.6px', margin: '0 0 10px',
};

function Badge({ rgb, children }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px',
      color: `rgb(${rgb})`, background: `rgba(${rgb},0.12)`,
      border: `1px solid rgba(${rgb},0.3)`,
      borderRadius: '100px', padding: '3px 10px', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

/* A tiny line of where one value has been across every saved test. */
function Sparkline({ values, rgb }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 100, h = 26;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '26px', display: 'block' }}>
      <polyline points={points} fill="none" stroke={`rgb(${rgb})`} strokeWidth="1.5"
        vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export default function SoilAnalysis({ user, farm, tests, autoRunKey }) {
  const [analysis, setAnalysis] = useState(null);
  const [trends, setTrends] = useState(null);
  const [analysedAt, setAnalysedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderingId, setOrderingId] = useState(null);
  const [orderMsg, setOrderMsg] = useState(null);
  const lastAutoRun = useRef(null);
  const navigate = useNavigate();

  const latest = tests?.[0] || null;

  // Show the conclusion already stored on the newest test, so reopening the
  // page costs nothing. A fresh test clears it until the new one comes back.
  useEffect(() => {
    setError('');
    if (latest?.analysis) {
      setAnalysis(latest.analysis);
      setAnalysedAt(latest.analysedAt || null);
    } else {
      setAnalysis(null);
      setAnalysedAt(null);
    }
    setTrends(null);
  }, [latest?.id]);

  const runAnalysis = async () => {
    if (!user?.id || !farm?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${SOIL_API}/analyze`, { farmerId: user.id, farmId: farm.id });
      if (res.data.success) {
        setAnalysis(res.data.analysis);
        setTrends(res.data.trends);
        setAnalysedAt(res.data.analysedAt);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not analyse this soil test.');
    } finally {
      setLoading(false);
    }
  };

  // A newly captured test analyses itself — the farmer never has to ask.
  useEffect(() => {
    if (!autoRunKey || lastAutoRun.current === autoRunKey) return;
    if (!latest || latest.analysis) return;
    lastAutoRun.current = autoRunKey;
    runAnalysis();
    // eslint-disable-next-line
  }, [autoRunKey, latest?.id]);

  // Ordering from here goes through exactly the same vendor broadcast the Orders
  // page uses, so the order shows up and can be tracked in the usual place.
  const handleOrder = async (product) => {
    if (!user?.id) return;
    setOrderingId(product.id);
    setOrderMsg(null);
    try {
      const res = await axios.post(`${VENDOR_API}/orders`, {
        farmerName: user.name,
        farmerPhone: user.phone,
        location: farm?.location || user.fieldLocation || '',
        items: [{
          id: product.id,
          name: product.name,
          category: product.category || 'chemical',
          price: product.price || 0,
          qty: 1,
        }],
      });
      if (res.data.success) {
        // Keep it on the Orders page's recommended shelf too, same as Advisory does.
        try {
          const existing = JSON.parse(localStorage.getItem('fc_advisory_products') || '[]');
          if (!existing.some(p => p.id === product.id)) {
            localStorage.setItem('fc_advisory_products', JSON.stringify([...existing, product]));
          }
        } catch { /* shelf is a nicety, not a requirement */ }
        setOrderMsg({ id: res.data.data.id, name: product.name });
      }
    } catch {
      setOrderMsg({ error: 'Could not place the order. Please try again.' });
    } finally {
      setOrderingId(null);
    }
  };

  if (!latest) return null;

  const historyOldestFirst = [...tests].reverse();

  return (
    <div style={{ ...cardStyle, borderColor: 'rgba(139,92,246,0.2)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '10px', marginBottom: analysis || loading ? '18px' : '12px',
      }}>
        <div>
          <h3 style={{ color: '#fff', fontSize: '15px', fontWeight: 700, margin: '0 0 4px' }}>
            🤖 AI Soil Analysis
          </h3>
          <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
            From your soil numbers, this farm's history and local weather. Soil only — no plant photos involved.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {analysis?.confidence && (
            <Badge rgb={analysis.confidence === 'high' ? '52,211,153' : analysis.confidence === 'medium' ? '251,146,60' : '148,163,184'}>
              {analysis.confidence} confidence
            </Badge>
          )}
          <button
            onClick={runAnalysis}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: loading ? 'rgba(139,92,246,0.35)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
              border: 'none', borderRadius: '9px', color: '#fff',
              fontSize: '12px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? 'Thinking…' : (analysis ? 'Re-analyse' : 'Analyse My Soil')}
          </button>
        </div>
      </div>

      {error && (
        <p style={{
          fontSize: '12px', color: '#f87171', margin: '0 0 12px',
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '8px', padding: '10px 12px',
        }}>{error}</p>
      )}

      {loading && !analysis && (
        <p style={{ color: '#888', fontSize: '13px', margin: 0 }}>
          Reading your soil numbers, history and weather…
        </p>
      )}

      {!loading && !analysis && !error && (
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
          Press "Analyse My Soil" to get advice on this test.
        </p>
      )}

      {analysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          {/* 1. What your soil is like right now */}
          <div>
            <p style={sectionTitle}>Right Now</p>
            <p style={{ color: '#ddd', fontSize: '14px', lineHeight: 1.7, margin: 0 }}>
              {analysis.soilSummary}
            </p>
          </div>

          {/* 2. Each value, judged */}
          {analysis.parameters?.length > 0 && (
            <div>
              <p style={sectionTitle}>Your Readings</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '10px' }}>
                {analysis.parameters.map((param, i) => {
                  const color = STATUS_COLOR[param.status] || STATUS_COLOR.optimal;
                  return (
                    <div key={i} style={{
                      background: `rgba(${color.rgb},0.05)`,
                      border: `1px solid rgba(${color.rgb},0.18)`,
                      borderRadius: '12px', padding: '12px 14px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ color: '#eee', fontSize: '13px', fontWeight: 600 }}>
                          {PARAM_LABEL[param.key] || param.key}
                          {latest.readings?.[param.key] !== undefined && (
                            <span style={{ color: '#777', fontWeight: 500 }}> · {latest.readings[param.key]}</span>
                          )}
                        </span>
                        <Badge rgb={color.rgb}>{color.text}</Badge>
                      </div>
                      <p style={{ color: '#999', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>{param.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. What to fix */}
          {analysis.corrections?.length > 0 && (
            <div>
              <p style={sectionTitle}>What To Do</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.corrections.map((c, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px', padding: '12px 14px',
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: '#eee', fontSize: '13px', fontWeight: 600, margin: '0 0 3px' }}>{c.action}</p>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>{c.why}</p>
                      </div>
                      {c.urgency && <Badge rgb={URGENCY_COLOR[c.urgency] || '148,163,184'}>{c.urgency}</Badge>}
                    </div>

                    {/* Products that actually help with THIS action — orderable on the spot */}
                    {c.products?.length > 0 && (
                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <p style={{ fontSize: '10px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>
                          Product{c.products.length > 1 ? 's' : ''} that can help
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {c.products.map((product) => (
                            <div key={product.id} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              gap: '12px', flexWrap: 'wrap',
                              background: 'rgba(139,92,246,0.05)',
                              border: '1px solid rgba(139,92,246,0.18)',
                              borderRadius: '10px', padding: '10px 12px',
                            }}>
                              <div style={{ flex: 1, minWidth: '160px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                                  <span style={{ color: '#eee', fontSize: '13px', fontWeight: 600 }}>{product.name}</span>
                                  <Badge rgb="148,163,184">{product.category}</Badge>
                                  {product.isOrganic && <Badge rgb="52,211,153">organic</Badge>}
                                </div>
                                {product.whyThis && (
                                  <p style={{ color: '#888', fontSize: '11px', margin: '0 0 3px', lineHeight: 1.5 }}>{product.whyThis}</p>
                                )}
                                <span style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 700 }}>
                                  ₹{product.price}
                                  <span style={{ color: '#666', fontWeight: 500 }}> / {product.unit}</span>
                                </span>
                              </div>
                              <button
                                onClick={() => handleOrder(product)}
                                disabled={orderingId === product.id}
                                style={{
                                  padding: '9px 18px',
                                  background: orderingId === product.id
                                    ? 'rgba(139,92,246,0.35)'
                                    : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                  border: 'none', borderRadius: '9px', color: '#fff',
                                  fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
                                  cursor: orderingId === product.id ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {orderingId === product.id ? 'Ordering…' : 'Order'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {orderMsg && (
            <div style={{
              background: orderMsg.error ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
              border: `1px solid ${orderMsg.error ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`,
              borderRadius: '10px', padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', flexWrap: 'wrap',
            }}>
              <span style={{ color: orderMsg.error ? '#f87171' : '#34d399', fontSize: '13px' }}>
                {orderMsg.error || `✓ ${orderMsg.name} — order #${orderMsg.id} sent to nearby vendors.`}
              </span>
              {!orderMsg.error && (
                <button
                  onClick={() => navigate('/orders')}
                  style={{
                    padding: '7px 14px', background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                    color: '#ccc', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  Track in Orders →
                </button>
              )}
            </div>
          )}

          {/* 4. Crops — either a check on what is growing, or a recommendation */}
          {analysis.currentCropCheck && (
            <div>
              <p style={sectionTitle}>Your Current Crop — {farm.currentCrop}</p>
              <div style={{
                background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)',
                borderRadius: '12px', padding: '14px 16px',
              }}>
                <div style={{ marginBottom: '6px' }}>
                  <Badge rgb={analysis.currentCropCheck.verdict === 'good fit' ? '52,211,153'
                    : analysis.currentCropCheck.verdict === 'poor fit' ? '248,113,113' : '251,146,60'}>
                    {analysis.currentCropCheck.verdict}
                  </Badge>
                </div>
                <p style={{ color: '#ccc', fontSize: '13px', margin: 0, lineHeight: 1.7 }}>
                  {analysis.currentCropCheck.why}
                </p>
              </div>
            </div>
          )}

          {analysis.cropRecommendations?.length > 0 && (
            <div>
              <p style={sectionTitle}>
                {analysis.cropMode === 'check' ? 'Other Crops That Suit This Soil' : 'Best Crops For This Soil'}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {analysis.cropRecommendations.map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.15)',
                    borderRadius: '10px', padding: '12px 14px',
                  }}>
                    <span style={{
                      flexShrink: 0, width: '22px', height: '22px', borderRadius: '50%',
                      background: 'rgba(52,211,153,0.15)', color: '#34d399',
                      fontSize: '11px', fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#eee', fontSize: '13px', fontWeight: 600, margin: '0 0 3px' }}>{c.crop}</p>
                      <p style={{ color: '#888', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>{c.why}</p>
                    </div>
                    {c.fit && <Badge rgb={c.fit === 'good' ? '52,211,153' : '251,146,60'}>{c.fit}</Badge>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. Risk — never a diagnosis */}
          {analysis.risk && (
            <div>
              <p style={sectionTitle}>Risk Check</p>
              <div style={{
                background: `rgba(${RISK_COLOR[analysis.risk.level] || '148,163,184'},0.05)`,
                border: `1px solid rgba(${RISK_COLOR[analysis.risk.level] || '148,163,184'},0.22)`,
                borderRadius: '12px', padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <Badge rgb={RISK_COLOR[analysis.risk.level] || '148,163,184'}>{analysis.risk.level} risk</Badge>
                  <span style={{ color: '#ccc', fontSize: '13px' }}>{analysis.risk.summary}</span>
                </div>
                {analysis.risk.issues?.map((issue, i) => (
                  <div key={i} style={{
                    marginTop: '10px', paddingTop: '10px',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}>
                    <p style={{ color: '#eee', fontSize: '13px', fontWeight: 600, margin: '0 0 4px' }}>{issue.name}</p>
                    <p style={{ color: '#888', fontSize: '12px', margin: '0 0 4px', lineHeight: 1.6 }}>{issue.why}</p>
                    <p style={{ color: '#34d399', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>→ {issue.prevention}</p>
                  </div>
                ))}
                <p style={{ color: '#555', fontSize: '11px', margin: '12px 0 0', lineHeight: 1.5 }}>
                  This is a risk estimate from soil and weather, not a confirmed disease.
                </p>
              </div>
            </div>
          )}

          {/* 6. Next season */}
          {analysis.future && (
            <div>
              <p style={sectionTitle}>Planning Ahead</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px,1fr))', gap: '10px' }}>
                {analysis.future.nextSeason?.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 700, margin: '0 0 8px' }}>Next Season</p>
                    {analysis.future.nextSeason.map((n, i) => (
                      <div key={i} style={{ marginBottom: '8px' }}>
                        <p style={{ color: '#eee', fontSize: '13px', fontWeight: 600, margin: '0 0 2px' }}>{n.crop}</p>
                        <p style={{ color: '#888', fontSize: '12px', margin: 0, lineHeight: 1.6 }}>{n.why}</p>
                      </div>
                    ))}
                  </div>
                )}
                {analysis.future.prepare?.length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ color: '#a78bfa', fontSize: '12px', fontWeight: 700, margin: '0 0 8px' }}>Prepare Before Sowing</p>
                    <ul style={{ margin: 0, paddingLeft: '18px', color: '#999', fontSize: '12px', lineHeight: 1.8 }}>
                      {analysis.future.prepare.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 7. The farm's own soil profile, built up over tests */}
          {analysis.soilProfile && (
            <div>
              <p style={sectionTitle}>{farm.name} — Soil Profile</p>
              <div style={{
                background: 'rgba(139,92,246,0.04)', border: '1px solid rgba(139,92,246,0.18)',
                borderRadius: '12px', padding: '16px',
              }}>
                <p style={{ color: '#eee', fontSize: '14px', fontWeight: 600, margin: '0 0 12px', lineHeight: 1.6 }}>
                  {analysis.soilProfile.characterisation}
                </p>
                {[
                  ['Nutrients', analysis.soilProfile.nutrientPattern],
                  ['pH', analysis.soilProfile.phBehaviour],
                  ['Moisture', analysis.soilProfile.moistureBehaviour],
                  ['Trend', analysis.soilProfile.trend],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ flexShrink: 0, width: '72px', color: '#666', fontSize: '12px' }}>{label}</span>
                    <span style={{ color: '#bbb', fontSize: '12px', lineHeight: 1.6 }}>{value}</span>
                  </div>
                ))}
                {analysis.soilProfile.note && (
                  <p style={{ color: '#555', fontSize: '11px', margin: '12px 0 0', lineHeight: 1.5 }}>
                    {analysis.soilProfile.note}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 8. Where each value has been, test by test */}
          {historyOldestFirst.length >= 2 && (
            <div>
              <p style={sectionTitle}>Trends Across {historyOldestFirst.length} Tests</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: '10px' }}>
                {PARAMS.map((key) => {
                  const values = historyOldestFirst.map(t => t.readings[key]).filter(Number.isFinite);
                  if (values.length < 2) return null;
                  const first = values[0];
                  const last = values[values.length - 1];
                  const change = last - first;
                  const pct = first !== 0 ? (change / Math.abs(first)) * 100 : 0;
                  const steady = Math.abs(pct) < 5;
                  const rgb = steady ? '148,163,184' : (change > 0 ? '52,211,153' : '251,146,60');
                  return (
                    <div key={key} style={{
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '10px', padding: '10px 12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <span style={{ color: '#999', fontSize: '11px', fontWeight: 600 }}>{PARAM_LABEL[key]}</span>
                        <span style={{ color: `rgb(${rgb})`, fontSize: '11px', fontWeight: 700 }}>
                          {steady ? 'steady' : `${change > 0 ? '↑' : '↓'} ${Math.abs(change).toFixed(1)}`}
                        </span>
                      </div>
                      <Sparkline values={values} rgb={rgb} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                        <span style={{ color: '#555', fontSize: '10px' }}>{first}</span>
                        <span style={{ color: '#888', fontSize: '10px', fontWeight: 600 }}>{last}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {analysedAt && (
            <p style={{ color: '#444', fontSize: '11px', margin: 0 }}>
              Analysed {new Date(analysedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              {' · '}based on {tests.length} saved test{tests.length > 1 ? 's' : ''} for {farm.name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
