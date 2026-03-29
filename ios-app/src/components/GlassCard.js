import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors, borderRadius, shadows } from '../theme';

const GlassCard = ({
  children,
  style,
  intensity = 20,
  borderRadiusSize = borderRadius.xl,
  showBorder = true,
  noPadding = false,
}) => {
  if (Platform.OS === 'ios') {
    return (
      <View style={[styles.container, { borderRadius: borderRadiusSize }, style]}>
        <BlurView
          intensity={intensity}
          tint="dark"
          style={[
            styles.blur,
            { borderRadius: borderRadiusSize },
          ]}
        >
          <View
            style={[
              styles.overlay,
              showBorder && styles.border,
              { borderRadius: borderRadiusSize },
              !noPadding && styles.padding,
            ]}
          >
            {children}
          </View>
        </BlurView>
      </View>
    );
  }

  // Android fallback
  return (
    <View
      style={[
        styles.androidCard,
        showBorder && styles.border,
        { borderRadius: borderRadiusSize },
        !noPadding && styles.padding,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    ...shadows.medium,
  },
  blur: {
    overflow: 'hidden',
  },
  overlay: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  border: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  padding: {
    padding: 16,
  },
  androidCard: {
    backgroundColor: colors.surfaceElevated,
    ...shadows.medium,
  },
});

export default GlassCard;
