const { getDefaultConfig } = require('expo/metro-config');

// Temporarily disable NativeWind Metro integration to isolate the Babel error
// We'll re-enable once bundling is stable.
module.exports = getDefaultConfig(__dirname);