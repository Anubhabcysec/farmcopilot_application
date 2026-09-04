import express from 'express';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readJson, writeJson, genId } from '../utils/store.js';

const router = express.Router();
const TESTS_FILE = 'soilTests.json';
const FARMS_FILE = 'farms.json';

const catalogPath = path.join(process.cwd(), 'data', 'productCatalog.json');
let productCatalog = [];
try {
  productCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).products;
} catch (err) {
  console.error('❌ Failed to load product catalog for soil analysis:', err.message);
}

// GET /api/soil/tests?farmerId=...&farmId=...
router.get('/tests', (req, res) => {
  try {
    const { farmerId, farmId } = req.query;
    if (!farmerId || !farmId) {
      return res.status(400).json({ success: false, message: 'farmerId and farmId are required' });
    }
    const allTests = readJson(TESTS_FILE, []);
    const tests = allTests
      .filter(t => t.farmerId === farmerId && t.farmId === farmId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, tests });
  } catch (err) {
    console.error('❌ Soil tests list error:', err.message);
    res.status(500).json({ success: false, message: 'Could not load soil tests.' });
  }
});

// POST /api/soil/tests
router.post('/tests', (req, res) => {
  try {
    const { farmerId, farmId, readings, extras, source, stabilitySeconds } = req.body;
    if (!farmerId || !farmId || !readings) {
      return res.status(400).json({ success: false, message: 'farmerId, farmId and readings are required.' });
    }

    const farms = readJson(FARMS_FILE, []);
    const farm = farms.find(f => f.id === farmId && f.farmerId === farmerId);

    const test = {
      id: genId('SOIL'),
      farmerId,
      farmId,
      readings,
      extras: extras || null,
      source: source || 'manual',
      stabilitySeconds: stabilitySeconds || null,
      crop: farm?.currentCrop || '',
      createdAt: new Date().toISOString(),
      analysis: null,
      analysedAt: null,
    };

    const allTests = readJson(TESTS_FILE, []);
    allTests.push(test);
    writeJson(TESTS_FILE, allTests);

    res.json({ success: true, test });
  } catch (err) {
    console.error('❌ Soil test save error:', err.message);
    res.status(500).json({ success: false, message: 'Could not save this soil test.' });
  }
});

// POST /api/soil/analyze — { farmerId, farmId }
router.post('/analyze', async (req, res) => {
  try {
    const { farmerId, farmId } = req.body;
    if (!farmerId || !farmId) {
      return res.status(400).json({ success: false, message: 'farmerId and farmId are required.' });
    }

    const farms = readJson(FARMS_FILE, []);
    const farm = farms.find(f => f.id === farmId && f.farmerId === farmerId);
    if (!farm) {
      return res.status(404).json({ success: false, message: 'Farm not found.' });
    }

    const allTests = readJson(TESTS_FILE, []);
    const farmTests = allTests
      .filter(t => t.farmerId === farmerId && t.farmId === farmId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (farmTests.length === 0) {
      return res.status(400).json({ success: false, message: 'No soil tests recorded for this farm yet.' });
    }

    const latest = farmTests[0];

    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is missing from environment variables.');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const catalogSnippet = productCatalog
      .map(p => `- ${p.name} (ID: ${p.id}, category: ${p.category}, ₹${p.price}/${p.unit}): ${p.whyThis}`)
      .join('\n');

    const historySnippet = farmTests
      .slice(0, 10)
      .map(t => `${t.createdAt}: ${JSON.stringify(t.readings)}`)
      .join('\n');

    const prompt = `You are an expert agronomist analysing a farm's soil test.

Farm: ${farm.name}, location: ${farm.location}${farm.currentCrop ? `, current crop: ${farm.currentCrop}` : ' (no current crop set)'}

Latest soil reading: ${JSON.stringify(latest.readings)}${latest.extras ? `, extras: ${JSON.stringify(latest.extras)}` : ''}

Test history (most recent first, up to 10):
${historySnippet}

Available products to recommend from ONLY this catalog:
${catalogSnippet}

Return STRICT JSON only, no markdown, matching this exact shape:
{
  "soilSummary": "2-3 sentence plain-language summary of the soil right now",
  "parameters": [
    { "key": "n"|"p"|"k"|"ph"|"moisture"|"temperature"|"tds", "status": "low"|"optimal"|"high", "note": "short note" }
  ],
  "corrections": [
    {
      "action": "short action title",
      "why": "why this matters",
      "urgency": "now"|"soon"|"watch",
      "products": [ { "id": "catalog ID", "name": "...", "category": "...", "price": 0, "unit": "...", "whyThis": "...", "isOrganic": false } ]
    }
  ],
  "currentCropCheck": ${farm.currentCrop ? '{ "verdict": "good fit"|"okay fit"|"poor fit", "why": "..." }' : 'null'},
  "cropMode": "${farm.currentCrop ? 'check' : 'recommend'}",
  "cropRecommendations": [ { "crop": "...", "why": "...", "fit": "good"|"okay" } ],
  "risk": { "level": "Low"|"Medium"|"High", "summary": "...", "issues": [ { "name": "...", "why": "...", "prevention": "..." } ] },
  "future": { "nextSeason": [ { "crop": "...", "why": "..." } ], "prepare": ["short prep steps"] },
  "soilProfile": { "characterisation": "...", "nutrientPattern": "...", "phBehaviour": "...", "moistureBehaviour": "...", "trend": "...", "note": "..." },
  "confidence": "low"|"medium"|"high"
}

Only include products from the catalog above, matching by exact ID. If fewer than 2 tests exist, keep "trend" and "soilProfile" general and set confidence to "low" or "medium".`;

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();

    let analysis;
    try {
      const cleaned = textResponse.replace(/```json|```/g, '').trim();
      analysis = JSON.parse(cleaned);
    } catch (e) {
      console.error('❌ Failed to parse Gemini soil analysis JSON:', textResponse);
      throw new Error('AI returned malformed data. Please try again.');
    }

    // Resolve product IDs to full catalog objects (never trust the model's own fields).
    if (Array.isArray(analysis.corrections)) {
      analysis.corrections = analysis.corrections.map(c => ({
        ...c,
        products: (c.products || [])
          .map(p => productCatalog.find(cp => cp.id === p.id))
          .filter(Boolean),
      }));
    }

    const analysedAt = new Date().toISOString();

    // Save the analysis onto the latest test so reopening the page is free.
    const idx = allTests.findIndex(t => t.id === latest.id);
    if (idx !== -1) {
      allTests[idx].analysis = analysis;
      allTests[idx].analysedAt = analysedAt;
      writeJson(TESTS_FILE, allTests);
    }

    res.json({ success: true, analysis, trends: null, analysedAt });
  } catch (error) {
    console.error('❌ Soil analysis error:', error.message);
    const msg = error.message || '';
    let friendlyMessage;
    if (msg.includes('429')) {
      friendlyMessage = 'API quota exhausted for today. Please try again later.';
    } else if (msg.includes('403')) {
      friendlyMessage = 'API key does not have access to this model.';
    } else if (msg.includes('GEMINI_API_KEY')) {
      friendlyMessage = 'AI analysis is not configured on this server yet (missing GEMINI_API_KEY).';
    } else {
      friendlyMessage = 'Could not analyse this soil test. Please try again.';
    }
    res.status(500).json({ success: false, message: friendlyMessage });
  }
});

export default router;
