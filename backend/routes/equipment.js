import express from 'express';
import fs from 'fs';
import path from 'path';
import { readJson, writeJson, genId } from '../utils/store.js';
import { geocodeAddress } from '../utils/geocode.js';

const router = express.Router();
const OWNERS_FILE = 'equipmentOwners.json';
const REQUESTS_FILE = 'equipmentRequests.json';

const typesPath = path.join(process.cwd(), 'data', 'equipmentTypes.json');
let EQUIPMENT_TYPES = [];
try {
  EQUIPMENT_TYPES = JSON.parse(fs.readFileSync(typesPath, 'utf8')).types;
} catch (err) {
  console.error('❌ Failed to load equipment types:', err.message);
}

const DEMO_SHOPS = [
  { name: 'Kaggalipura Farm Equipment Rentals', rating: 4.3 },
  { name: 'Bengaluru Rural Machinery Hub', rating: 4.6 },
  { name: 'Green Field Equipment Rentals', rating: 4.1 },
];

function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function getTypeRate(equipmentTypeId) {
  const type = EQUIPMENT_TYPES.find(t => t.id === equipmentTypeId);
  return type?.defaultRate || 500;
}

// Auto-generates 1-3 demo shop quotes for a request ~6 seconds after it's
// posted, so the flow is testable without needing real registered owners —
// same "simulate the marketplace responding" approach the backend already
// uses for vendor orders and nearby-shops.
function progressRequestQuotes(request) {
  if (request.status === 'booked') return request;
  const ageMs = Date.now() - new Date(request.createdAt).getTime();
  if (ageMs < 6000) return request;
  if ((request.quotes || []).some(q => q.demo)) return request; // already generated

  const rate = getTypeRate(request.equipmentTypeId);
  const baseCost = (request.landAreaAcres || 1) * rate;
  const shopCount = 1 + Math.floor(Math.random() * 2); // 1-2 demo quotes
  const shuffled = [...DEMO_SHOPS].sort(() => Math.random() - 0.5).slice(0, shopCount);

  const newQuotes = shuffled.map((shop, i) => ({
    quoteId: genId('QUOTE'),
    ownerId: null,
    ownerName: shop.name,
    machineName: EQUIPMENT_TYPES.find(t => t.id === request.equipmentTypeId)?.name || 'Equipment',
    distanceKm: `${(2 + Math.random() * 6).toFixed(1)} km`,
    rating: shop.rating,
    calculatedPrice: Math.round(baseCost * (0.9 + Math.random() * 0.25)),
    shopName: shop.name,
    shopId: genId('SHOP'),
    shopPhone: `+91 98${400000 + Math.floor(Math.random() * 99999)}`,
    demo: true,
  }));

  request.quotes = [...(request.quotes || []), ...newQuotes];
  return request;
}

function progressAllRequests(requests) {
  let changed = false;
  const next = requests.map(r => {
    const before = JSON.stringify(r);
    const after = progressRequestQuotes(r);
    if (JSON.stringify(after) !== before) changed = true;
    return after;
  });
  if (changed) writeJson(REQUESTS_FILE, next);
  return next;
}

// GET /api/equipment/types
router.get('/types', (req, res) => {
  res.json({ success: true, data: EQUIPMENT_TYPES });
});

// GET /api/equipment/owners
router.get('/owners', (req, res) => {
  try {
    res.json({ success: true, data: readJson(OWNERS_FILE, []) });
  } catch (err) {
    console.error('❌ Owners list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load equipment owners.' });
  }
});

// POST /api/equipment/owners/self-register
router.post('/owners/self-register', async (req, res) => {
  try {
    const { farmerId, farmerName, farmerPhone, machineType, machineName, location, biddingPrice } = req.body;
    if (!farmerId || !machineName || !location) {
      return res.status(400).json({ success: false, message: 'machineName and location are required.' });
    }

    const coords = await geocodeAddress(location);

    const owner = {
      id: genId('OWN'),
      farmerId,
      farmerName: farmerName || '',
      farmerPhone: farmerPhone || '',
      machineType: machineType || 'EQ-TRAC',
      machineName,
      location,
      coords,
      biddingPrice: biddingPrice || null,
      available: true,
      rating: 4.5,
      createdAt: new Date().toISOString(),
    };

    const owners = readJson(OWNERS_FILE, []);
    owners.push(owner);
    writeJson(OWNERS_FILE, owners);

    res.json({ success: true, data: owner });
  } catch (err) {
    console.error('❌ Owner registration error:', err.message);
    res.status(500).json({ success: false, message: 'Could not register your machine. Please try again.' });
  }
});

// PATCH /api/equipment/owners/:id/status
router.patch('/owners/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;
    const owners = readJson(OWNERS_FILE, []);
    const idx = owners.findIndex(o => o.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Owner not found.' });
    }
    owners[idx].available = !!available;
    writeJson(OWNERS_FILE, owners);
    res.json({ success: true, data: owners[idx] });
  } catch (err) {
    console.error('❌ Owner status update error:', err.message);
    res.status(500).json({ success: false, message: 'Could not update availability.' });
  }
});

