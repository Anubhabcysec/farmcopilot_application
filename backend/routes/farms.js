import express from 'express';
import { readJson, writeJson, genId } from '../utils/store.js';

const router = express.Router();
const FARMS_FILE = 'farms.json';
const MAX_FARMS = 10;

// GET /api/farms?farmerId=...
router.get('/', (req, res) => {
  try {
    const { farmerId } = req.query;
    if (!farmerId) {
      return res.status(400).json({ success: false, message: 'farmerId is required' });
    }
    const allFarms = readJson(FARMS_FILE, []);
    const farms = allFarms.filter(f => f.farmerId === farmerId);
    res.json({ success: true, farms, maxFarms: MAX_FARMS });
  } catch (err) {
    console.error('❌ Farms list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load farms.' });
  }
});

// POST /api/farms
router.post('/', (req, res) => {
  try {
    const { farmerId, name, location, coords, currentCrop } = req.body;
    if (!farmerId || !location) {
      return res.status(400).json({ success: false, message: 'farmerId and location are required.' });
    }

    const allFarms = readJson(FARMS_FILE, []);
    const existingCount = allFarms.filter(f => f.farmerId === farmerId).length;
    if (existingCount >= MAX_FARMS) {
      return res.status(400).json({ success: false, message: `You can add up to ${MAX_FARMS} farms.` });
    }

    const farm = {
      id: genId('FARM'),
      farmerId,
      name: name || `Farm ${existingCount + 1}`,
      location,
      coords: coords || null,
      currentCrop: currentCrop || '',
      cropHistory: [],
      createdAt: new Date().toISOString(),
    };

    allFarms.push(farm);
    writeJson(FARMS_FILE, allFarms);
    res.json({ success: true, farm });
  } catch (err) {
    console.error('❌ Farm create error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save this farm.' });
  }
});

// PATCH /api/farms/:id
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { farmerId, name, location, coords, currentCrop } = req.body;

    const allFarms = readJson(FARMS_FILE, []);
    const idx = allFarms.findIndex(f => f.id === id && f.farmerId === farmerId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Farm not found.' });
    }

    const farm = allFarms[idx];

    // Changing the crop keeps the old one in cropHistory, as the frontend note promises.
    if (currentCrop !== undefined && currentCrop !== farm.currentCrop && farm.currentCrop) {
      farm.cropHistory = farm.cropHistory || [];
      farm.cropHistory.push({ crop: farm.currentCrop, until: new Date().toISOString() });
    }

    if (name !== undefined) farm.name = name;
    if (location !== undefined) farm.location = location;
    if (coords !== undefined) farm.coords = coords;
    if (currentCrop !== undefined) farm.currentCrop = currentCrop;
    farm.updatedAt = new Date().toISOString();

    allFarms[idx] = farm;
    writeJson(FARMS_FILE, allFarms);
    res.json({ success: true, farm });
  } catch (err) {
    console.error('❌ Farm update error:', err.message);
    res.status(500).json({ success: false, message: 'Could not update this farm.' });
  }
});

// DELETE /api/farms/:id?farmerId=...
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { farmerId } = req.query;

    const allFarms = readJson(FARMS_FILE, []);
    const idx = allFarms.findIndex(f => f.id === id && f.farmerId === farmerId);
    if (idx === -1) {
      return res.status(404).json({ success: false, message: 'Farm not found.' });
    }

    allFarms.splice(idx, 1);
    writeJson(FARMS_FILE, allFarms);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Farm delete error:', err.message);
    res.status(500).json({ success: false, message: 'Could not remove this farm.' });
  }
});

export default router;
