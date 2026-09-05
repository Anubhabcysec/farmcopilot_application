import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readJson, writeJson, genId } from '../utils/store.js';

const router = express.Router();

const USERS_FILE = 'users.json';
const JWT_SECRET = process.env.JWT_SECRET || 'farm-copilot-dev-secret-change-me';
const TOKEN_EXPIRY = '30d';

function publicUser(u) {
  // Never send the password hash to the client.
  const { passwordHash, ...rest } = u;
  return rest;
}

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
// ─────────────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, fieldLocation, fieldLocationCoords } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, phone and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const users = readJson(USERS_FILE, []);
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some(u => u.email === normalizedEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
      id: genId('U'),
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      fieldLocation: fieldLocation || '',
      fieldLocationCoords: fieldLocationCoords || null,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    writeJson(USERS_FILE, users);

    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    console.error('❌ Signup error:', err.message);
    res.status(500).json({ success: false, message: 'Could not create your account. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const users = readJson(USERS_FILE, []);
    const normalizedEmail = email.trim().toLowerCase();
    const user = users.find(u => u.email === normalizedEmail);

    if (!user) {
      return res.status(401).json({ success: false, message: 'No account found with this email.' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = signToken(user);
    res.json({ success: true, token, user: publicUser(user) });
  } catch (err) {
    console.error('❌ Login error:', err.message);
    res.status(500).json({ success: false, message: 'Could not log you in. Please try again.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/geocode?address=...
// Forward geocoding via OpenStreetMap Nominatim — free, no API key
// (same "free public API, no key" pattern routes/weather.js already uses).
// ─────────────────────────────────────────────────────────────────────────
router.get('/geocode', async (req, res) => {
  try {
    const { address } = req.query;
    if (!address || !address.trim()) {
      return res.status(400).json({ success: false, message: 'address is required' });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FarmCopilot/1.0 (farm advisory app)' },
    });
    const results = await response.json();

    if (Array.isArray(results) && results.length > 0) {
      const { lat, lon } = results[0];
      return res.json({ success: true, coords: { lat: parseFloat(lat), lng: parseFloat(lon) } });
    }

    res.json({ success: false, message: 'No matching location found.' });
  } catch (err) {
    console.error('⚠ Geocode error:', err.message);
    res.json({ success: false, message: 'Could not resolve this address right now.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/auth/reverse-geocode?lat=...&lng=...
// Reverse geocoding via OpenStreetMap Nominatim — free, no API key.
// ─────────────────────────────────────────────────────────────────────────
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'lat and lng are required' });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FarmCopilot/1.0 (farm advisory app)' },
    });
    const result = await response.json();

    if (result && result.display_name) {
      return res.json({ success: true, address: result.display_name });
    }

    res.json({ success: false, message: 'Could not find an address for this location.' });
  } catch (err) {
    console.error('⚠ Reverse geocode error:', err.message);
    res.json({ success: false, message: 'Could not resolve this location right now.' });
  }
});

export default router;
export { JWT_SECRET };
