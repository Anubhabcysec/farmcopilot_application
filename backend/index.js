import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import advisoryRoutes from './routes/advisory.js';
import productsRoutes from './routes/products.js';
import verifyRoutes from './routes/verify.js';
import treatmentRoutes from './routes/treatment.js';
import weatherRoutes from './routes/weather.js';
import authRoutes from './routes/auth.js';
import farmsRoutes from './routes/farms.js';
import soilRoutes from './routes/soil.js';
import vendorRoutes from './routes/vendor.js';
import equipmentRoutes from './routes/equipment.js';

const app = express();

// ---------------------------------------------------------------------------
// CORS
//
// The Android app (Capacitor) makes requests from the WebView's origin,
// which by default is "https://localhost" (Capacitor's default Android
// scheme) — a fixed, known origin, not "the whole internet". So there is no
// need to keep the previous origin: '*' in production just to let the
// Android app through.
//
// - Development: allow the Vite dev server (any host on your LAN, since you
//   might test from a phone's browser too) plus the Capacitor WebView
//   origins, so the exact same backend serves web dev + Android dev builds.
// - Production: an explicit allowlist — the deployed web frontend's origin
//   plus the Capacitor Android origins. Add your deployed frontend URL to
//   PROD_ALLOWED_ORIGINS below (or via the env var) once you have it.
// ---------------------------------------------------------------------------
const CAPACITOR_ORIGINS = [
  'https://localhost',   // Capacitor Android default scheme (androidScheme: 'https')
  'http://localhost',    // in case androidScheme is set to 'http'
  'capacitor://localhost',
];

const isProduction = process.env.NODE_ENV === 'production';

const PROD_ALLOWED_ORIGINS = [
  ...CAPACITOR_ORIGINS,
  ...(process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : []),
  // TODO: add your deployed web frontend's origin here once it has one,
  // e.g. 'https://farm-copilot.vercel.app' — or set it via
  // CORS_ALLOWED_ORIGINS in the environment instead of editing this file.
];

app.use(cors({
  origin: isProduction
    ? PROD_ALLOWED_ORIGINS
    : true, // development: reflect any request origin (Vite dev server on any LAN IP/port, Capacitor dev builds, etc.)
  credentials: true,
}));
app.use(express.json());

app.use('/api/advisory', advisoryRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/treatment', treatmentRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/soil', soilRoutes);
app.use('/api/vendor', vendorRoutes);
app.use('/api/equipment', equipmentRoutes);

// Test route — this is the backend API only.
// The actual app UI is served by the frontend dev server (default: http://localhost:5173).
app.get('/', (req, res) => {
  res.send('Farm Copilot backend is running. This is the API server — open the frontend at http://localhost:5173 to use the app.');
});

const PORT = process.env.PORT || 5005;

const server = app.listen(PORT, () => {
  console.log(`🌾 Server running on http://localhost:${PORT}`);
});

// Guard against silent server crashes
server.on('error', (err) => {
  console.error("❌ Server error:", err);
});

process.on('uncaughtException', (err) => {
  console.error("❌ CRASH ERROR:", err.stack);
});

// Forces the event loop to stay active
setInterval(() => {}, 1000 * 60 * 60);