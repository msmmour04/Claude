import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

const formatCurrency = (value) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
};

const PlatformCard = ({
  name,
  balance,
  change24h,
  gradient,
  icon,
  assets = [],
  onPress,
}) => {
  const isPositive = change24h >= 0;
  const changeColor = change24h === 0
    ? colors.textSecondary
    : isPositive
    ? colors.successGreen
    : colors.dangerRed;
  const changeSign = isPositive && change24h !== 0 ? '+' : '';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.touchable}>
      <LinearGradient
        colors={gradient || ['#1a1a2e', '#16213e']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Glow overlay */}
        <View style={[styles.glowOverlay, { backgroundColor: (gradient?.[0] || '#007AFF') + '15' }]} />

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={styles.iconText}>{icon || name?.[0] || '?'}</Text>
          </View>
          <View style={styles.changeContainer}>
            <Text style={[styles.changeText, { color: changeColor }]}>
              {changeSign}{change24h.toFixed(2)}%
            </Text>
          </View>
        </View>

        {/* Platform name */}
        <Text style={styles.platformName}>{name}</Text>

        {/* Balance */}
        <Text style={styles.balance}>{formatCurrency(balance)}</Text>

        {/* Assets */}
        {assets.length > 0 && (
          <View style={styles.assetsRow}>
            {assets.slice(0, 3).map((asset, i) => (
              <View key={i} style={styles.assetPill}>
                <Text style={styles.assetText}>{asset}</Text>
              </View>
            ))}
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    marginRight: 12,
    ...shadows.large,
  },
  card: {
    width: 175,
    height: 140,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  changeContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.round,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balance: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  assetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  assetPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  assetText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.3,
  },
});

export default PlatformCard;
