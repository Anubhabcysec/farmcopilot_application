
🌾 Farm Copilot — Android
Smart Farming, Simplified. Now in your pocket.
The official Android app for Farm Copilot — AI-powered crop diagnosis, disease treatment, product ordering, and personalized farming recommendations, built on the same platform as the web app.
---
📖 Table of Contents
About
Features
Tech Stack
Getting Started
Related Repos
Contributors
License
---
🌱 About
This repository contains the Android version of Farm Copilot, built using the same core stack as the web application so both platforms stay consistent in features and design. It brings the full farming assistant — AI crop diagnosis, multilingual advisory, treatment lookup, weather & disease risk forecasting, vendor ordering, and NPK soil analysis — directly to farmers' phones.
> For the full list of platform capabilities and how the AI/backend works, see the [web app README](https://github.com/Anubhabcysec/Farm_Copilot).
---
✨ Features
🩺 AI Advisory — Upload crop photos or ask questions in 11 regional languages, right from your phone camera/gallery.
💊 Treatment Lookup — Get disease-specific treatment recommendations with nearby vendors within a 10 km radius.
🌦️ Weather & Disease Risk — Real-time weather using device location, with AI-predicted outbreak risk alerts.
🛒 Orders — Order fertilizers, pesticides, and other agri-products from local vendors, with live stock and delivery tracking.
🚜 Equipment Rental — Rent farming equipment from nearby vendors.
📍 Nearby Vendors — Map-based discovery of agri-shops and vendors near you.
🧪 Soil Test — Connect an NPK meter or enter readings manually; get AI-driven soil analysis and recommendations.
🗺️ My Farms — Manage multiple farms on the go.
---
🛠️ Tech Stack
<div align="center">
Layer	Technologies
App	React (Vite), TypeScript, Tailwind CSS
Platform	Android (packaged from the shared web codebase)
Backend	Node.js, Express (shared with the web app)
Integrations	Maps API, Live Weather API, AI/ML models for crop & soil analysis
</div>
---
⚙️ Getting Started
Prerequisites
Node.js (v18+ recommended)
npm
Android Studio (for building/running the Android app)
Installation
```bash
# 1. Clone the repository
git clone https://github.com/Anubhabcysec/<android-repo-name>.git
cd <android-repo-name>

# 2. Install dependencies
npm install

# 3. Run in development
npm run dev

# 4. Build and open in Android Studio
npm run build
npx cap sync android
npx cap open android
```
> ⚠️ Update the build/sync commands above if your project uses a different setup (e.g. plain Android Studio project instead of Capacitor/Cordova).
---
🔗 Related Repos
Platform	Repo
🌐 Web App	Farm_Copilot
📱 Android App	You're here
---
🤝 Contributors
<a href="https://github.com/Anubhabcysec">
  <img src="https://github.com/Anubhabcysec.png" width="60" style="border-radius:50%" />
</a>
Anubhab
---
📄 License
This project currently has no license specified. Add one (e.g. MIT) if you plan to open-source it.
<div align="center">
Made with 🌾 for farmers.
</div>
