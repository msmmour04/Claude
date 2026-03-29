import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import NetWorthHero from '../components/NetWorthHero';
import PlatformCard from '../components/PlatformCard';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getPortfolio, getCryptoMarket } from '../api/client';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const MOCK_PORTFOLIO = {
  totalNetWorth: 87432.18,
  change24h: 1243.50,
  changePct24h: 1.44,
  platforms: [
    { id: 'kraken', name: 'Kraken', balance: 34521.80, change24h: 2.1, assets: ['BTC', 'ETH', 'SOL'] },
    { id: 'public', name: 'Public', balance: 28910.38, change24h: -0.8, assets: ['AAPL', 'TSLA', 'NVDA'] },
    { id: 'bofa', name: 'BofA', balance: 24000.00, change24h: 0, assets: ['Cash'] },
  ],
  topHoldings: [
    { symbol: 'BTC', name: 'Bitcoin', balance: 18420.50, pnl: 2341.80, pnlPct: 14.58, color: '#F7931A' },
    { symbol: 'ETH', name: 'Ethereum', balance: 9240.30, pnl: -312.40, pnlPct: -3.27, color: '#627EEA' },
    { symbol: 'AAPL', name: 'Apple Inc.', balance: 12340.00, pnl: 890.20, pnlPct: 7.77, color: '#A2AAAD' },
    { symbol: 'TSLA', name: 'Tesla', balance: 6180.88, pnl: -214.30, pnlPct: -3.35, color: '#CC0000' },
  ],
};

const MOCK_CHART_DATA = [82000, 83200, 81800, 84500, 85100, 86200, 87432];

const PLATFORM_GRADIENTS = {
  kraken: ['#2D0050', '#6B21A8'],
  public: ['#001A4D', '#0047CC'],
  bofa: ['#0A1A0A', '#1A4D1A'],
};

const PLATFORM_ICONS = {
  kraken: 'K',
  public: 'P',
  bofa: 'B',
};

const QUICK_ACTIONS = [
  { id: 'buy', label: 'Buy', icon: '↑', color: colors.success, bg: 'rgba(48,209,88,0.15)' },
  { id: 'sell', label: 'Sell', icon: '↓', color: colors.danger, bg: 'rgba(255,69,58,0.15)' },
  { id: 'deposit', label: 'Deposit', icon: '+', color: colors.accentBlue, bg: 'rgba(0,122,255,0.15)' },
  { id: 'history', label: 'History', icon: '⊙', color: colors.accentPurple, bg: 'rgba(191,90,242,0.15)' },
];

