// Initialize gesture handler BEFORE any other imports
import 'react-native-gesture-handler';
// Polyfill removed RN ViewPropTypes for older libs (e.g., react-native-swipeable)
try {
	const RN = require('react-native');
	// Quiet known noisy warnings in dev from legacy libraries
	try {
		const { LogBox } = RN;
		LogBox.ignoreLogs([
			'SafeAreaView has been deprecated',
			'Animated.event now requires a second argument for options',
			'componentWillMount has been renamed',
			"Animated: `useNativeDriver` was not specified",
			'Animated:', // catch-all to quiet legacy lib spam during swipe gestures
		]);
	} catch {}
	if (!RN.ViewPropTypes) {
		const { ViewPropTypes } = require('deprecated-react-native-prop-types');
		RN.ViewPropTypes = ViewPropTypes;
	}
} catch {}
// Initialize NativeWind runtime and explicit cssInterop as early as possible
import 'nativewind';
import './styles/nativewind-interop';
import 'expo-router/entry';
