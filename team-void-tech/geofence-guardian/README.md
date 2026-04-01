# Geofence Guardian – Mobile Safe Zone Tracking

A mobile-first geofencing feature module built with Next.js (App Router), TypeScript, Tailwind CSS v4, Capacitor, and OpenStreetMap + Leaflet.js.

![Geofence Guardian](/geofence-demo.png)

## Overview
This module tracks a user's location via their device's native GPS and allows them to define a safe zone (geofence) around their current location. If they wander outside this radius, it triggers a local notification alert using Capacitor's Local Notifications API.

### Key Features
- **No API Keys Needed**: Uses free OpenStreetMap tiles + Leaflet.
- **Native GPS**: Direct integration with Capacitor Geolocation for background-ready location tracking.
- **Local Notifications**: Triggers native device notifications automatically when exiting the safe zone.
- **Offline Capable UI**: Next.js is configured for `output: 'export'` making it a flawless PWA / Capacitor App.

## Setup Instructions

### 1. Requirements
- Node.js 18+
- Android Studio (for Android build)
- Capacitor CLI

### 2. Installation
```bash
npm install
```

### 3. Running for Web (Development)
> Note: In the browser, Geolocation works but you won't get native local notifications.
```bash
npm run dev
```

### 4. Running on Android (Capacitor)
You need to build the Next.js static export first, then sync Capacitor:
```bash
npm run build
npx cap sync android
npx cap open android
```
Once Android Studio opens, run the project on an emulator or physical device.

## Integration Guide

To extract this feature and embed it into another app:
1. **Copy the code files:**
   - Copy `src/app/geofence` to your Next.js `app` folder.
   - Copy `src/components`, `src/services`, `src/utils`, and `src/types` to their corresponding places in your project structure.
2. **Install Depedencies:**
   ```bash
   npm install leaflet react-leaflet
   npm install @capacitor/core @capacitor/geolocation @capacitor/local-notifications
   ```
3. **Configure Capacitor Plugins:** Ensure your main project has Android/iOS platforms added via Capacitor. Native GPS and Local Notifications require explicit permissions in `AndroidManifest.xml` (the CLI plugins usually add these automatically, but always verify).

## Architecture

- **`geofence/page.tsx`**: The orchestrator. Connects UI state with Capacitor APIs.
- **`components/MapView.tsx`**: Uses Leaflet.js (`react-leaflet`). Dynamically imported to prevent Next.js SSR crashes (since maps require the `window` object).
- **`services/locationService.ts`**: Wrapper for `@capacitor/geolocation`.
- **`services/notificationService.ts`**: Wrapper for `@capacitor/local-notifications`. Includes debounce logic to prevent alert spamming.
- **`utils/geofence.ts`**: Pure functions containing the math for distance calculation (Haversine formula).