const PortfolioMiniChart = ({ data }) => {
  const chartWidth = SCREEN_WIDTH - spacing.md * 2 - 32;
  const chartHeight = 80;
  const padding = 4;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * (chartWidth - padding * 2),
    y: padding + (1 - (val - min) / range) * (chartHeight - padding * 2),
  }));

  let linePath = `M ${points[0].x} ${points[0].y}`;
  let fillPath = `M ${points[0].x} ${chartHeight} L ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpX = (prev.x + curr.x) / 2;
    linePath += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    fillPath += ` C ${cpX} ${prev.y} ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
  }
  fillPath += ` L ${points[points.length - 1].x} ${chartHeight} Z`;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <SvgGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={colors.accentBlue} stopOpacity={0.35} />
          <Stop offset="100%" stopColor={colors.accentBlue} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={fillPath} fill="url(#chartGrad)" />
      <Path
        d={linePath}
        fill="none"
        stroke={colors.accentBlue}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const fetchData = useCallback(async () => {
    try {
      const data = await getPortfolio();
      setPortfolio(data);
    } catch {
      setPortfolio(MOCK_PORTFOLIO);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
    }
  }, [loading]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const data = portfolio || MOCK_PORTFOLIO;
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
      >
        {/* Header gradient */}
        <LinearGradient
          colors={['rgba(0,122,255,0.12)', 'transparent']}
          style={styles.headerGradient}
          pointerEvents="none"
        />

        {/* Top greeting row */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.portfolioLabel}>Net Worth</Text>
          </View>
          <TouchableOpacity style={styles.avatarButton}>
            <LinearGradient
              colors={colors.gradient}
              style={styles.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.avatarText}>JD</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Net Worth Hero */}
        {loading ? (
          <View style={styles.skeletonHero}>
            <LoadingSkeleton width={280} height={60} borderRadius={12} />
            <LoadingSkeleton width={180} height={28} borderRadius={14} style={{ marginTop: 12 }} />
          </View>
        ) : (
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <NetWorthHero
              value={data.totalNetWorth}
              change={data.change24h}
              changePct={data.changePct24h}
            />
          </Animated.View>
        )}

        {/* Divider line with gradient */}
        <LinearGradient
          colors={['transparent', colors.accentBlue, colors.accentPurple, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientDivider}
        />

        {/* Mini chart */}
        <GlassCard style={styles.chartCard} noPadding>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>7-Day Performance</Text>
            <View style={styles.chartBadge}>
              <View style={styles.chartDot} />
              <Text style={styles.chartBadgeText}>Live</Text>
            </View>
          </View>
          <View style={styles.chartContainer}>
            {loading ? (
              <LoadingSkeleton width={SCREEN_WIDTH - 64} height={80} borderRadius={8} />
            ) : (
              <PortfolioMiniChart data={MOCK_CHART_DATA} />
            )}
          </View>
        </GlassCard>

        {/* Platform Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Accounts</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          >
            {loading
              ? [0, 1, 2].map((i) => <LoadingSkeleton.Card key={i} width={175} height={140} />)
              : data.platforms.map((platform) => (
                  <PlatformCard
                    key={platform.id}
                    name={platform.name}
                    balance={platform.balance}
                    change24h={platform.change24h}
                    gradient={PLATFORM_GRADIENTS[platform.id] || ['#1a1a2e', '#16213e']}
                    icon={PLATFORM_ICONS[platform.id] || platform.name[0]}
                    assets={platform.assets}
                    onPress={() => {}}
                  />
                ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <GlassCard style={styles.quickActionsCard}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickAction}
                activeOpacity={0.7}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.bg }]}>
                  <Text style={[styles.quickActionSymbol, { color: action.color }]}>
                    {action.icon}
                  </Text>
                </View>
                <Text style={styles.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Top Holdings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Holdings</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          <GlassCard noPadding style={styles.holdingsCard}>
            {loading
              ? [0, 1, 2, 3].map((i) => <LoadingSkeleton.Row key={i} />)
              : data.topHoldings.map((holding, index) => (
                  <TouchableOpacity
                    key={holding.symbol}
                    activeOpacity={0.7}
                    style={[
                      styles.holdingRow,
                      index < data.topHoldings.length - 1 && styles.holdingBorder,
                    ]}
                  >
                    <View style={[styles.holdingIcon, { backgroundColor: holding.color + '25', borderColor: holding.color + '50' }]}>
                      <Text style={[styles.holdingIconText, { color: holding.color }]}>
                        {holding.symbol[0]}
                      </Text>
                    </View>
                    <View style={styles.holdingInfo}>
                      <Text style={styles.holdingSymbol}>{holding.symbol}</Text>
                      <Text style={styles.holdingName}>{holding.name}</Text>
                    </View>
                    <View style={styles.holdingValues}>
                      <Text style={styles.holdingBalance}>
                        ${holding.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </Text>
                      <Text style={[
                        styles.holdingPnl,
                        { color: holding.pnl >= 0 ? colors.success : colors.danger },
                      ]}>
                        {holding.pnl >= 0 ? '+' : ''}${Math.abs(holding.pnl).toFixed(2)}
                        {' '}({holding.pnlPct >= 0 ? '+' : ''}{holding.pnlPct.toFixed(2)}%)
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
          </GlassCard>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  portfolioLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  avatarButton: {
    ...shadows.blue,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  skeletonHero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  gradientDivider: {
    height: 1,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    opacity: 0.6,
  },
  chartCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(48,209,88,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    gap: 4,
  },
  chartDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.success,
  },
  chartBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.success,
  },
  chartContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.accentBlue,
  },
  cardsScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  quickActionsCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionSymbol: {
    fontSize: 22,
    fontWeight: '700',
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  holdingsCard: {
    marginHorizontal: spacing.md,
  },
  holdingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  holdingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  holdingIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  holdingIconText: {
    fontSize: 16,
    fontWeight: '700',
  },
  holdingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  holdingSymbol: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  holdingName: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginTop: 2,
  },
  holdingValues: {
    alignItems: 'flex-end',
  },
  holdingBalance: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  holdingPnl: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
