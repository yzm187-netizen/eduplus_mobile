module.exports = function (api) {
    api.cache(true);
    return {
        // Important: nativewind/babel is a PRESET (not a plugin). Add to presets.
        // Pass jsxImportSource to ensure the automatic JSX runtime uses NativeWind.
        presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
        // Keep reanimated plugin last
        plugins: ['react-native-reanimated/plugin'],
    };
};
