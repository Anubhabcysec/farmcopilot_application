import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get('/', (req, res) => {
  try {
    const filePath = path.join(__dirname, '../data/productCatalog.json');
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({
      success: true,
      data: data.products
    });
  } catch (error) {
    console.error('❌ Products error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error reading products'
    });
  }
});

export default router;