// Server-side forward geocoding via OpenStreetMap Nominatim (free, no API
// key) — used when a route only receives a location string (e.g. equipment
// requests/owner registration) and needs coordinates for distance matching.
// Returns null on any failure so callers can degrade gracefully.
export async function geocodeAddress(address) {
  if (!address || !address.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FarmCopilot/1.0 (farm advisory app)' },
    });
    const results = await response.json();
    if (Array.isArray(results) && results.length > 0) {
      return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) };
    }
    return null;
  } catch (err) {
    console.error('⚠ geocodeAddress failed:', err.message);
    return null;
  }
}
