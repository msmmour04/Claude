import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, borderRadius, shadows } from '../theme';

const GlassCard = ({
  children,
  style,
  intensity = 20,
  borderRadiusSize = borderRadius.xl,
  showBorder = true,
  noPadding = false,
}) => {
  return (
    <View
      style={[
        styles.card,
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
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
    ...shadows.medium,
  },
  border: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  padding: {
    padding: 16,
  },
});

export default GlassCard;
