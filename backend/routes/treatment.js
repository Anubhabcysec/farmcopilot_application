import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Load data files
const recPath = path.join(process.cwd(), 'data', 'diseaseRecommendations.json');
const pricePath = path.join(process.cwd(), 'data', 'priceData.json');

let recommendations = {};
let priceData = {};

try {
  recommendations = JSON.parse(fs.readFileSync(recPath, 'utf8')).recommendations;
} catch (err) {
  console.error("❌ Failed to load disease recommendations:", err.message);
}

try {
  priceData = JSON.parse(fs.readFileSync(pricePath, 'utf8')).prices;
} catch (err) {
  console.error("❌ Failed to load price data:", err.message);
}

// AI-powered disease matching using Gemini
async function aiMatchDisease(diseaseName) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const availableKeys = Object.keys(recommendations);
    const keyDescriptions = availableKeys.map(k => {
      const r = recommendations[k];
      return `"${k}" → ${r.crop} - ${r.disease}`;
    }).join('\n');

    const prompt = `You are a crop disease matching system. Given an AI-diagnosed disease name, find the BEST matching key from the database below.

AI Diagnosis: "${diseaseName}"

Available disease keys:
${keyDescriptions}

Reply with ONLY the exact key string (e.g. "Tomato___Leaf_Spot") that best matches the diagnosis. If no reasonable match exists, reply with "NONE".`;

    const result = await model.generateContent(prompt);
    const matchedKey = result.response.text().trim().replace(/"/g, '');
    
    if (matchedKey !== 'NONE' && recommendations[matchedKey]) {
      console.log(`🧠 AI matched "${diseaseName}" → "${matchedKey}"`);
      return recommendations[matchedKey];
    }
    return null;
  } catch (err) {
    console.error("⚠ AI matching failed:", err.message);
    return null;
  }
}

// Mock nearby shops (used when no Google Maps API key is available)
const mockShops = [
  {
    name: "Kisan Agro Centre",
    address: "Main Market Road, Near Bus Stand",
    rating: 4.3,
    phone: "+91-9876543210",
    location: { lat: 28.6139, lng: 77.2090 },
    availability: "In Stock",
    distance: "1.2 km"
  },
  {
    name: "Shree Fertilizer & Seeds",
    address: "Station Road, Opposite SBI Bank",
    rating: 4.1,
    phone: "+91-9876543211",
    location: { lat: 28.6200, lng: 77.2150 },
    availability: "Unknown",
    distance: "2.5 km"
  },
  {
    name: "Bharat Agro Traders",
    address: "NH-48, Agricultural Market Yard",
    rating: 4.5,
    phone: "+91-9876543212",
    location: { lat: 28.6050, lng: 77.1980 },
    availability: "In Stock",
    distance: "3.8 km"
  },
  {
    name: "Patel Pesticide Store",
    address: "Gandhi Chowk, Near Mandi",
    rating: 3.9,
    phone: "+91-9876543213",
    location: { lat: 28.6300, lng: 77.2250 },
    availability: "Limited Stock",
    distance: "4.1 km"
  },
  {
    name: "Green Grow Agri Inputs",
    address: "Krishi Bhawan, Sector 12",
    rating: 4.6,
    phone: "+91-9876543214",
    location: { lat: 28.5900, lng: 77.2000 },
    availability: "In Stock",
    distance: "5.3 km"
  }
];

// POST /api/treatment — Get treatment recommendation for a disease
router.post('/', async (req, res) => {
  try {
    const { disease_name, crop_name } = req.body;

    if (!disease_name) {
      return res.status(400).json({ success: false, message: 'disease_name is required' });
    }

    // Try exact match first, then fuzzy match
    let rec = recommendations[disease_name];
    
    if (!rec) {
      // Fuzzy search: find best match
      const searchKey = disease_name.toLowerCase().replace(/\s+/g, '_');
      const matchedKey = Object.keys(recommendations).find(key => 
        key.toLowerCase().includes(searchKey) || 
        searchKey.includes(key.toLowerCase().split('___')[1]?.replace(/_/g, '') || '')
      );
      if (matchedKey) rec = recommendations[matchedKey];
    }

    // If still no match, try AI-powered matching
    if (!rec) {
      console.log(`🔍 No fuzzy match for "${disease_name}", trying AI match...`);
      rec = await aiMatchDisease(disease_name);
    }

    if (!rec) {
      return res.json({
        success: true,
        data: {
          found: false,
          message: `No specific recommendation found for "${disease_name}". Please consult a local agronomist.`,
          disease_name,
          crop_name
        }
      });
    }

    // Get price data
    const price = priceData[rec.priceKey] || null;

    res.json({
      success: true,
      data: {
        found: true,
        disease: rec.disease,
        crop: rec.crop,
        pesticide: rec.pesticide,
        dosage: rec.dosage,
        alternative: rec.alternative,
        altDosage: rec.altDosage,
        category: rec.category,
        application: rec.application,
        precautions: rec.precautions,
        pricing: price ? {
          productName: price.productName,
          brands: price.brands,
          priceRange: price.priceRange,
          unit: price.unit,
          source: price.source
        } : null
      }
    });
  } catch (error) {
    console.error("❌ Treatment error:", error.message);
    res.status(500).json({ success: false, message: 'Error processing treatment request' });
  }
});

