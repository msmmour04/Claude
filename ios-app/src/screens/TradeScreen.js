import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { placeOrder, getOpenOrders } from '../api/client';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AVAILABLE_ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', price: 64821.30, available: 1.2840 },
  { symbol: 'ETH', name: 'Ethereum', price: 3412.80, available: 8.420 },
  { symbol: 'SOL', name: 'Solana', price: 189.45, available: 142.5 },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 189.42, available: 52 },
  { symbol: 'TSLA', name: 'Tesla', price: 248.80, available: 24 },
];

const ASSET_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF',
  AAPL: '#A2AAAD', TSLA: '#CC0000',
};

const QUICK_AMOUNTS = [10, 50, 100, 500];

const MOCK_OPEN_ORDERS = [
  { id: 'ord1', symbol: 'BTC', side: 'buy', type: 'limit', amount: 250, price: 62000, status: 'open', date: '2024-01-15' },
  { id: 'ord2', symbol: 'ETH', side: 'sell', type: 'limit', amount: 500, price: 3600, status: 'open', date: '2024-01-14' },
];

const FEE_RATE = 0.0026;

export default function TradeScreen() {
  const insets = useSafeAreaInsets();
  const [side, setSide] = useState('buy'); // 'buy' | 'sell'
  const [orderType, setOrderType] = useState('market'); // 'market' | 'limit'
  const [assetIndex, setAssetIndex] = useState(0);
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [openOrders, setOpenOrders] = useState(MOCK_OPEN_ORDERS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const summaryAnim = useRef(new Animated.Value(0)).current;
  const limitFieldAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const asset = AVAILABLE_ASSETS[assetIndex];
  const numericAmount = parseFloat(amount) || 0;
  const fee = numericAmount * FEE_RATE;
  const total = numericAmount + fee;
  const availableBalance = 24000; // mock cash balance

  useEffect(() => {
    Animated.timing(summaryAnim, {
      toValue: numericAmount > 0 ? 1 : 0,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [numericAmount]);

  useEffect(() => {
    Animated.timing(limitFieldAnim, {
      toValue: orderType === 'limit' ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [orderType]);

  useEffect(() => {
    // Pulse animation for price
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const cycleAsset = () => {
    setAssetIndex((prev) => (prev + 1) % AVAILABLE_ASSETS.length);
    setAmount('');
    setLimitPrice('');
  };

  const setQuickAmount = (val) => {
    setAmount(String(val));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setOpenOrders(MOCK_OPEN_ORDERS);
      setRefreshing(false);
    }, 1000);
  }, []);

  const handlePlaceOrder = async () => {
    if (numericAmount <= 0) return;
    setLoading(true);
    try {
      await placeOrder({
        symbol: asset.symbol,
        side,
        type: orderType,
        amount: numericAmount,
        price: orderType === 'limit' ? parseFloat(limitPrice) : asset.price,
      });
    } catch {
      // Mock success
    }
    setLoading(false);
    setOrderPlaced(true);
    Animated.sequence([
      Animated.timing(successAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(successAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setAmount('');
      setLimitPrice('');
      setOrderPlaced(false);
    });
  };

  const cancelOrder = (id) => {
    setOpenOrders((prev) => prev.filter((o) => o.id !== id));
  };

  const limitFieldHeight = limitFieldAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 72],
  });

  const summaryOpacity = summaryAnim;
  const summaryTranslate = summaryAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <LinearGradient
          colors={['rgba(191,90,242,0.10)', 'transparent']}
          style={styles.headerGrad}
          pointerEvents="none"
        />
        <View style={styles.header}>
          <Text style={styles.title}>Trade</Text>
        </View>

        {/* Asset Selector */}
        <GlassCard style={styles.assetSelector}>
          <TouchableOpacity
            onPress={cycleAsset}
            activeOpacity={0.75}
            style={styles.assetSelectorInner}
          >
            <View style={[
              styles.assetIconCircle,
              { backgroundColor: (ASSET_COLORS[asset.symbol] || colors.accentBlue) + '20',
                borderColor: (ASSET_COLORS[asset.symbol] || colors.accentBlue) + '50' },
            ]}>
              <Text style={[styles.assetInitial, { color: ASSET_COLORS[asset.symbol] || colors.accentBlue }]}>
                {asset.symbol[0]}
              </Text>
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetSymbol}>{asset.symbol}</Text>
              <Text style={styles.assetName}>{asset.name}</Text>
            </View>
            <View style={styles.assetRight}>
              <Animated.Text style={[styles.assetPrice, { transform: [{ scale: pulseAnim }] }]}>
                ${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Animated.Text>
              <Text style={styles.assetChangeHint}>Tap to change ›</Text>
            </View>
          </TouchableOpacity>
        </GlassCard>

        {/* Order Card */}
        <GlassCard style={styles.orderCard}>
          {/* Buy / Sell toggle */}
          <View style={styles.sideToggle}>
            <TouchableOpacity
              onPress={() => setSide('buy')}
              activeOpacity={0.8}
              style={[styles.sideButton, side === 'buy' && styles.sideButtonActiveBuy]}
            >
              {side === 'buy' && (
                <LinearGradient
                  colors={['rgba(48,209,88,0.25)', 'rgba(48,209,88,0.10)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text style={[
                styles.sideButtonText,
                { color: side === 'buy' ? colors.success : colors.textSecondary },
              ]}>
                Buy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSide('sell')}
              activeOpacity={0.8}
              style={[styles.sideButton, side === 'sell' && styles.sideButtonActiveSell]}
            >
              {side === 'sell' && (
                <LinearGradient
                  colors={['rgba(255,69,58,0.25)', 'rgba(255,69,58,0.10)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <Text style={[
                styles.sideButtonText,
                { color: side === 'sell' ? colors.danger : colors.textSecondary },
              ]}>
                Sell
              </Text>
            </TouchableOpacity>
          </View>

          {/* Amount input */}
          <View style={styles.amountSection}>
            <Text style={styles.inputLabel}>Amount (USD)</Text>
            <View style={styles.amountRow}>
              <Text style={styles.dollarPrefix}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="rgba(255,255,255,0.2)"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Quick amounts */}
          <View style={styles.quickAmountsRow}>
            {QUICK_AMOUNTS.map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setQuickAmount(val)}
                style={[
                  styles.quickAmountPill,
                  amount === String(val) && styles.quickAmountActive,
                ]}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.quickAmountText,
                  amount === String(val) && { color: colors.accentBlue },
                ]}>
                  ${val}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.quickAmountPill,
                !QUICK_AMOUNTS.map(String).includes(amount) && amount.length > 0 && styles.quickAmountActive,
              ]}
              onPress={() => setAmount('')}
              activeOpacity={0.7}
            >
              <Text style={styles.quickAmountText}>Custom</Text>
            </TouchableOpacity>
          </View>

          {/* Order type */}
          <View style={styles.orderTypeRow}>
            <Text style={styles.inputLabel}>Order Type</Text>
            <View style={styles.orderTypeToggle}>
              {['market', 'limit'].map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setOrderType(t)}
                  style={[
                    styles.orderTypeBtn,
                    orderType === t && styles.orderTypeBtnActive,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.orderTypeBtnText,
                    { color: orderType === t ? colors.textPrimary : colors.textSecondary },
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Limit price field (animated) */}
          <Animated.View style={[styles.limitField, { height: limitFieldHeight, overflow: 'hidden' }]}>
            <View style={styles.limitFieldInner}>
              <Text style={styles.inputLabel}>Limit Price</Text>
              <View style={styles.limitInputRow}>
                <Text style={styles.dollarPrefix}>$</Text>
                <TextInput
                  style={styles.limitInput}
                  value={limitPrice}
                  onChangeText={setLimitPrice}
                  keyboardType="decimal-pad"
                  placeholder={asset.price.toFixed(2)}
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  returnKeyType="done"
                />
              </View>
            </View>
          </Animated.View>

          {/* Available balance */}
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceValue}>
              ${availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </GlassCard>

        {/* Order Summary */}
        <Animated.View style={[
          styles.summaryWrapper,
          {
            opacity: summaryOpacity,
            transform: [{ translateY: summaryTranslate }],
          },
        ]}>
          <GlassCard style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRows}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Amount</Text>
                <Text style={styles.summaryValue}>${numericAmount.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fee (0.26%)</Text>
                <Text style={styles.summaryValue}>${fee.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                <Text style={styles.summaryTotalLabel}>Total</Text>
                <Text style={styles.summaryTotalValue}>${total.toFixed(2)}</Text>
              </View>
            </View>

            {/* Place order button */}
            <TouchableOpacity
              onPress={handlePlaceOrder}
              disabled={loading || numericAmount <= 0}
              activeOpacity={0.85}
              style={{ borderRadius: 16, overflow: 'hidden', marginTop: spacing.md }}
            >
              <LinearGradient
                colors={side === 'buy' ? ['#30D158', '#25A244'] : [colors.danger, '#CC3030']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.placeOrderBtn}
              >
                {loading ? (
                  <Text style={styles.placeOrderText}>Processing...</Text>
                ) : orderPlaced ? (
                  <Text style={styles.placeOrderText}>Order Placed!</Text>
                ) : (
                  <Text style={styles.placeOrderText}>
                    {side === 'buy' ? 'Buy' : 'Sell'} {asset.symbol}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </Animated.View>

        {/* Open Orders */}
        {openOrders.length > 0 && (
          <View style={styles.openOrdersSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Open Orders</Text>
              <View style={styles.orderCountBadge}>
                <Text style={styles.orderCountText}>{openOrders.length}</Text>
              </View>
            </View>

            <GlassCard noPadding style={styles.openOrdersList}>
              {openOrders.map((order, index) => (
                <View
                  key={order.id}
                  style={[
                    styles.openOrderRow,
                    index < openOrders.length - 1 && styles.openOrderBorder,
                  ]}
                >
                  <View style={[
                    styles.orderSideBadge,
                    { backgroundColor: order.side === 'buy' ? 'rgba(48,209,88,0.15)' : 'rgba(255,69,58,0.15)' },
                  ]}>
                    <Text style={[
                      styles.orderSideText,
                      { color: order.side === 'buy' ? colors.success : colors.danger },
                    ]}>
                      {order.side.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.openOrderInfo}>
                    <Text style={styles.openOrderSymbol}>{order.symbol}</Text>
                    <Text style={styles.openOrderDetails}>
                      {order.type} · ${order.amount} @ ${order.price.toLocaleString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => cancelOrder(order.id)}
                    style={styles.cancelButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </GlassCard>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 8,
  },
  headerGrad: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  assetSelector: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
  },
  assetSelectorInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assetIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  assetInitial: {
    fontSize: 20,
    fontWeight: '700',
  },
  assetInfo: {
    flex: 1,
    marginLeft: 12,
  },
  assetSymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  assetName: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  assetRight: {
    alignItems: 'flex-end',
  },
  assetPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  assetChangeHint: {
    fontSize: 11,
    color: colors.accentBlue,
    marginTop: 3,
  },
  orderCard: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
  },
  sideToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 3,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sideButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    overflow: 'hidden',
  },
  sideButtonActiveBuy: {
    borderWidth: 1,
    borderColor: 'rgba(48,209,88,0.3)',
  },
  sideButtonActiveSell: {
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
  },
  sideButtonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  amountSection: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  dollarPrefix: {
    fontSize: 28,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.5)',
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 36,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
    padding: 0,
  },
  quickAmountsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  quickAmountPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickAmountActive: {
    borderColor: colors.accentBlue,
    backgroundColor: 'rgba(0,122,255,0.12)',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  orderTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  orderTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  orderTypeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  orderTypeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  orderTypeBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  limitField: {
    marginBottom: 0,
  },
  limitFieldInner: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  limitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  limitInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    padding: 0,
    letterSpacing: -0.5,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  balanceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentBlue,
  },
  summaryWrapper: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
  },
  summaryCard: {},
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },
  summaryRows: {
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  placeOrderBtn: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeOrderText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  openOrdersSection: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  orderCountBadge: {
    backgroundColor: colors.accentBlue,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  openOrdersList: {},
  openOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  openOrderBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderSideBadge: {
    width: 40,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  orderSideText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  openOrderInfo: {
    flex: 1,
  },
  openOrderSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  openOrderDetails: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
    backgroundColor: 'rgba(255,69,58,0.08)',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
  },
});
