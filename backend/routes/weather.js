import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Load disease risk rules
const rulesPath = path.join(process.cwd(), 'data', 'diseaseRiskRules.json');
let riskRules = [];

try {
  riskRules = JSON.parse(fs.readFileSync(rulesPath, 'utf8')).rules;
} catch (err) {
  console.error("❌ Failed to load disease risk rules:", err.message);
}

// Mock weather data (used when no OpenWeather API key is available)
const mockWeather = {
  temperature: 28,
  humidity: 82,
  rainfall: 6.5,
  windSpeed: 12,
  description: "Scattered showers",
  icon: "10d",
  feelsLike: 32,
  pressure: 1008,
  visibility: 8000,
  clouds: 75,
  location: "New Delhi, IN"
};

// Evaluate disease risks based on weather conditions
function evaluateRisks(weather) {
  const results = [];

  for (const rule of riskRules) {
    const { conditions } = rule;
    let matched = true;
    let matchReasons = [];

    // Check humidity
    if (conditions.humidityMin && weather.humidity < conditions.humidityMin) {
      matched = false;
    } else if (conditions.humidityMin && weather.humidity >= conditions.humidityMin) {
      matchReasons.push(`Humidity ${weather.humidity}% ≥ ${conditions.humidityMin}%`);
    }

    // Check temperature range
    if (conditions.tempMin && weather.temperature < conditions.tempMin) {
      matched = false;
    }
    if (conditions.tempMax && weather.temperature > conditions.tempMax) {
      matched = false;
    }
    if (matched && conditions.tempMin) {
      matchReasons.push(`Temperature ${weather.temperature}°C in range ${conditions.tempMin}-${conditions.tempMax}°C`);
    }

    // Check rainfall (if required)
    if (conditions.rainfallMin && conditions.rainfallMin > 0 && weather.rainfall < conditions.rainfallMin) {
      matched = false;
    } else if (conditions.rainfallMin && conditions.rainfallMin > 0 && weather.rainfall >= conditions.rainfallMin) {
      matchReasons.push(`Rainfall ${weather.rainfall}mm ≥ ${conditions.rainfallMin}mm`);
    }

    if (matched) {
      results.push({
        disease: rule.disease,
        crops: rule.crops,
        risk: rule.risk,
        icon: rule.icon,
        reason: rule.reason,
        action: rule.action,
        matchDetails: matchReasons
      });
    }
  }

  // Sort by risk level: High > Medium > Low
  const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
  results.sort((a, b) => (riskOrder[b.risk] || 0) - (riskOrder[a.risk] || 0));

  return results;
}

function getWmoDescription(code) {
  const map = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with light hail', 99: 'Thunderstorm with heavy hail'
  };
  return map[code] || 'Clear';
}

function getWmoIcon(code, isDay) {
  const d = isDay ? 'd' : 'n';
  if (code === 0) return `01${d}`;
  if (code === 1 || code === 2) return `02${d}`;
  if (code === 3) return `03${d}`;
  if (code === 45 || code === 48) return `50${d}`;
  if (code >= 51 && code <= 67) return `09${d}`;
  if (code >= 80 && code <= 82) return `10${d}`;
  if (code >= 71 && code <= 86) return `13${d}`;
  if (code >= 95 && code <= 99) return `11${d}`;
  return `01${d}`;
}

