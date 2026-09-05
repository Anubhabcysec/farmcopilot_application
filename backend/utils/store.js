// Minimal JSON-file storage helpers, matching the pattern already used by
// routes/advisory.js, routes/treatment.js etc. (fs.readFileSync/writeFileSync
// against files in /data). Not a database — same philosophy as the rest of
// this backend, just factored out so every new route doesn't repeat it.
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function readJson(filename, fallback) {
  const filePath = path.join(DATA_DIR, filename);
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`⚠ Failed to read ${filename}:`, err.message);
    return fallback;
  }
}

export function writeJson(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function genId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
