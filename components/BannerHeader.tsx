import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { normalizeCourseColor } from '@/utils/courseColor';

export interface BannerHeaderProps {
  height?: number;
  children?: React.ReactNode;
  paddingHorizontal?: number;
  paddingVertical?: number;
  rounded?: boolean;
  childrenPosition?: 'top' | 'bottom';
  absoluteChildren?: boolean; // when false, children render in normal flow with padding
  horizontalInset?: number;
  textShift?: number;
  backgroundScale?: number;
  backgroundShiftX?: number;
  backgroundShiftY?: number;
  backgroundAnchorX?: 'left' | 'center' | 'right';
  backgroundAnchorY?: 'top' | 'center' | 'bottom';
  backgroundMode?: 'cover' | 'contain';
  showText?: boolean;
  floating?: boolean;
  colorName?: 'red' | 'green' | 'purple' | 'blue'; // choose among provided variants
  allowTouchesThrough?: boolean; // when true, header won't intercept touches
  style?: any; // allow external style overrides (e.g., absolute layering)
}

export const BannerHeader: React.FC<BannerHeaderProps> = ({
  height = 208,
  children,
  paddingHorizontal = 24,
  paddingVertical = 16,
  rounded = true,
  childrenPosition = 'bottom',
  absoluteChildren = true,
  horizontalInset = 0,
  textShift = 0,
  backgroundScale = 1,
  backgroundShiftX = 0,
  backgroundShiftY = 0,
  backgroundAnchorX = 'center',
  backgroundAnchorY = 'center',
  backgroundMode = 'contain',
  showText = true,
  floating = false,
  colorName = 'blue',
  allowTouchesThrough = false,
  style,
}) => {
  const normalized = normalizeCourseColor(colorName);
  const fallbackBg = (
    normalized === 'red' ? '#7f1d1d' :
    normalized === 'green' ? '#065f46' :
    normalized === 'purple' ? '#4c1d95' :
    '#0f172a'
  );
  const [bgLoaded, setBgLoaded] = useState(false);
  let bg: any = null;
  let textImg: any = null;
  try {
    bg = (
  normalized === 'red' ? require('../assets/images/EduPlus_Banner_background_red.png') :
  normalized === 'green' ? require('../assets/images/EduPlus_Banner_background_green.png') :
  normalized === 'purple' ? require('../assets/images/EduPlus_Banner_background_purple.png') :
      require('../assets/images/EduPlus_Banner_background.png') // blue/original
    );
  } catch {}
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
      if (backgroundAnchorY === 'top') ty += -extraH / 2;
      else if (backgroundAnchorY === 'bottom') ty += extraH / 2;
    }
    return { tx, ty };
  };
  const { tx, ty } = translateFromAnchor();

  const contentPosition = (
    backgroundAnchorY === 'top' && backgroundAnchorX === 'left' ? 'top-left' :
    backgroundAnchorY === 'top' && backgroundAnchorX === 'right' ? 'top-right' :
    backgroundAnchorY === 'bottom' && backgroundAnchorX === 'left' ? 'bottom-left' :
    backgroundAnchorY === 'bottom' && backgroundAnchorX === 'right' ? 'bottom-right' :
    backgroundAnchorY === 'top' ? 'top' :
    backgroundAnchorY === 'bottom' ? 'bottom' :
    backgroundAnchorX === 'left' ? 'left' :
    backgroundAnchorX === 'right' ? 'right' :
    'center'
  ) as any;

  const baseBgStyle = [
    StyleSheet.absoluteFillObject,
    (backgroundScale !== 1 || backgroundShiftX || backgroundShiftY)
      ? { transform: [
          ...(tx ? [{ translateX: tx }] : []),
          ...(ty ? [{ translateY: ty }] : []),
          ...(backgroundScale !== 1 ? [{ scale: backgroundScale }] : []),
        ] }
      : null,
  ];

  return (
    <View
      style={[
        styles.container,
        floating && { position: 'relative' },
        {
          height,
          left: floating ? undefined : horizontalInset,
          right: floating ? undefined : horizontalInset,
          borderBottomLeftRadius: rounded ? 24 : 0,
          borderBottomRightRadius: rounded ? 24 : 0,
          top: floating ? undefined : 0,
          // Always keep a solid background to prevent white flash during layout changes
          backgroundColor: fallbackBg,
        },
        style,
      ]}
      pointerEvents={allowTouchesThrough ? 'none' : undefined}
      onLayout={(e) => {
        const { width, height: h } = e.nativeEvent.layout;
        if (width && h && (width !== layout.width || h !== layout.height)) setLayout({ width, height: h });
      }}
    >
      {/* Fallback solid color until image loads (reduces white flash) */}
      {!bgLoaded && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: fallbackBg }]} />
      )}
      {bg && (
        <ExpoImage
          source={bg}
          contentFit={backgroundMode}
          contentPosition={contentPosition}
          style={baseBgStyle as any}
          cachePolicy="memory-disk"
          priority="high"
          // Avoid toggling bgLoaded back to false on re-layout; this reduces flashing
          onLoadEnd={() => setBgLoaded(true)}
        />
      )}

      {/* Removed dynamic overlays; using baked-in variant images */}

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
        absoluteChildren ? (
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
        ) : (
          <View style={{ paddingHorizontal, paddingVertical }}>
            {children}
          </View>
        )
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Position is applied dynamically based on `floating` prop to avoid unintended gaps
    overflow: 'hidden',
    backgroundColor: 'transparent',
    width: '100%',
  },
});

export default BannerHeader;
