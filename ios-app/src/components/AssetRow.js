import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import SparklineChart from './SparklineChart';
import { colors, typography, spacing, borderRadius } from '../theme';

const ASSET_COLORS = {
  BTC: '#F7931A',
  ETH: '#627EEA',
  SOL: '#9945FF',
  ADA: '#0033AD',
  DOT: '#E6007A',
  AVAX: '#E84142',
  LINK: '#2A5ADA',
  MATIC: '#8247E5',
  DOGE: '#C3A634',
  XRP: '#00AAE4',
  AAPL: '#555555',
  TSLA: '#CC0000',
  MSFT: '#00A4EF',
  GOOGL: '#4285F4',
  AMZN: '#FF9900',
  NVDA: '#76B900',
  META: '#1877F2',
  NFLX: '#E50914',
};

const getAssetColor = (symbol) =>
  ASSET_COLORS[symbol] || colors.accentBlue;

const formatPrice = (price) => {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
};

const AssetRow = ({ item, rank, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 20,
    }).start();
  };

  const isPositive = item.change24h >= 0;
  const assetColor = getAssetColor(item.symbol);
  const sparkColor = isPositive ? colors.successGreen : colors.dangerRed;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.container}
      >
        {/* Rank */}
        <Text style={styles.rank}>{rank}</Text>

        {/* Icon */}
        <View style={[styles.icon, { backgroundColor: assetColor + '20', borderColor: assetColor + '40' }]}>
          <Text style={[styles.iconText, { color: assetColor }]}>
            {item.symbol?.[0] || '?'}
          </Text>
        </View>

        {/* Name & symbol */}
        <View style={styles.nameContainer}>
          <Text style={styles.assetName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.assetSymbol}>{item.symbol}</Text>
        </View>

        {/* Sparkline */}
        <View style={styles.sparkContainer}>
          <SparklineChart
            data={item.sparkline || []}
            width={56}
            height={28}
            color={sparkColor}
            strokeWidth={1.5}
          />
        </View>

        {/* Price & change */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <View style={[
            styles.changePill,
            { backgroundColor: isPositive ? colors.successGreen + '20' : colors.dangerRed + '20' }
          ]}>
            <Text style={[
              styles.changeText,
              { color: isPositive ? colors.successGreen : colors.dangerRed }
            ]}>
              {isPositive ? '+' : ''}{item.change24h?.toFixed(2)}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 24,
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    textAlign: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  iconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  nameContainer: {
    flex: 1,
    marginLeft: 10,
  },
  assetName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  assetSymbol: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  sparkContainer: {
    marginHorizontal: 8,
  },
  priceContainer: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  changePill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.round,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default AssetRow;
