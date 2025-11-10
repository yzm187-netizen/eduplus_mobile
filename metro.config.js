const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Point NativeWind to the same CSS used by the app's root layout
// Keeping the CSS under app/ is safe (Expo Router only scans js/ts for routes)
module.exports = withNativeWind(config, { input: './app/globals.css' });