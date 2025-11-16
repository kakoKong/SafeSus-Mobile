# SafeSus Mobile

A React Native mobile application for SafeSus - a safety intelligence platform for travelers in Thailand. Built with Expo and Mapbox GL.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)
- Mapbox Access Token (get one at https://account.mapbox.com/)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Mapbox Access Token:**
   
   Edit `app.json` and add your Mapbox access token:
   ```json
   {
     "expo": {
       "extra": {
         "mapboxAccessToken": "YOUR_MAPBOX_ACCESS_TOKEN_HERE"
       }
     }
   }
   ```

3. **Configure API URL (if needed):**
   
   The app is configured to use `https://safesus.com/api` by default. To use a different API endpoint, update `app.json`:
   ```json
   {
     "expo": {
       "extra": {
         "apiUrl": "YOUR_API_URL_HERE"
       }
     }
   }
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Run on your preferred platform:**
   - **iOS:** `npm run ios`
   - **Android:** `npm run android`
   - **Web:** `npm run web`

## 📱 Features

### Core Features

1. **SafeMap** - Color-coded safety zones (Safe, Watch, Caution, Avoid) for cities
2. **SafeAlert** - Real-time safety tips and warnings from the community
3. **Live Mode** - Location-based alerts for nearby safety issues (within 500m)
4. **City Coverage** - Browse safety data for supported cities
5. **Community Contributions** - Submit safety tips and incident pins

### Screens

- **Home Screen** - Browse cities, view recent safety tips, quick actions
- **City Detail Screen** - View detailed safety map with zones and pins for a specific city
- **Live Screen** - Real-time safety alerts based on your current location
- **Submit Screen** - Submit safety tips or incident pins to help the community

## 🏗️ Project Structure

```
SafeSus-Mobile/
├── App.tsx                    # Main app component
├── app.json                   # Expo configuration
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── index.ts                   # Entry point
├── Document.md                # API documentation
├── assets/                    # App icons and splash screen
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
└── src/
    ├── components/
    │   └── MapComponent.tsx   # Mapbox GL map component
    ├── config/
    │   └── constants.ts       # App configuration
    ├── lib/
    │   ├── api.ts             # API client with all endpoints
    │   └── supabase.ts        # Supabase client
    ├── navigation/
    │   └── MainTabNavigator.tsx # Bottom tab navigation
    ├── screens/
    │   ├── HomeScreen.tsx     # Home/cities screen
    │   ├── CityDetailScreen.tsx # City detail with map
    │   ├── LiveScreen.tsx     # Live location-based alerts
    │   └── SubmitScreen.tsx   # Submit tips/pins
    └── types/
        └── index.ts           # TypeScript type definitions
```

## 🛠️ Technology Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type-safe development
- **Mapbox GL** (`@rnmapbox/maps`) - Map rendering
- **React Navigation** - Navigation
- **Supabase** - Authentication
- **Expo Location** - Location services

## 📡 API Integration

The app integrates with the SafeSus API. See `Document.md` for complete API documentation.

### Key Endpoints Used:
- `GET /api/cities` - Get all supported cities
- `GET /api/city/[slug]` - Get city details with zones, pins, and tips
- `GET /api/live/nearby` - Get nearby safety data based on location
- `GET /api/recent-tips` - Get recent safety tips
- `POST /api/submit-tip` - Submit a safety tip
- `POST /api/submit-pin` - Submit an incident pin

## 🗺️ Map Features

- **Zone Rendering** - Color-coded polygons for safety zones
  - Green: Recommended/Safe zones
  - Blue: Neutral zones
  - Yellow: Caution zones
  - Red: Avoid zones
- **Pin Markers** - Location markers for incidents
  - Scam (red)
  - Harassment (orange)
  - Overcharge (purple)
  - Other (blue)
- **Interactive Features** - Tap zones/pins for details, zoom to location
- **Filters** - Toggle visibility of different zone and pin types
- **Legend** - Visual guide for map symbols

## 🔐 Authentication

The app uses Supabase for authentication:
- Anonymous sign-in for basic features
- Full authentication for submitting tips
- Guest mode available for pin submissions

## 📦 Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Run on iOS simulator
- `npm run android` - Run on Android emulator/device
- `npm run web` - Run in web browser

## 🚀 Deployment

When ready to deploy:

1. **Build for production:**
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

2. **Submit to app stores:**
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

## 📝 Configuration

### Required Configuration

1. **Mapbox Access Token** - Required for map rendering
   - Get your token at https://account.mapbox.com/
   - Add to `app.json` → `extra.mapboxAccessToken`

2. **API URL** - Defaults to `https://safesus.com/api`
   - Update in `app.json` → `extra.apiUrl` if needed

3. **Supabase** - Already configured
   - URL and keys in `app.json` → `extra`

### Optional Configuration

- Location permissions are already configured in `app.json`
- Customize app name, icon, and splash screen in `app.json`

## 🐛 Troubleshooting

### Map not showing
- Ensure Mapbox access token is configured in `app.json`
- Check that `@rnmapbox/maps` is properly installed
- For iOS, you may need to run `pod install` in the `ios` directory

### API errors
- Verify API URL is correct in `app.json`
- Check network connectivity
- Ensure API server is running and accessible

### Location not working
- Grant location permissions when prompted
- Check device location settings
- For iOS, ensure location permissions are configured in `app.json`

## 📄 License

This project is private and proprietary.

---

**Built with ❤️ using React Native, Expo, and Mapbox GL**
# SafeSus-Mobile
