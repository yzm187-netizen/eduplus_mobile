module.exports = function (api) {
    api.cache(true);
    return {
        // Important: nativewind/babel is a PRESET (not a plugin). Add to presets.
        presets: ['babel-preset-expo', 'nativewind/babel'],
        // Keep reanimated plugin last
        plugins: ['react-native-reanimated/plugin'],
    };
};