// GET /api/equipment/requests
router.get('/requests', (req, res) => {
  try {
    const requests = progressAllRequests(readJson(REQUESTS_FILE, []));
    const sorted = [...requests].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, data: sorted });
  } catch (err) {
    console.error('❌ Requests list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load equipment requests.' });
  }
});

// POST /api/equipment/requests
router.post('/requests', async (req, res) => {
  try {
    const {
      farmerName, farmerPhone, location, equipmentTypeId, workType,
      landAreaAcres, requiredDateRaw, requiredTimeRaw, requiredDate, preferredTime,
    } = req.body;

    if (!farmerName || !location || !equipmentTypeId) {
      return res.status(400).json({ success: false, message: 'location and equipmentTypeId are required.' });
    }

    const coords = await geocodeAddress(location);
    const equipmentTypeName = EQUIPMENT_TYPES.find(t => t.id === equipmentTypeId)?.name || equipmentTypeId;

    const request = {
      id: genId('REQ'),
      farmerName,
      farmerPhone: farmerPhone || '',
      location,
      coords,
      equipmentTypeId,
      equipmentTypeName,
      workType: workType || 'General Farm Work',
      landAreaAcres: Number(landAreaAcres) || 1,
      requiredDateRaw: requiredDateRaw || '',
      requiredTimeRaw: requiredTimeRaw || '',
      requiredDate: requiredDate || '',
      preferredTime: preferredTime || '',
      status: 'pending',
      quotes: [],
      acceptedQuote: null,
      bookedAt: null,
      createdAt: new Date().toISOString(),
    };

    const requests = readJson(REQUESTS_FILE, []);
    requests.push(request);
    writeJson(REQUESTS_FILE, requests);

    res.json({ success: true, data: request });
  } catch (err) {
    console.error('❌ Request create error:', err.message);
    res.status(500).json({ success: false, message: 'Could not broadcast this request.' });
  }
});

// POST /api/equipment/requests/:id/accept — farmer accepts a quote
router.post('/requests/:id/accept', (req, res) => {
  try {
    const { id } = req.params;
    const { quoteId } = req.body;

    const requests = readJson(REQUESTS_FILE, []);
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const request = requests[idx];
    const quote = (request.quotes || []).find(q => q.quoteId === quoteId);
    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found.' });
    }

    request.status = 'booked';
    request.acceptedQuote = quote;
    request.bookedAt = new Date().toISOString();
    requests[idx] = request;
    writeJson(REQUESTS_FILE, requests);

    res.json({ success: true, data: { acceptedQuote: quote, request } });
  } catch (err) {
    console.error('❌ Accept quote error:', err.message);
    res.status(500).json({ success: false, message: 'Could not accept this quote.' });
  }
});

// POST /api/equipment/requests/:id/owner-accept — a registered owner accepts a live ping
router.post('/requests/:id/owner-accept', (req, res) => {
  try {
    const { id } = req.params;
    const { ownerId } = req.body;

    const requests = readJson(REQUESTS_FILE, []);
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const owners = readJson(OWNERS_FILE, []);
    const owner = owners.find(o => o.id === ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found.' });
    }

    const request = requests[idx];
    const rate = getTypeRate(request.equipmentTypeId);
    const distanceKm = request.coords && owner.coords
      ? `${haversineKm(owner.coords, request.coords).toFixed(1)} km`
      : 'nearby';

    const quote = {
      quoteId: genId('QUOTE'),
      ownerId: owner.id,
      ownerName: owner.farmerName,
      machineName: owner.machineName,
      distanceKm,
      rating: owner.rating || 4.5,
      calculatedPrice: owner.biddingPrice
        ? Number(owner.biddingPrice)
        : Math.round((request.landAreaAcres || 1) * rate),
      shopName: owner.farmerName,
      shopId: owner.id,
      shopPhone: owner.farmerPhone,
      demo: false,
    };

    request.quotes = [...(request.quotes || []), quote];
    requests[idx] = request;
    writeJson(REQUESTS_FILE, requests);

    res.json({ success: true, data: { quote } });
  } catch (err) {
    console.error('❌ Owner accept error:', err.message);
    res.status(500).json({ success: false, message: 'Could not accept this job.' });
  }
});

// DELETE /api/equipment/requests/:id
router.delete('/requests/:id', (req, res) => {
  try {
    const { id } = req.params;
    const requests = readJson(REQUESTS_FILE, []);
    const idx = requests.findIndex(r => r.id === id);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    requests.splice(idx, 1);
    writeJson(REQUESTS_FILE, requests);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Request delete error:', err.message);
    res.status(500).json({ success: false, message: 'Could not cancel this request.' });
  }
});

export default router;