// GET /api/treatment/nearby-shops — Find nearby fertilizer/pesticide shops
router.get('/nearby-shops', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // If we have a real API key, use Google Maps Places API
    if (apiKey && apiKey !== '' && apiKey !== 'your_key_here') {
      try {
        const keyword = encodeURIComponent('fertilizer shop pesticide shop agricultural shop');
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&keyword=${keyword}&key=${apiKey}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          const p = Math.PI / 180;
          const userLat = parseFloat(lat);
          const userLng = parseFloat(lng);

          const shops = data.results.slice(0, 8).map(place => {
            const shopLat = place.geometry?.location?.lat;
            const shopLng = place.geometry?.location?.lng;
            
            let distStr = null;
            if (shopLat !== undefined && shopLng !== undefined && !isNaN(userLat) && !isNaN(userLng)) {
               const a = 0.5 - Math.cos((shopLat - userLat) * p)/2 + 
               Math.cos(userLat * p) * Math.cos(shopLat * p) * 
               (1 - Math.cos((shopLng - userLng) * p))/2;
               const d = 12742 * Math.asin(Math.sqrt(a));
               distStr = d.toFixed(1) + " km";
            }

            return {
              name: place.name || 'Unknown Store',
              address: place.vicinity || 'Address not available',
              rating: place.rating || 0,
              phone: null,
              location: { lat: shopLat, lng: shopLng },
              availability: 'Unknown',
              distance: distStr,
              placeId: place.place_id
            };
          });

          return res.json({
            success: true,
            source: 'google_maps',
            disclaimer: 'Availability may vary, please confirm with store',
            data: shops
          });
        }
      } catch (apiErr) {
        console.error("⚠ Google Maps API error, falling back to mock:", apiErr.message);
      }
    }

    // Fallback: return mock data
    res.json({
      success: true,
      source: 'mock',
      disclaimer: 'Availability may vary, please confirm with store',
      data: mockShops
    });

  } catch (error) {
    console.error("❌ Nearby shops error:", error.message);
    res.status(500).json({ success: false, message: 'Error finding nearby shops' });
  }
});

// GET /api/treatment/ip-location — Approximate location from the request's IP
// (free ip-api.com, no key). In local dev the IP is usually private/loopback,
// which can't be geolocated — falls back to a fixed default so the frontend
// always gets a usable {lat,lng} instead of failing.
const DEFAULT_IP_LOCATION = { lat: 12.9716, lng: 77.5946, city: 'Bengaluru' }; // matches the rest of the app's demo location

router.get('/ip-location', async (req, res) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress) || '';
    const isPrivate = !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('::ffff:127.');

    if (isPrivate) {
      return res.json({ success: true, source: 'default', ...DEFAULT_IP_LOCATION });
    }

    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,lat,lon,city`);
    const data = await response.json();

    if (data.status === 'success') {
      return res.json({ success: true, source: 'ip-api', lat: data.lat, lng: data.lon, city: data.city });
    }

    res.json({ success: true, source: 'default', ...DEFAULT_IP_LOCATION });
  } catch (error) {
    console.error('⚠ IP location error, using default:', error.message);
    res.json({ success: true, source: 'default', ...DEFAULT_IP_LOCATION });
  }
});

// GET /api/treatment/diseases — List all supported diseases (for dropdown)
router.get('/diseases', (req, res) => {
  const diseases = Object.entries(recommendations).map(([key, val]) => ({
    key,
    disease: val.disease,
    crop: val.crop,
    label: `${val.crop} — ${val.disease}`
  }));
  res.json({ success: true, data: diseases });
});

export default router;
