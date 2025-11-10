import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';

export interface BannerHeaderProps {
  height?: number; // pixel height of banner area
  children?: React.ReactNode; // overlay content (texts, metrics, etc.)
  paddingHorizontal?: number; // horizontal inset for overlay
  paddingVertical?: number; // vertical inset for overlay
  rounded?: boolean; // apply rounded bottom corners
  childrenPosition?: 'top' | 'bottom'; // where to anchor overlay children
  horizontalInset?: number; // inset banner from screen edges to allow side overlap with following content
  textShift?: number; // horizontal shift (px) for the text image to expose teal accent areas
  backgroundScale?: number; // scale background image to zoom out (<1) or in (>1)
  backgroundShiftX?: number; // shift background image horizontally (px)
  backgroundShiftY?: number; // shift background image vertically (px)
  backgroundAnchorX?: 'left' | 'center' | 'right'; // anchor horizontal focus when scaling
  backgroundAnchorY?: 'top' | 'center' | 'bottom'; // anchor vertical focus when scaling
  backgroundMode?: 'cover' | 'contain'; // control resize mode; contain prevents stretching
  showText?: boolean; // toggle foreground text/logo layer
}

// Generic banner header that layers background and text assets with optional children overlay
export const BannerHeader: React.FC<BannerHeaderProps> = ({
  height = 208,
  children,
  paddingHorizontal = 24,
  paddingVertical = 16,
  rounded = true,
  childrenPosition = 'bottom',
  horizontalInset = 0,
  textShift = 0,
  backgroundScale = 1,
  backgroundShiftX = 0,
  backgroundShiftY = 0,
  backgroundAnchorX = 'center',
  backgroundAnchorY = 'center',
  backgroundMode = 'contain',
  showText = true,
}) => {
  let bg: any = null;
  let textImg: any = null;
  try { bg = require('../assets/images/EduPlus_Banner_background.png'); } catch {}
  try { textImg = require('../assets/images/EduPlus_Banner_text.png'); } catch {}

  const [layout, setLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const translateFromAnchor = () => {
    let tx = backgroundShiftX || 0;
    let ty = backgroundShiftY || 0;
    if (backgroundScale !== 1 && layout.width && layout.height) {
      const extraW = (backgroundScale - 1) * layout.width;
      const extraH = (backgroundScale - 1) * layout.height;
      if (backgroundAnchorX === 'left') tx += -extraW / 2;
      else if (backgroundAnchorX === 'right') tx += extraW / 2;
      // center => no change
      if (backgroundAnchorY === 'top') ty += -extraH / 2;
      else if (backgroundAnchorY === 'bottom') ty += extraH / 2;
      // center => no change
    }
    return { tx, ty };
  };
  const { tx, ty } = translateFromAnchor();

  return (
    <View
      style={[
        styles.container,
        {
          height,
          left: horizontalInset,
          right: horizontalInset,
          borderBottomLeftRadius: rounded ? 24 : 0,
          borderBottomRightRadius: rounded ? 24 : 0,
        },
      ]}
      onLayout={(e) => {
        const { width, height: h } = e.nativeEvent.layout;
        if (width && h && (width !== layout.width || h !== layout.height)) setLayout({ width, height: h });
      }}
    >
      {bg && (
        <ExpoImage
          source={bg}
          contentFit={backgroundMode}
          contentPosition="center"
          style={[
            StyleSheet.absoluteFillObject,
            (backgroundScale !== 1 || backgroundShiftX || backgroundShiftY)
              ? { transform: [
                  ...(tx ? [{ translateX: tx }] : []),
                  ...(ty ? [{ translateY: ty }] : []),
                  ...(backgroundScale !== 1 ? [{ scale: backgroundScale }] : []),
                ] }
              : null,
          ]}
        />
      )}
      {showText && textImg && (
        <ExpoImage
          source={textImg}
          contentFit="contain"
          contentPosition="center"
          style={[
            StyleSheet.absoluteFillObject,
            { left: paddingHorizontal, right: paddingHorizontal },
            textShift ? { transform: [{ translateX: textShift }] } : null,
          ]}
        />
      )}
      {children ? (
        <View
          style={{
            position: 'absolute',
            left: paddingHorizontal,
            right: paddingHorizontal,
            ...(childrenPosition === 'bottom'
              ? { bottom: paddingVertical }
              : { top: paddingVertical }),
          }}
        >
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
    backgroundColor: 'transparent',
  },
});

export default BannerHeader;
