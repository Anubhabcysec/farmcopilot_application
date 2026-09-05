import express from 'express';
import { readJson, writeJson, genId } from '../utils/store.js';

const router = express.Router();
const ORDERS_FILE = 'vendorOrders.json';
const SHOPS_FILE = 'vendorShops.json';

// Seeded demo shops matching the coordinates already hardcoded in
// frontend/src/pages/Treatment.jsx (SHOP_LOCATIONS), so the delivery map
// route the frontend draws lines up with real shop records.
const SEED_SHOPS = [
  { id: 'SHOP-001', name: 'Kumbalgodu Agro Centre', coords: { lat: 12.8898, lng: 77.4519 }, phone: '+91 98450 11223' },
  { id: 'SHOP-002', name: 'Kengeri Farm Supplies', coords: { lat: 12.9081, lng: 77.4835 }, phone: '+91 98450 22334' },
  { id: 'SHOP-003', name: 'Bannerghatta Agri Store', coords: { lat: 12.8004, lng: 77.5773 }, phone: '+91 98450 33445' },
  { id: 'SHOP-004', name: 'Tavarekere Fertilizer Depot', coords: { lat: 12.8763, lng: 77.6031 }, phone: '+91 98450 44556' },
];

function ensureShopsSeeded() {
  const shops = readJson(SHOPS_FILE, []);
  if (shops.length === 0) {
    writeJson(SHOPS_FILE, SEED_SHOPS);
    return SEED_SHOPS;
  }
  return shops;
}

// NOTE: Order status used to advance on its own (a timer silently flipped
// pending -> confirmed -> ready a few seconds after creation, picking a
// random shop). That made the dashboard show numbers with no real cause
// behind them. Status now only changes through the explicit PATCH actions
// below (/confirm, /ready, /reject) — each one is a deliberate action by
// whoever is playing "vendor" in this demo, not a fake clock.

// GET /api/vendor/orders
router.get('/orders', (req, res) => {
  try {
    const orders = readJson(ORDERS_FILE, []);
    const sorted = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sorted });
  } catch (err) {
    console.error('❌ Orders list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load orders.' });
  }
});

// POST /api/vendor/orders
router.post('/orders', (req, res) => {
  try {
    const { farmerName, farmerPhone, location, shopName, items } = req.body;
    if (!farmerName || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'farmerName and items are required.' });
    }

    const totalAmount = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

    const order = {
      id: genId('ORD'),
      farmerName,
      farmerPhone: farmerPhone || '',
      location: location || '',
      shopName: shopName || null,
      items,
      totalAmount,
      status: 'pending',
      claimedByShopId: null,
      claimedByShopName: null,
      shopPhone: null,
      delivery: null,
      createdAt: new Date().toISOString(),
      statusUpdatedAt: new Date().toISOString(),
    };

    const orders = readJson(ORDERS_FILE, []);
    orders.push(order);
    writeJson(ORDERS_FILE, orders);

    res.json({ success: true, data: order });
  } catch (err) {
    console.error('❌ Order create error:', err.message);
    res.status(500).json({ success: false, message: 'Could not place this order.' });
  }
});

// PATCH /api/vendor/orders/:id/delivery
router.patch('/orders/:id/delivery', (req, res) => {
  try {
    const { id } = req.params;
    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    orders[idx].delivery = { ...req.body, submittedAt: new Date().toISOString() };
    writeJson(ORDERS_FILE, orders);
    res.json({ success: true, data: orders[idx] });
  } catch (err) {
    console.error('❌ Delivery update error:', err.message);
    res.status(500).json({ success: false, message: 'Could not confirm delivery.' });
  }
});

