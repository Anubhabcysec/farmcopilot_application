import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Load product catalog once for AI context
const catalogPath = path.join(process.cwd(), 'data', 'productCatalog.json');
let productCatalog = [];
try {
  productCatalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).products;
} catch (err) {
  console.error("❌ Failed to load product catalog:", err.message);
}

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { query } = req.body;
    const image = req.file;

    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing from environment variables.");
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log("📝 Incoming Query:", query || "(no text)");
    if (image) console.log("📷 Incoming Image:", image.path);

    // Prepare catalog context for AI
    const catalogSnippet = productCatalog.map(p => `- ${p.name} (ID: ${p.id}): ${p.whyThis}`).join('\n');

    const prompt = `You are an expert agronomist. Diagnose the crop issue based on the text description and/or image provided.
Suggest products ONLY from the following catalog:
${catalogSnippet}

Return your response in STRICT JSON format with these exact keys:
{
  "issue": "short name of the problem",
  "summary": "detailed explanation for the farmer",
  "severity": "low" | "medium" | "high",
  "urgency": "immediate" | "observe closely",
  "recommendedProductIds": ["matching ID from catalog"]
}`;

    const parts = [{ text: prompt }];
    
    // Add text query if present
    if (query) {
      parts.push({ text: `Farmer's Query: ${query}` });
    }

    // Process image if uploaded
    if (image) {
      const imageBuffer = fs.readFileSync(image.path);
      parts.push({
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: "image/jpeg"
        }
      });
    }

    // Call Gemini
    const result = await model.generateContent(parts);
    const textResponse = result.response.text();
    
    // Attempt to parse JSON from the response (Gemini sometimes adds markdown blocks)
    let aiResponse;
    try {
      const cleanedJson = textResponse.replace(/```json|```/g, '').trim();
      aiResponse = JSON.parse(cleanedJson);
    } catch (e) {
      console.error("❌ Failed to parse Gemini JSON:", textResponse);
      throw new Error("AI returned malformed data. Please try again.");
    }

    // Clean up temporary local file safely
    if (image && fs.existsSync(image.path)) {
      fs.unlinkSync(image.path);
    }

    // Map product IDs to full product objects for the frontend
    const recommendedProducts = (aiResponse.recommendedProductIds || [])
      .map(id => productCatalog.find(p => p.id === id))
      .filter(Boolean);

    // Return real AI data
    res.json({
      success: true,
      data: {
        diagnosis: {
          issue: aiResponse.issue || 'Analyzing...',
          severity: aiResponse.severity || 'medium',
          urgency: aiResponse.urgency || 'observe closely',
          confidence: 95,
          summary: aiResponse.summary
        },
        products: { recommendations: recommendedProducts },
        safetyPlan: { steps: [] },
        shouldEscalate: aiResponse.severity === 'high'
      }
    });

  } catch (error) {
    console.error("❌ Gemini AI Error:", error.message);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    const msg = error.message || '';
    let friendlyMessage;
    if (msg.includes('429')) {
      friendlyMessage = 'API quota exhausted for today. The free tier limit has been reached. Please try again after midnight (IST) or enable billing at console.cloud.google.com.';
    } else if (msg.includes('403')) {
      friendlyMessage = 'API key does not have access to this model. Please check your Google AI Studio project permissions.';
    } else {
      friendlyMessage = 'Error: ' + msg;
    }

    res.json({
      success: true,
      data: {
        diagnosis: {
          issue: 'AI System Notice',
          severity: 'medium',
          urgency: 'observe closely',
          confidence: 0,
          summary: friendlyMessage
        }
      }
    });
  }
});

export default router;