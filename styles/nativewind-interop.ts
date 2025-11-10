// Ensure className works on core components and common containers across all environments
import { cssInterop } from 'nativewind';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Map className -> style
cssInterop(View, { className: 'style' });
cssInterop(Text, { className: 'style' });
cssInterop(Image, { className: 'style' });
cssInterop(ScrollView, { className: 'style', contentContainerClassName: 'contentContainerStyle' });
cssInterop(Pressable, { className: 'style' });
cssInterop(TouchableOpacity as any, { className: 'style' });
cssInterop(SafeAreaView as any, { className: 'style' });

export {};