// GET /api/weather — Fetch weather and predict disease risks
router.get('/', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const apiKey = process.env.OPENWEATHER_API_KEY;

    let weather;

    try {
      // 1. Fetch real weather data from Open-Meteo (Free, No API Key required)
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,wind_speed_10m,weather_code,surface_pressure&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      // 2. Fetch reverse geocoding from BigDataCloud (Free, No API Key required)
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;
      const geoRes = await fetch(geoUrl);
      const geoData = await geoRes.json();

      if (weatherData.current) {
        const cur = weatherData.current;
        weather = {
          temperature: Math.round(cur.temperature_2m),
          humidity: cur.relative_humidity_2m,
          rainfall: cur.precipitation || 0,
          windSpeed: Math.round(cur.wind_speed_10m),
          description: getWmoDescription(cur.weather_code),
          icon: getWmoIcon(cur.weather_code, cur.is_day),
          feelsLike: Math.round(cur.apparent_temperature),
          pressure: cur.surface_pressure || 1013,
          visibility: 10000, // Open-Meteo doesn't expose visibility in 'current' without params
          clouds: [1,2,3].includes(cur.weather_code) ? 50 : (cur.weather_code === 0 ? 0 : 100),
          location: geoData.city ? `${geoData.city}, ${geoData.countryCode}` : `${parseFloat(lat).toFixed(2)}, ${parseFloat(lng).toFixed(2)}`
        };
      } else {
        console.error("⚠ Open-Meteo API error, falling back to mock");
        weather = { ...mockWeather };
      }
    } catch (apiErr) {
      console.error("⚠ Weather API error, falling back to mock:", apiErr.message);
      weather = { ...mockWeather };
    }

    // Run risk prediction engine
    const risks = evaluateRisks(weather);

    // Determine overall risk level
    let overallRisk = 'Low';
    if (risks.length > 0) {
      overallRisk = risks[0].risk; // Already sorted, first is highest
    }

    const highRiskCount = risks.filter(r => r.risk === 'High').length;
    const medRiskCount = risks.filter(r => r.risk === 'Medium').length;

    res.json({
      success: true,
      source: 'live-api',
      data: {
        weather,
        overallRisk,
        riskSummary: {
          total: risks.length,
          high: highRiskCount,
          medium: medRiskCount,
          low: risks.length - highRiskCount - medRiskCount
        },
        risks,
        alert: highRiskCount > 0
          ? `High risk of ${risks[0].disease} detected based on current weather conditions`
          : medRiskCount > 0
            ? `Moderate disease risk detected — monitor crops closely`
            : `Low disease risk — conditions are favorable`
      }
    });

  } catch (error) {
    console.error("❌ Weather error:", error.message);
    res.status(500).json({ success: false, message: 'Error fetching weather data' });
  }
});

// ═══════════════════════════════════════════════════════════
// GET /api/weather/forecast-alerts — 48-hour severe weather alerts
// ═══════════════════════════════════════════════════════════

// Severity thresholds for agricultural alerts
const ALERT_THRESHOLDS = [
  {
    type: 'severe_storm',
    icon: 'thunderstorm',
    severity: 'critical',
    title: 'Severe Storm / Thunderstorm',
    check: (hour) => hour.weather_code >= 95,
    farmAction: 'Move livestock to shelter immediately. Secure greenhouse structures and irrigation equipment. Harvest any mature crops if possible.'
  },
  {
    type: 'heavy_rain',
    icon: 'cloud-rain-heavy',
    severity: 'high',
    title: 'Heavy Rainfall Expected',
    // Checked via 3-hour rolling window below
    check: () => false,
    farmAction: 'Clear drainage channels. Cover seedbeds and nursery areas. Avoid pesticide/fertilizer application — it will wash off.'
  },
  {
    type: 'strong_wind',
    icon: 'wind',
    severity: 'high',
    title: 'Strong Wind Warning',
    check: (hour) => hour.wind_gusts_10m >= 50,
    farmAction: 'Stake tall crops (maize, sugarcane). Secure poly-houses and shade nets. Postpone any spraying operations.'
  },
  {
    type: 'extreme_heat',
    icon: 'thermometer',
    severity: 'medium',
    title: 'Extreme Heat Alert',
    check: (hour) => hour.temperature_2m >= 42,
    farmAction: 'Increase irrigation frequency. Apply mulch to reduce soil moisture evaporation. Avoid midday fieldwork to prevent heat stress.'
  },
  {
    type: 'moderate_rain',
    icon: 'cloud-drizzle',
    severity: 'medium',
    title: 'Moderate Rainfall Expected',
    check: () => false,
    farmAction: 'Postpone fertilizer application. Monitor low-lying field areas for waterlogging. Check drainage systems.'
  },
  {
    type: 'moderate_wind',
    icon: 'wind',
    severity: 'medium',
    title: 'Moderate Wind Advisory',
    check: (hour) => hour.wind_gusts_10m >= 35 && hour.wind_gusts_10m < 50,
    farmAction: 'Check crop supports and trellises. Postpone foliar spray applications until winds subside.'
  },
];

function getRelativeTime(isoString) {
  const now = new Date();
  const target = new Date(isoString);
  const diffMs = target - now;
  if (diffMs <= 0) return 'now';
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `in ${diffMin} min`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `in ${diffHr}h`;
  return `in ${Math.round(diffHr / 24)}d`;
}

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
}

