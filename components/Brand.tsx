import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

// Central brand components: Logo (icon only) and Logotype (icon + wordmark)
// The assets would ideally be placed in /assets; using a placeholder gradient shape for now.

// Expect actual logo asset placed at assets/logo.png (square) and assets/banner.png (wide)
// Provide fallbacks if not present.
export function Logo({ size = 56 }: { size?: number }) {
  // Use the provided EduPlus logo. Fallback to a teal block if missing.
  let src: any;
  try { src = require('../assets/images/EduPlus logo_blue.png'); } catch { src = null; }
  return (
    <View style={[styles.logoWrapper, { width: size, height: size, borderRadius: size * 0.25 }]}> 
      {src ? (
        <Image source={src} resizeMode="contain" style={{ width: size * 0.9, height: size * 0.9 }} />
      ) : (
        <View style={{ width: size * 0.9, height: size * 0.9, backgroundColor:'#00AFC8', borderRadius: 8 }} />
      )}
    </View>
  );
}

export function Logotype({ height = 64 }: { height?: number }) {
  return (
    <View style={styles.row}> 
      <Logo size={height} />
      <Text style={[styles.wordmark, { fontSize: height * 0.5 }]}>EDUPLUS</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    backgroundColor: '#2B0D52',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00AFC8',
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  wordmark: {
    fontWeight: '800',
    letterSpacing: 1,
    color: 'white',
  },
});

export function BrandBanner() {
  let src: any;
  try { src = require('../assets/images/EduPlus_Banner_v3.png'); } catch { src = null; }
  return (
    <View style={stylesBanner.container}>
      {src ? (
        <Image source={src} resizeMode="contain" style={{ width: '100%', height: 120 }} />
      ) : (
        <Logotype height={72} />
      )}
    </View>
  );
}

const stylesBanner = StyleSheet.create({
  container: {
    paddingVertical: 48,
    paddingHorizontal: 32,
    backgroundColor: '#2B0D52',
    position: 'relative',
  },
});
