import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import AgriIcon from '../components/AgriIcon';

const VENDOR_API = `${API_BASE_URL}/api/vendor`;

const CATEGORY_META = {
  fungicide: { label: 'Fungicide', color: '#2563eb' },
  fertilizer: { label: 'Fertilizer', color: '#15803d' },
  insecticide: { label: 'Insecticide', color: '#b45309' },
  biostimulant: { label: 'Biostimulant', color: '#059669' },
  chemical: { label: 'Chemical', color: '#7c3aed' },
};

const getCategoryMeta = (category) =>
  CATEGORY_META[category] || { label: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Product', color: '#2563eb' };

export default function Orders({ user, onLogin }) {
  const navigate = useNavigate();

  // ── AI-recommended products (persisted from Advisory/Treatment) ──
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  // ── Full product catalog (live from backend) ──
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [qtyMap, setQtyMap] = useState({});

  // ── Live vendor network (broadcast targets) ──
  const [vendorShops, setVendorShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(true);

  // ── Orders ──
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [selectedInstruction, setSelectedInstruction] = useState(null);
  const [orderingId, setOrderingId] = useState(null);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState(null);

  // Delivery form state
  const [deliveryModal, setDeliveryModal] = useState(null); // order object or null
  const [deliveryForm, setDeliveryForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    landmark: '',
    pincode: '',
    paymentMode: 'cod',
  });
  const [submittingDelivery, setSubmittingDelivery] = useState(false);

  // Load persistent AI recommended products
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fc_advisory_products');
      if (stored) {
        setRecommendedProducts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to parse recommended products:", e);
    }
  }, []);

  // Load the full product catalog so farmers can order without needing an AI diagnosis first
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/products`);
        if (res.data && res.data.success) {
          setCatalogProducts(res.data.data);
          setCatalogError(false);
        }
      } catch (err) {
        console.error('Failed to fetch product catalog:', err);
        setCatalogError(true);
      } finally {
        setCatalogLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // Load the live vendor network — the shops your order broadcasts get sent to
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axios.get(`${VENDOR_API}/shops`);
        if (res.data && res.data.success) {
          setVendorShops(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch vendor network:', err);
      } finally {
        setShopsLoading(false);
      }
    };
    fetchShops();
  }, []);

  // Fetch Live Farmer Orders & Poll every 3 seconds
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${VENDOR_API}/orders`);
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Dashboard stats derived from live orders ──
  const stats = useMemo(() => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const confirmed = orders.filter(o => o.status === 'confirmed').length;
    const ready = orders.filter(o => o.status === 'ready').length;
    const totalSpent = orders
      .filter(o => o.status !== 'rejected')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return { total: orders.length, pending, confirmed, ready, totalSpent };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter(o => o.status === statusFilter);
  }, [orders, statusFilter]);

  const getQty = (id) => qtyMap[id] || 1;
  const setQty = (id, val) => {
    const next = Math.max(1, Math.min(99, val));
    setQtyMap(prev => ({ ...prev, [id]: next }));
  };

  // Place Order Action (Broadcast to all nearby shops)
  const handlePlaceOrder = async (product, qty = 1) => {
    if (!user) {
      if (onLogin) onLogin();
      return;
    }
    setOrderingId(product.id);
    try {
      const res = await axios.post(`${VENDOR_API}/orders`, {
        farmerName: user.name,
        farmerPhone: user.phone,
        location: user.fieldLocation || '',
        items: [{
          id: product.id || 'P-ITEM',
          name: product.name,
          category: product.category || 'chemical',
          price: product.price || 350,
          qty: qty || 1
        }]
      });

      if (res.data.success) {
        setOrderSuccessMsg(`Order #${res.data.data.id} broadcasted to ${vendorShops.length || 'nearby'} vendors.`);
        setTimeout(() => setOrderSuccessMsg(null), 4000);
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to place order:", err);
      setOrderSuccessMsg('Could not place this order. Please try again.');
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } finally {
      setOrderingId(null);
    }
  };

  // Cancel Order Action
  const handleCancelOrder = async (orderId) => {
    try {
      // Immediately remove from UI for instant response
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setOrderSuccessMsg(`Order #${orderId} has been cancelled.`);
      setTimeout(() => setOrderSuccessMsg(null), 3000);

      await axios.delete(`${VENDOR_API}/orders/${orderId}`);
    } catch (err) {
      console.error("Failed to cancel order:", err);
      fetchOrders();
    }
  };

  // ── Vendor-side actions ──
  // There's no separate vendor app in this project, so these are the explicit,
  // deliberate actions that move an order forward — no background timer, no
  // random shop assignment. Confirming requires picking an actual shop from
  // the live vendor network fetched above.
  const [pickerOrderId, setPickerOrderId] = useState(null); // order currently choosing a vendor
  const [confirmingId, setConfirmingId] = useState(null);
  const [readyingId, setReadyingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const handleConfirmStock = async (orderId, shopId) => {
    setConfirmingId(orderId);
    try {
      const res = await axios.patch(`${VENDOR_API}/orders/${orderId}/confirm`, { shopId });
      if (res.data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.data.data : o));
        setPickerOrderId(null);
      }
    } catch (err) {
      console.error('Failed to confirm order:', err);
      setOrderSuccessMsg(err.response?.data?.message || 'Could not confirm this order.');
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    setReadyingId(orderId);
    try {
      const res = await axios.patch(`${VENDOR_API}/orders/${orderId}/ready`);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.data.data : o));
      }
    } catch (err) {
      console.error('Failed to mark order ready:', err);
      setOrderSuccessMsg(err.response?.data?.message || 'Could not update this order.');
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } finally {
      setReadyingId(null);
    }
  };

  const handleRejectOrder = async (orderId) => {
    setRejectingId(orderId);
    try {
      const res = await axios.patch(`${VENDOR_API}/orders/${orderId}/reject`);
      if (res.data.success) {
        setOrders(prev => prev.map(o => o.id === orderId ? res.data.data : o));
      }
    } catch (err) {
      console.error('Failed to reject order:', err);
      setOrderSuccessMsg(err.response?.data?.message || 'Could not update this order.');
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } finally {
      setRejectingId(null);
    }
  };

  // Open delivery form modal
  const openDeliveryModal = (order) => {
    setDeliveryForm({
      fullName: user?.name || order.farmerName || '',
      phone: user?.phone || order.farmerPhone || '',
      address: order.location || '',
      landmark: '',
      pincode: '',
      paymentMode: 'cod',
    });
    setDeliveryModal(order);
  };

  // Submit delivery form — save delivery info to order and update UI
  const handleDeliverySubmit = async (e) => {
    e.preventDefault();
    setSubmittingDelivery(true);

    try {
      // Save delivery info to the order on the server so the claiming vendor can see it too
      await axios.patch(`${VENDOR_API}/orders/${deliveryModal.id}/delivery`, deliveryForm);

      setOrderSuccessMsg(`Delivery confirmed for Order #${deliveryModal.id}! Track route below.`);
      setTimeout(() => setOrderSuccessMsg(null), 5000);
      setDeliveryModal(null);
      fetchOrders();
    } catch (err) {
      console.error("Failed to confirm delivery:", err);
      setOrderSuccessMsg('Could not confirm delivery. Please try again.');
      setTimeout(() => setOrderSuccessMsg(null), 4000);
    } finally {
      setSubmittingDelivery(false);
    }
  };

  // Navigate to Treatment map to track the vendor-to-you delivery route, same as equipment tracking
  const navigateToRoute = (order) => {
    const delivery = getDeliveryInfo(order);
    const shopName = order.claimedByShopName || order.shopName || '';
    const destParams = delivery?.location
      ? `&destLat=${delivery.location.lat}&destLng=${delivery.location.lng}`
      : '';
    navigate(
      `/treatment?trackOrder=${order.id}&shopId=${order.claimedByShopId || ''}` +
      `&shopName=${encodeURIComponent(shopName)}` +
      `&phone=${encodeURIComponent(delivery?.phone || order.farmerPhone || '')}` +
      `&bookedAt=${encodeURIComponent(delivery?.confirmedAt || '')}` +
      destParams
    );
  };

  // Check if delivery was confirmed for an order — prefer the server copy (visible to the
  // vendor too); fall back to the old localStorage-only entry for orders confirmed before
  // delivery details were saved server-side.
  const getDeliveryInfo = (order) => {
    if (order.delivery) return order.delivery;
    try {
      const stored = localStorage.getItem(`fc_delivery_${order.id}`);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  };

  const openInstructions = (prod) => setSelectedInstruction({
    name: prod.name,
    dosage: prod.dosage,
    category: prod.category,
    precautions: prod.precautions || null,
    whyThis: prod.whyThis,
    application: prod.applicationWindow
      ? `Apply during: ${prod.applicationWindow}. Re-entry interval: ${prod.reEntryInterval || 'as directed'}.`
      : `Apply ${prod.name} (${prod.activeIngredient}) as directed for targeted crop protection.`
  });

  const catalogCategories = useMemo(() => {
    const cats = new Set(catalogProducts.map(p => p.category));
    return ['all', ...Array.from(cats)];
  }, [catalogProducts]);

  const visibleCatalog = activeCategory === 'all'
    ? catalogProducts
    : catalogProducts.filter(p => p.category === activeCategory);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }} className="animate-fade-up">
      <style>{`
        .orders-card {
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(37, 99, 235, 0.12);
          border-radius: 16px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(37, 99, 235, 0.05), 0 1px 3px rgba(0,0,0,0.06);
        }
        .orders-card:hover {
          border-color: rgba(37, 99, 235, 0.28);
          box-shadow: 0 12px 32px rgba(37, 99, 235, 0.12);
          transform: translateY(-2px);
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }
        .catalog-grid, .product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }
        .vendor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        .cat-tab {
          border: 1px solid rgba(37, 99, 235, 0.18);
          background: rgba(255,255,255,0.75);
          color: #1e3a8a;
          padding: 7px 16px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .cat-tab:hover {
          border-color: rgba(37, 99, 235, 0.4);
          background: rgba(37, 99, 235, 0.08);
        }
        .cat-tab.active {
          background: #2563eb;
          border-color: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
        }
        .qty-btn {
          width: 26px; height: 26px; border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.14); background: #fff;
          color: #111827; font-size: 14px; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s ease;
        }
        .qty-btn:hover { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.3); }
        .live-dot {
          width: 8px; height: 8px; border-radius: 50%; background: #22c55e;
          box-shadow: 0 0 0 rgba(34,197,94,0.5);
          animation: liveDotPulse 1.8s infinite;
          display: inline-block;
        }
        @keyframes liveDotPulse {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        @media (max-width: 640px) {
          .catalog-grid, .product-grid, .vendor-grid { grid-template-columns: 1fr; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* Success / Error Notification Banner */}
      {orderSuccessMsg && (
        <div className="orders-card" style={{
          backgroundColor: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.35)',
          padding: '14px 18px',
          color: '#15803d',
          fontSize: '14px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AgriIcon name="check-circle" size={17} color="#15803d" />
          <span>{orderSuccessMsg}</span>
        </div>
      )}

      {/* ── DASHBOARD STAT BOXES ── */}
      <div className="stat-grid">
        {[
          { key: 'all', label: 'Total Orders', value: stats.total, icon: 'package', color: '#2563eb' },
          { key: 'pending', label: 'Awaiting Confirmation', value: stats.pending, icon: 'clock', color: '#b45309' },
          { key: 'confirmed', label: 'Stock Confirmed', value: stats.confirmed, icon: 'check-circle', color: '#15803d' },
          { key: 'ready', label: 'Ready / Out for Delivery', value: stats.ready, icon: 'truck', color: '#1d4ed8' },
        ].map(card => (
          <button
            key={card.key}
            type="button"
            onClick={() => setStatusFilter(prev => prev === card.key ? 'all' : card.key)}
            className="orders-card"
            style={{
              padding: '18px',
              textAlign: 'left',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              border: statusFilter === card.key ? `1.5px solid ${card.color}` : undefined,
              boxShadow: statusFilter === card.key ? `0 8px 24px ${card.color}33` : undefined,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <AgriIcon name={card.icon} size={20} color={card.color} strokeWidth={1.6} />
              {statusFilter === card.key && (
                <span style={{ fontSize: '9px', fontWeight: 700, color: card.color, backgroundColor: `${card.color}1a`, padding: '2px 8px', borderRadius: '100px' }}>FILTERING</span>
              )}
            </div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: '#374151', fontWeight: 700 }}>{card.label}</div>
          </button>
        ))}
        <div className="orders-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <AgriIcon name="coin" size={20} color="#15803d" strokeWidth={1.6} />
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#15803d', letterSpacing: '-0.5px' }}>₹{stats.totalSpent}</div>
          <div style={{ fontSize: '13px', color: '#374151', fontWeight: 700 }}>Total Spent (Active Orders)</div>
        </div>
      </div>

      {/* ── SECTION 1: AI-RECOMMENDED PRODUCTS READY TO ORDER ── */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
            Recommended Products for Your Crop
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
            Directly recommended by AI Advisory based on your latest diagnosis
          </p>
        </div>

        {recommendedProducts.length === 0 ? (
          <div className="orders-card" style={{
            borderStyle: 'dashed',
            padding: '32px',
            textAlign: 'center',
            color: '#4b5563',
            fontSize: '13px',
            lineHeight: 1.6,
          }}>
            No recommended products yet. Upload a crop photo in <strong style={{ color: '#111827' }}>AI Advisory</strong> or select a disease in <strong style={{ color: '#111827' }}>Treatment</strong> to see targeted chemical recommendations here — or browse the <strong style={{ color: '#111827' }}>full product catalog</strong> below.
          </div>
        ) : (
          <div className="product-grid">
            {recommendedProducts.map((prod) => {
              const meta = getCategoryMeta(prod.category);
              return (
                <div key={prod.id} className="orders-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: meta.color, textTransform: 'uppercase',
                        backgroundColor: `${meta.color}1a`, border: `1px solid ${meta.color}40`,
                        padding: '2px 8px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {prod.category}
                      </span>
                      <span style={{ fontSize: '16px', fontWeight: 700, color: '#15803d' }}>₹{prod.price}</span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>{prod.name}</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', margin: '0 0 8px' }}>{prod.activeIngredient}</p>
                    {prod.dosage && (
                      <p style={{ fontSize: '12px', color: '#374151', margin: 0 }}>
                        Dose: <strong>{prod.dosage}</strong>
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <button
                      type="button"
                      onClick={() => openInstructions(prod)}
                      className="instruction-btn"
                      style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                    >
                      Usage Instructions
                    </button>

                    <button
                      type="button"
                      disabled={orderingId === prod.id}
                      onClick={() => handlePlaceOrder(prod, 1)}
                      style={{
                        flex: 1,
                        backgroundColor: '#10b981',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: orderingId === prod.id ? 'default' : 'pointer',
                        opacity: orderingId === prod.id ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {orderingId === prod.id ? 'Ordering...' : 'Order Product'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 2: FULL PRODUCT CATALOG — browse & order anything, anytime ── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
              Full Product Catalog
            </h2>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
              Verified fungicides, fertilizers, insecticides & biostimulants — order any of these directly
            </p>
          </div>
          {catalogCategories.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {catalogCategories.map(cat => {
                const meta = cat === 'all' ? { label: 'All' } : getCategoryMeta(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {catalogLoading ? (
          <div className="orders-card" style={{ padding: '40px', textAlign: 'center', color: '#4b5563', fontSize: '13px' }}>
            Loading product catalog...
          </div>
        ) : catalogError ? (
          <div className="orders-card" style={{ padding: '32px', textAlign: 'center', color: '#b45309', fontSize: '13px' }}>
            Could not load the product catalog right now. Please refresh to try again.
          </div>
        ) : visibleCatalog.length === 0 ? (
          <div className="orders-card" style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontSize: '13px' }}>
            No products in this category.
          </div>
        ) : (
          <div className="catalog-grid">
            {visibleCatalog.map((prod) => {
              const meta = getCategoryMeta(prod.category);
              const qty = getQty(prod.id);
              return (
                <div key={prod.id} className="orders-card" style={{ padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: meta.color, textTransform: 'uppercase',
                        backgroundColor: `${meta.color}1a`, border: `1px solid ${meta.color}40`,
                        padding: '2px 8px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '4px'
                      }}>
                        {meta.label}
                      </span>
                      {prod.verified && (
                        <span style={{ fontSize: '9px', fontWeight: 700, color: '#15803d', backgroundColor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', padding: '2px 7px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <AgriIcon name="check" size={10} color="#15803d" strokeWidth={2.4} /> VERIFIED
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#111827', margin: '0 0 4px' }}>{prod.name}</h3>
                    <p style={{ fontSize: '12px', color: '#6b7280', fontStyle: 'italic', margin: '0 0 8px' }}>{prod.activeIngredient}</p>
                    <p style={{ fontSize: '12px', color: '#374151', margin: '0 0 8px', lineHeight: 1.5 }}>{prod.whyThis}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', color: '#6b7280' }}>{prod.unit}</span>
                      <span style={{ fontSize: '17px', fontWeight: 700, color: '#15803d' }}>₹{prod.price}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="button" onClick={() => openInstructions(prod)} className="instruction-btn" style={{ flex: 1, padding: '8px 10px', fontSize: '11px' }}>
                        Usage Info
                      </button>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(0,0,0,0.14)', borderRadius: '8px', padding: '2px 6px' }}>
                        <button type="button" className="qty-btn" onClick={() => setQty(prod.id, qty - 1)}>−</button>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#111827', minWidth: '16px', textAlign: 'center' }}>{qty}</span>
                        <button type="button" className="qty-btn" onClick={() => setQty(prod.id, qty + 1)}>+</button>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={orderingId === prod.id}
                      onClick={() => handlePlaceOrder(prod, qty)}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '9px 12px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: orderingId === prod.id ? 'default' : 'pointer',
                        opacity: orderingId === prod.id ? 0.7 : 1,
                        boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                        transition: 'all 0.15s'
                      }}
                    >
                      {orderingId === prod.id ? 'Ordering...' : `Order Now · ₹${prod.price * qty}`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── SECTION 3: ORDERS & LIVE VENDOR BROADCASTS ── */}
      <div>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: 0, letterSpacing: '-0.3px' }}>
            My Orders & Live Vendor Broadcasts
          </h2>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
            Real-time status updates broadcasted to nearby agro suppliers
          </p>
        </div>

        {/* Live Vendor Network — the actual broadcast targets, always visible so the
            page shows the network is real even before any order has been placed */}
        <div className="orders-card" style={{ padding: '18px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span className="live-dot" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#111827' }}>
              Live Vendor Network — {shopsLoading ? '…' : vendorShops.length} shops listening for orders
            </span>
          </div>

          {shopsLoading ? (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Connecting to vendor network...</div>
          ) : vendorShops.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#6b7280' }}>No vendors registered on the network yet.</div>
          ) : (
            <div className="vendor-grid">
              {vendorShops.slice(0, 8).map(shop => (
                <div key={shop.id} style={{
                  backgroundColor: 'rgba(37,99,235,0.05)',
                  border: '1px solid rgba(37,99,235,0.15)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="live-dot" style={{ width: '6px', height: '6px' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#111827', lineHeight: 1.3 }}>{shop.name}</span>
                  </div>
                  {shop.phone ? (
                    <a href={`tel:${shop.phone.replace(/\s+/g, '')}`} style={{ fontSize: '11px', color: '#2563eb', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <AgriIcon name="phone" size={11} color="#2563eb" strokeWidth={2} /> {shop.phone}
                    </a>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>Reachable via order broadcast</span>
                  )}
                </div>
              ))}
            </div>
          )}
          {vendorShops.length > 8 && (
            <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '10px' }}>
              + {vendorShops.length - 8} more vendors on the network
            </div>
          )}
        </div>

        {statusFilter !== 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280' }}>
              Showing <strong style={{ color: '#111827' }}>{statusFilter}</strong> orders only
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              style={{ fontSize: '11px', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, textDecoration: 'underline' }}
            >
              Clear filter
            </button>
          </div>
        )}

        {loading ? (
          <div className="orders-card" style={{ padding: '40px', textAlign: 'center', color: '#4b5563', fontSize: '13px' }}>
            Loading orders...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="orders-card" style={{
            borderStyle: 'dashed',
            padding: '40px',
            textAlign: 'center',
            color: '#4b5563',
            fontSize: '13px',
            lineHeight: 1.6,
          }}>
            {orders.length === 0 ? (
              <>No orders placed yet. Click <strong style={{ color: '#111827' }}>"Order Product"</strong> above to broadcast to local vendors.</>
            ) : (
              <>No orders match this filter.</>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredOrders.map((order) => {
              const activeShopName = order.claimedByShopName || order.shopName || 'Broadcast to Nearby Vendors';
              const delivery = getDeliveryInfo(order);
              const statusMeta = {
                pending: { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#b45309' },
                confirmed: { bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', color: '#15803d' },
                ready: { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', color: '#1d4ed8' },
                rejected: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', color: '#b91c1c' },
              }[order.status] || { bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.12)', color: '#374151' };

              return (
                <div key={order.id} className="orders-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Order Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#15803d' }}>{order.id}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#1f2937' }}>{activeShopName}</span>
                    </div>

                    {/* Status Badge — inline styled so it always renders correctly regardless of global CSS */}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.4px',
                      color: statusMeta.color,
                      backgroundColor: statusMeta.bg,
                      border: `1px solid ${statusMeta.border}`,
                      padding: '4px 10px',
                      borderRadius: '100px',
                      textTransform: 'uppercase',
                    }}>
                      {order.status === 'pending' && 'Order Broadcasted · Checking Stock'}
                      {order.status === 'confirmed' && `Stock Confirmed by ${order.claimedByShopName || order.shopName}`}
                      {order.status === 'ready' && (delivery ? 'Delivery Confirmed' : 'Ready for Pickup')}
                      {order.status === 'rejected' && 'Out of Stock'}
                    </span>
                  </div>

                  {/* Items & Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Requested Items:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {order.items.map((item, idx) => (
                          <span key={idx} style={{
                            backgroundColor: 'rgba(0,0,0,0.04)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '12px',
                            color: '#111827',
                            fontWeight: 500
                          }}>
                            {item.name} {item.qty > 1 ? `x${item.qty}` : ''} — <strong style={{ color: '#15803d' }}>₹{item.price}</strong>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>Total Amount:</div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>₹{order.totalAmount}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {order.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setPickerOrderId(prev => prev === order.id ? null : order.id)}
                              style={{
                                backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
                                color: '#1d4ed8', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 0.15s',
                              }}
                            >
                              Mark Stock Confirmed
                            </button>
                            <button
                              type="button"
                              disabled={rejectingId === order.id}
                              onClick={() => handleRejectOrder(order.id)}
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.14)',
                                color: '#6b7280', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600,
                                cursor: rejectingId === order.id ? 'default' : 'pointer', opacity: rejectingId === order.id ? 0.6 : 1,
                              }}
                            >
                              {rejectingId === order.id ? 'Updating...' : 'Out of Stock'}
                            </button>
                          </>
                        )}

                        {order.status === 'confirmed' && (
                          <button
                            type="button"
                            disabled={readyingId === order.id}
                            onClick={() => handleMarkReady(order.id)}
                            style={{
                              backgroundColor: '#2563eb', border: 'none', color: '#fff',
                              borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                              cursor: readyingId === order.id ? 'default' : 'pointer', opacity: readyingId === order.id ? 0.7 : 1,
                              boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s',
                            }}
                          >
                            {readyingId === order.id ? 'Updating...' : 'Mark Ready for Delivery'}
                          </button>
                        )}

                        {order.status === 'ready' && !delivery && (
                          <button
                            type="button"
                            onClick={() => openDeliveryModal(order)}
                            style={{
                              backgroundColor: '#10b981', border: 'none', color: '#fff',
                              borderRadius: '10px', padding: '6px 14px', fontSize: '12px', fontWeight: 700,
                              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                              boxShadow: '0 4px 14px rgba(16,185,129,0.3)', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.target.style.backgroundColor = '#059669'; e.target.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.target.style.backgroundColor = '#10b981'; e.target.style.transform = 'translateY(0)'; }}
                          >
                            Confirm Delivery
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order.id)}
                          style={{
                            backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#b91c1c', borderRadius: '8px', padding: '4px 12px', fontSize: '11px', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s', display: 'inline-flex', alignItems: 'center', gap: '4px'
                          }}
                          onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.25)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)'; }}
                          onMouseLeave={e => { e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'; e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)'; }}
                        >
                          Cancel Order
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Vendor picker — choosing a real shop from the live network is what
                      actually confirms the order; there is no random assignment. */}
                  {pickerOrderId === order.id && (
                    <div style={{
                      backgroundColor: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: '12px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px',
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.4px' }}>
                        WHICH VENDOR CONFIRMED THIS?
                      </span>
                      {vendorShops.length === 0 ? (
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>No vendors on the network yet.</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {vendorShops.map(shop => (
                            <button
                              key={shop.id}
                              type="button"
                              disabled={confirmingId === order.id}
                              onClick={() => handleConfirmStock(order.id, shop.id)}
                              style={{
                                backgroundColor: '#fff', border: '1px solid rgba(37,99,235,0.3)',
                                color: '#1d4ed8', borderRadius: '8px', padding: '6px 12px', fontSize: '11px', fontWeight: 600,
                                cursor: confirmingId === order.id ? 'default' : 'pointer', opacity: confirmingId === order.id ? 0.6 : 1,
                              }}
                            >
                              {shop.name}
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setPickerOrderId(null)}
                        style={{ alignSelf: 'flex-start', background: 'none', border: 'none', color: '#6b7280', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Delivery info card — shown after confirming delivery */}
                  {delivery && order.status === 'ready' && (
                    <div style={{
                      backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: '10px',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.5px', marginBottom: '4px' }}>DELIVERY DETAILS</div>
                        <div style={{ fontSize: '12px', color: '#374151', lineHeight: 1.6 }}>
                          <strong>{delivery.fullName}</strong> · {delivery.phone}<br />
                          {delivery.address}{delivery.landmark ? `, ${delivery.landmark}` : ''}{delivery.pincode ? ` - ${delivery.pincode}` : ''}<br />
                          Payment: <strong style={{ color: '#15803d' }}>{delivery.paymentMode === 'cod' ? 'Cash on Delivery' : 'Pay at Store'}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigateToRoute(order)}
                        style={{
                          backgroundColor: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)',
                          color: '#1d4ed8', borderRadius: '12px', padding: '10px 18px', fontSize: '20px', fontWeight: 700,
                          cursor: 'pointer', transition: 'all 0.2s', lineHeight: 1,
                        }}
                        onMouseEnter={e => { e.target.style.backgroundColor = 'rgba(59,130,246,0.3)'; e.target.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => { e.target.style.backgroundColor = 'rgba(59,130,246,0.15)'; e.target.style.transform = 'scale(1)'; }}
                        title="Track vendor-to-you route on map"
                      >
                        →
                      </button>
                    </div>
                  )}

                  {/* Dynamic Explanatory Footer based on status */}
                  {order.status === 'pending' && (
                    <div style={{
                      backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#b45309',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fbbf24', display: 'inline-block' }} />
                      Order broadcasted to {vendorShops.length || 'the'} vendors on the network. Use <strong>Mark Stock Confirmed</strong> once a real vendor gets back to you.
                    </div>
                  )}

                  {order.status === 'confirmed' && (
                    <div style={{
                      backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                      borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#15803d', fontWeight: 500
                    }}>
                      Stock confirmed by <strong>{order.claimedByShopName || order.shopName}</strong>.{' '}
                      {order.shopPhone
                        ? <>Ready for pickup or call <strong>{order.shopPhone}</strong>.</>
                        : 'Ready for pickup. Contact number not shared by this vendor yet.'}
                    </div>
                  )}

                  {order.status === 'ready' && !delivery && (
                    <div style={{
                      backgroundColor: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
                      borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#1d4ed8', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <AgriIcon name="truck" size={15} color="#1d4ed8" strokeWidth={1.8} />
                      Your order is ready. Click <strong style={{ margin: '0 3px' }}>Confirm Delivery</strong> to fill in delivery details and track the route from vendor to your location.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DELIVERY ORDER FORM MODAL ── */}
      {deliveryModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            backgroundColor: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setDeliveryModal(null)}
        >
          <form
            onSubmit={handleDeliverySubmit}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '480px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <AgriIcon name="truck" size={19} color="#111827" strokeWidth={1.6} />
                  <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#111827', margin: 0 }}>Confirm Delivery</h3>
                </div>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Order <strong style={{ color: '#15803d' }}>#{deliveryModal.id}</strong> · {deliveryModal.claimedByShopName || deliveryModal.shopName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeliveryModal(null)}
                style={{
                  background: 'rgba(0,0,0,0.05)', border: 'none', color: '#6b7280',
                  borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer',
                  fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Order Summary */}
            <div style={{
              backgroundColor: 'rgba(0,0,0,0.03)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: '12px',
              padding: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                {deliveryModal.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '13px', color: '#1f2937', fontWeight: 500 }}>
                    {item.name} x{item.qty || 1}
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#15803d' }}>₹{deliveryModal.totalAmount}</div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', letterSpacing: '0.3px' }}>FULL NAME *</label>
                <input
                  type="text"
                  required
                  value={deliveryForm.fullName}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, fullName: e.target.value })}
                  placeholder="e.g. Harsh Kumar"
                  style={{
                    width: '100%', backgroundColor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.14)', borderRadius: '10px',
                    padding: '10px 14px', color: '#111827', fontSize: '13px',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.14)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', letterSpacing: '0.3px' }}>PHONE NUMBER *</label>
                <input
                  type="tel"
                  required
                  value={deliveryForm.phone}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%', backgroundColor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.14)', borderRadius: '10px',
                    padding: '10px 14px', color: '#111827', fontSize: '13px',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.14)'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', letterSpacing: '0.3px' }}>DELIVERY ADDRESS *</label>
                <input
                  type="text"
                  required
                  value={deliveryForm.address}
                  onChange={(e) => setDeliveryForm({ ...deliveryForm, address: e.target.value })}
                  placeholder="Village, Town/City, District"
                  style={{
                    width: '100%', backgroundColor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.14)', borderRadius: '10px',
                    padding: '10px 14px', color: '#111827', fontSize: '13px',
                    outline: 'none', transition: 'border-color 0.2s',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.14)'}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', letterSpacing: '0.3px' }}>LANDMARK</label>
                  <input
                    type="text"
                    value={deliveryForm.landmark}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, landmark: e.target.value })}
                    placeholder="Near temple, bus stop..."
                    style={{
                      width: '100%', backgroundColor: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.14)', borderRadius: '10px',
                      padding: '10px 14px', color: '#111827', fontSize: '13px',
                      outline: 'none', transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.14)'}
                  />
                </div>
                <div style={{ flex: '0 0 120px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '5px', letterSpacing: '0.3px' }}>PINCODE</label>
                  <input
                    type="text"
                    value={deliveryForm.pincode}
                    onChange={(e) => setDeliveryForm({ ...deliveryForm, pincode: e.target.value })}
                    placeholder="560082"
                    style={{
                      width: '100%', backgroundColor: '#ffffff',
                      border: '1px solid rgba(0,0,0,0.14)', borderRadius: '10px',
                      padding: '10px 14px', color: '#111827', fontSize: '13px',
                      outline: 'none', transition: 'border-color 0.2s',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(0,0,0,0.14)'}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#6b7280', marginBottom: '8px', letterSpacing: '0.3px' }}>PAYMENT MODE</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[
                    { value: 'cod', label: 'Cash on Delivery' },
                    { value: 'store', label: 'Pay at Store Pickup' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDeliveryForm({ ...deliveryForm, paymentMode: opt.value })}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: deliveryForm.paymentMode === opt.value
                          ? '1.5px solid rgba(37,99,235,0.6)'
                          : '1px solid rgba(0,0,0,0.12)',
                        backgroundColor: deliveryForm.paymentMode === opt.value
                          ? 'rgba(37,99,235,0.1)'
                          : 'rgba(0,0,0,0.03)',
                        color: deliveryForm.paymentMode === opt.value ? '#1d4ed8' : '#6b7280',
                        transition: 'all 0.2s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setDeliveryModal(null)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.12)',
                  color: '#374151', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingDelivery}
                style={{
                  flex: 1, padding: '12px', borderRadius: '12px',
                  backgroundColor: '#2563eb', border: 'none',
                  color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
                  transition: 'all 0.15s',
                  opacity: submittingDelivery ? 0.6 : 1,
                }}
              >
                {submittingDelivery ? 'Confirming...' : 'Confirm & Track Route →'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── USAGE INSTRUCTIONS MODAL SYSTEM ── */}
      {selectedInstruction && (
        <div className="instruction-modal-backdrop" onClick={() => setSelectedInstruction(null)}>
          <div className="instruction-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="instruction-modal-header">
              <div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase',
                  backgroundColor: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)',
                  padding: '3px 9px', borderRadius: '100px', letterSpacing: '0.4px'
                }}>
                  {selectedInstruction.category ? getCategoryMeta(selectedInstruction.category).label.toUpperCase() : 'CHEMICAL USAGE'}
                </span>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', margin: '8px 0 0' }}>
                  {selectedInstruction.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInstruction(null)}
                className="instruction-close-icon-btn"
              >
                ✕
              </button>
            </div>

            {/* Dosage */}
            {selectedInstruction.dosage && (
              <div className="instruction-step instruction-step-purple">
                <span className="step-title">DOSAGE & RATIO</span>
                <p className="instruction-step-desc">{selectedInstruction.dosage}</p>
              </div>
            )}

            {/* Why this product */}
            {selectedInstruction.whyThis && (
              <div className="instruction-step instruction-step-emerald">
                <span className="step-title">WHY THIS PRODUCT</span>
                <p className="instruction-step-desc">{selectedInstruction.whyThis}</p>
              </div>
            )}

            {/* Application Method */}
            <div className="instruction-step instruction-step-blue">
              <span className="step-title">APPLICATION METHOD</span>
              <p className="instruction-step-desc">{selectedInstruction.application}</p>
            </div>

            {/* Safety & Precautions */}
            {selectedInstruction.precautions && (
              <div className="instruction-step instruction-step-amber">
                <span className="step-title">SAFETY & PRECAUTIONS</span>
                <p className="instruction-step-desc">{selectedInstruction.precautions}</p>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedInstruction(null)}
              style={{
                width: '100%', padding: '10px', borderRadius: '10px',
                backgroundColor: 'rgba(0,0,0,0.05)', color: '#111827',
                border: '1px solid rgba(0,0,0,0.12)', cursor: 'pointer',
                fontSize: '13px', fontWeight: 600, marginTop: '4px'
              }}
            >
              Close Instructions
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