router.get('/forecast-alerts', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng required' });
    }

    // Fetch 48-hour hourly forecast from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,wind_gusts_10m,weather_code&forecast_days=2&timezone=auto`;
    const apiRes = await fetch(url);
    const data = await apiRes.json();

    if (!data.hourly || !data.hourly.time) {
      return res.json({ success: true, alerts: [] });
    }

    const { time, temperature_2m, precipitation, wind_gusts_10m, weather_code } = data.hourly;

    // Build hourly data array
    const hours = time.map((t, i) => ({
      time: t,
      temperature_2m: temperature_2m[i],
      precipitation: precipitation[i] || 0,
      wind_gusts_10m: wind_gusts_10m[i] || 0,
      weather_code: weather_code[i] || 0,
    }));

    // Filter to only future hours
    const now = new Date();
    const futureHours = hours.filter(h => new Date(h.time) > now);

    // --- Evaluate each threshold ---
    const rawAlerts = []; // { type, severity, icon, title, farmAction, hourIndex, time }

    for (let i = 0; i < futureHours.length; i++) {
      const hour = futureHours[i];

      // Check single-hour thresholds (storm, wind, heat)
      for (const threshold of ALERT_THRESHOLDS) {
        if (threshold.type === 'heavy_rain' || threshold.type === 'moderate_rain') continue; // handled below
        if (threshold.check(hour)) {
          rawAlerts.push({
            type: threshold.type,
            severity: threshold.severity,
            icon: threshold.icon,
            title: threshold.title,
            farmAction: threshold.farmAction,
            time: hour.time,
            detail: threshold.type === 'strong_wind' || threshold.type === 'moderate_wind'
              ? `Wind gusts up to ${Math.round(hour.wind_gusts_10m)} km/h`
              : threshold.type === 'extreme_heat'
              ? `Temperature reaching ${Math.round(hour.temperature_2m)}°C`
              : `Weather code: ${hour.weather_code}`,
          });
        }
      }
    }

    // Check 3-hour rolling precipitation windows
    for (let i = 0; i < futureHours.length - 2; i++) {
      const sum3h = futureHours[i].precipitation + futureHours[i + 1].precipitation + futureHours[i + 2].precipitation;
      if (sum3h >= 30) {
        rawAlerts.push({
          type: 'heavy_rain', severity: 'high', icon: 'cloud-rain-heavy',
          title: 'Heavy Rainfall Expected',
          farmAction: ALERT_THRESHOLDS.find(t => t.type === 'heavy_rain').farmAction,
          time: futureHours[i].time,
          detail: `Cumulative ${Math.round(sum3h)}mm over 3 hours`,
        });
      } else if (sum3h >= 15) {
        rawAlerts.push({
          type: 'moderate_rain', severity: 'medium', icon: 'cloud-drizzle',
          title: 'Moderate Rainfall Expected',
          farmAction: ALERT_THRESHOLDS.find(t => t.type === 'moderate_rain').farmAction,
          time: futureHours[i].time,
          detail: `Cumulative ${Math.round(sum3h)}mm over 3 hours`,
        });
      }
    }

    // --- Group consecutive hours of the same alert type into windows ---
    // Sort by type then time
    rawAlerts.sort((a, b) => a.type === b.type ? new Date(a.time) - new Date(b.time) : a.type.localeCompare(b.type));

    const grouped = [];
    let current = null;

    for (const alert of rawAlerts) {
      if (current && current.type === alert.type) {
        const prevTime = new Date(current.endTime);
        const thisTime = new Date(alert.time);
        const diffHours = (thisTime - prevTime) / 3600000;
        if (diffHours <= 1.5) {
          // Extend existing window
          current.endTime = alert.time;
          // Keep the most severe detail
          if (alert.detail && alert.detail.length > current.detail.length) {
            current.detail = alert.detail;
          }
          continue;
        }
      }
      // Start new window
      current = {
        type: alert.type,
        severity: alert.severity,
        icon: alert.icon,
        title: alert.title,
        farmAction: alert.farmAction,
        startTime: alert.time,
        endTime: alert.time,
        detail: alert.detail,
      };
      grouped.push(current);
    }

    // Enrich with relative time and formatted window
    const sevOrder = { critical: 0, high: 1, medium: 2 };
    const enriched = grouped.map(g => ({
      ...g,
      startsIn: getRelativeTime(g.startTime),
      timeWindow: g.startTime === g.endTime
        ? `${formatDate(g.startTime)} at ${formatTime(g.startTime)}`
        : `${formatDate(g.startTime)} ${formatTime(g.startTime)} – ${formatTime(g.endTime)}`,
    })).sort((a, b) => (sevOrder[a.severity] ?? 9) - (sevOrder[b.severity] ?? 9));

    res.json({ success: true, alerts: enriched });

  } catch (error) {
    console.error('❌ Forecast alerts error:', error.message);
    res.status(500).json({ success: false, message: 'Error generating forecast alerts' });
  }
});

export default router;