// PATCH /api/vendor/orders/:id/confirm — mark stock confirmed by a real shop
// from the live vendor network. shopId must reference an actual entry in
// vendorShops.json (no random assignment) — the caller picks a real vendor.
router.patch('/orders/:id/confirm', (req, res) => {
  try {
    const { id } = req.params;
    const { shopId } = req.body;
    if (!shopId) {
      return res.status(400).json({ success: false, message: 'shopId is required.' });
    }

    const shops = ensureShopsSeeded();
    const shop = shops.find(s => s.id === shopId);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'That vendor was not found on the network.' });
    }

    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (orders[idx].status !== 'pending') {
      return res.status(409).json({ success: false, message: `Order is already ${orders[idx].status}.` });
    }

    orders[idx].status = 'confirmed';
    orders[idx].claimedByShopId = shop.id;
    orders[idx].claimedByShopName = shop.name;
    orders[idx].shopPhone = shop.phone || null;
    orders[idx].statusUpdatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
    res.json({ success: true, data: orders[idx] });
  } catch (err) {
    console.error('❌ Order confirm error:', err.message);
    res.status(500).json({ success: false, message: 'Could not confirm this order.' });
  }
});

// PATCH /api/vendor/orders/:id/ready — mark an already-confirmed order ready for pickup/delivery
router.patch('/orders/:id/ready', (req, res) => {
  try {
    const { id } = req.params;
    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (orders[idx].status !== 'confirmed') {
      return res.status(409).json({ success: false, message: 'Only a confirmed order can be marked ready.' });
    }

    orders[idx].status = 'ready';
    orders[idx].statusUpdatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
    res.json({ success: true, data: orders[idx] });
  } catch (err) {
    console.error('❌ Order ready error:', err.message);
    res.status(500).json({ success: false, message: 'Could not update this order.' });
  }
});

// PATCH /api/vendor/orders/:id/reject — mark an order out of stock
router.patch('/orders/:id/reject', (req, res) => {
  try {
    const { id } = req.params;
    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (orders[idx].status !== 'pending') {
      return res.status(409).json({ success: false, message: `Order is already ${orders[idx].status}.` });
    }

    orders[idx].status = 'rejected';
    orders[idx].statusUpdatedAt = new Date().toISOString();
    writeJson(ORDERS_FILE, orders);
    res.json({ success: true, data: orders[idx] });
  } catch (err) {
    console.error('❌ Order reject error:', err.message);
    res.status(500).json({ success: false, message: 'Could not update this order.' });
  }
});

// DELETE /api/vendor/orders/:id
router.delete('/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const orders = readJson(ORDERS_FILE, []);
    const idx = orders.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    orders.splice(idx, 1);
    writeJson(ORDERS_FILE, orders);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Order delete error:', err.message);
    res.status(500).json({ success: false, message: 'Could not cancel this order.' });
  }
});

// GET /api/vendor/shops
router.get('/shops', (req, res) => {
  try {
    const shops = ensureShopsSeeded();
    res.json({ success: true, data: shops });
  } catch (err) {
    console.error('❌ Shops list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load shops.' });
  }
});

// POST /api/vendor/sync-shops — merge real nearby-shops results (from
// routes/treatment.js) into the vendor shop list, so they get real coords.
router.post('/sync-shops', (req, res) => {
  try {
    const { shops: incoming } = req.body;
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ success: false, message: 'shops array is required.' });
    }

    const shops = ensureShopsSeeded();
    for (const s of incoming) {
      if (!s.name) continue;
      const existing = shops.find(x => x.name === s.name);
      if (existing) {
        if (s.location) existing.coords = { lat: s.location.lat, lng: s.location.lng };
      } else {
        shops.push({
          id: genId('SHOP'),
          name: s.name,
          coords: s.location ? { lat: s.location.lat, lng: s.location.lng } : null,
          phone: s.phone || null,
        });
      }
    }
    writeJson(SHOPS_FILE, shops);
    res.json({ success: true, data: shops });
  } catch (err) {
    console.error('❌ Sync shops error:', err.message);
    res.status(500).json({ success: false, message: 'Could not sync shops.' });
  }
});

export default router;
