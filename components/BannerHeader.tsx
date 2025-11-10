import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface BannerHeaderProps {
  height?: number; // pixel height of banner area
  children?: React.ReactNode; // overlay content (texts, metrics, etc.)
  paddingHorizontal?: number; // horizontal inset for overlay
  paddingVertical?: number; // vertical inset for overlay
  rounded?: boolean; // apply rounded bottom corners
}

// Generic banner header that layers background and text assets with optional children overlay
export const BannerHeader: React.FC<BannerHeaderProps> = ({
  height = 224,
  children,
  paddingHorizontal = 24,
  paddingVertical = 16,
  rounded = true,
}) => {
  let bg: any = null;
  let textImg: any = null;
  try { bg = require('../assets/images/EduPlus_Banner_background.png'); } catch {}
  try { textImg = require('../assets/images/EduPlus_Banner_text.png'); } catch {}

  return (
    <View style={[styles.container, { height, borderBottomLeftRadius: rounded ? 24 : 0, borderBottomRightRadius: rounded ? 24 : 0 }]}>      
      {bg && (
        <Image source={bg} resizeMode="cover" style={StyleSheet.absoluteFillObject} />
      )}
      {textImg && (
        <Image source={textImg} resizeMode="contain" style={[StyleSheet.absoluteFillObject, { left: paddingHorizontal, right: paddingHorizontal }]} />
      )}
      {children ? (
        <View style={{ position: 'absolute', bottom: paddingVertical, left: paddingHorizontal, right: paddingHorizontal }}>
          {children}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    overflow: 'hidden',
    backgroundColor: '#2B0D52', // fallback if bg image missing
  },
});

export default BannerHeader;
