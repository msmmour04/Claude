import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

import AssetRow from '../components/AssetRow';
import SparklineChart from '../components/SparklineChart';
import GlassCard from '../components/GlassCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getCryptoMarket, getStockMarket, getAssetChart } from '../api/client';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const generateSparkline = (base, volatility = 0.05, points = 7) => {
  const data = [base];
  for (let i = 1; i < points; i++) {
    const prev = data[i - 1];
    const change = prev * (Math.random() * volatility * 2 - volatility);
    data.push(Math.max(prev + change, 0.01));
  }
  return data;
};

const MOCK_CRYPTO = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 64821.30, change24h: 2.84, marketCap: 1270000000000, volume: 32400000000, high24h: 65900, low24h: 62800 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', price: 3412.80, change24h: -1.23, marketCap: 410000000000, volume: 18200000000, high24h: 3490, low24h: 3320 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 189.45, change24h: 5.61, marketCap: 88000000000, volume: 4100000000, high24h: 193, low24h: 179 },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', price: 0.6823, change24h: -0.44, marketCap: 24000000000, volume: 820000000, high24h: 0.71, low24h: 0.67 },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', price: 9.82, change24h: 3.12, marketCap: 13000000000, volume: 610000000, high24h: 10.1, low24h: 9.4 },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', price: 38.64, change24h: -2.17, marketCap: 16000000000, volume: 900000000, high24h: 40.2, low24h: 37.8 },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', price: 17.23, change24h: 1.85, marketCap: 10500000000, volume: 520000000, high24h: 17.8, low24h: 16.5 },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', price: 0.9124, change24h: 0.72, marketCap: 8700000000, volume: 380000000, high24h: 0.94, low24h: 0.88 },
].map(a => ({ ...a, sparkline: generateSparkline(a.price * 0.95, 0.04) }));

const MOCK_STOCKS = [
  { id: 'aapl', symbol: 'AAPL', name: 'Apple Inc.', price: 189.42, change24h: 1.24, marketCap: 2950000000000, volume: 68400000, high24h: 191, low24h: 187 },
  { id: 'tsla', symbol: 'TSLA', name: 'Tesla', price: 248.80, change24h: -3.21, marketCap: 790000000000, volume: 124000000, high24h: 260, low24h: 244 },
  { id: 'nvda', symbol: 'NVDA', name: 'NVIDIA Corp.', price: 875.60, change24h: 4.12, marketCap: 2150000000000, volume: 48200000, high24h: 892, low24h: 845 },
  { id: 'msft', symbol: 'MSFT', name: 'Microsoft', price: 421.30, change24h: 0.68, marketCap: 3130000000000, volume: 22400000, high24h: 425, low24h: 417 },
  { id: 'googl', symbol: 'GOOGL', name: 'Alphabet Inc.', price: 178.24, change24h: -0.33, marketCap: 2200000000000, volume: 19800000, high24h: 180, low24h: 176 },
  { id: 'amzn', symbol: 'AMZN', name: 'Amazon', price: 193.50, change24h: 2.09, marketCap: 2010000000000, volume: 33600000, high24h: 196, low24h: 190 },
  { id: 'meta', symbol: 'META', name: 'Meta Platforms', price: 512.40, change24h: 1.44, marketCap: 1310000000000, volume: 17200000, high24h: 518, low24h: 504 },
].map(a => ({ ...a, sparkline: generateSparkline(a.price * 0.97, 0.025) }));

const TIME_RANGES = ['1D', '1W', '1M', '3M', '1Y'];

const ASSET_COLORS = {
  BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', ADA: '#0033AD',
  DOT: '#E6007A', AVAX: '#E84142', LINK: '#2A5ADA', MATIC: '#8247E5',
  AAPL: '#A2AAAD', TSLA: '#CC0000', NVDA: '#76B900', MSFT: '#00A4EF',
  GOOGL: '#4285F4', AMZN: '#FF9900', META: '#1877F2',
};

const generateChartData = (basePrice, range, points = 60) => {
  const data = [basePrice * 0.92];
  for (let i = 1; i < points; i++) {
    const prev = data[i - 1];
    const v = range === '1D' ? 0.003 : range === '1W' ? 0.01 : 0.02;
    const change = prev * (Math.random() * v * 2 - v * 0.8);
    data.push(Math.max(prev + change, 0.01));
  }
  data[data.length - 1] = basePrice;
  return data;
};

const DetailChart = ({ data, color }) => {
  const chartWidth = SCREEN_WIDTH - 40;
  const chartHeight = 180;
  const pad = 4;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (chartWidth - pad * 2),
    y: pad + (1 - (v - min) / range) * (chartHeight - pad * 2),
  }));

  let line = `M ${pts[0].x} ${pts[0].y}`;
  let fill = `M ${pts[0].x} ${chartHeight} L ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    const cpX = (p.x + c.x) / 2;
    line += ` C ${cpX} ${p.y} ${cpX} ${c.y} ${c.x} ${c.y}`;
    fill += ` C ${cpX} ${p.y} ${cpX} ${c.y} ${c.x} ${c.y}`;
  }
  fill += ` L ${pts[pts.length - 1].x} ${chartHeight} Z`;

  return (
    <Svg width={chartWidth} height={chartHeight}>
      <Defs>
        <SvgGradient id="detailGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.4} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </SvgGradient>
      </Defs>
      <Path d={fill} fill="url(#detailGrad)" />
      <Path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const AssetDetailModal = ({ asset, visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [activeRange, setActiveRange] = useState('1W');
  const [chartData, setChartData] = useState([]);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && asset) {
      setChartData(generateChartData(asset.price, activeRange));
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 14,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (asset) {
      setChartData(generateChartData(asset.price, activeRange));
    }
  }, [activeRange, asset]);

  if (!asset) return null;

  const isPositive = asset.change24h >= 0;
  const assetColor = ASSET_COLORS[asset.symbol] || colors.accentBlue;
  const changeColor = isPositive ? colors.success : colors.danger;

  const formatMktCap = (n) => {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[
        styles.modalSheet,
        { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 },
      ]}>
        <View style={[styles.modalBlur, { backgroundColor: 'rgba(8,8,18,0.97)' }]}>
            <ModalContent
              asset={asset}
              assetColor={assetColor}
              isPositive={isPositive}
              changeColor={changeColor}
              chartData={chartData}
              activeRange={activeRange}
              setActiveRange={setActiveRange}
              formatMktCap={formatMktCap}
              onClose={onClose}
            />
          </View>
      </Animated.View>
    </Modal>
  );
};

const ModalContent = ({
  asset, assetColor, isPositive, changeColor,
  chartData, activeRange, setActiveRange,
  formatMktCap, onClose,
}) => (
  <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
    {/* Handle bar */}
    <View style={styles.handleContainer}>
      <View style={styles.handle} />
    </View>

    {/* Asset header */}
    <View style={styles.modalHeader}>
      <View style={[styles.modalIcon, { backgroundColor: assetColor + '20', borderColor: assetColor + '40' }]}>
        <Text style={[styles.modalIconText, { color: assetColor }]}>{asset.symbol[0]}</Text>
      </View>
      <View style={styles.modalTitleBlock}>
        <Text style={styles.modalAssetName}>{asset.name}</Text>
        <Text style={styles.modalAssetSymbol}>{asset.symbol}</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>

    {/* Price */}
    <View style={styles.modalPriceRow}>
      <Text style={styles.modalPrice}>
        {asset.price >= 1000
          ? `$${asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : asset.price >= 1
          ? `$${asset.price.toFixed(2)}`
          : `$${asset.price.toFixed(4)}`}
      </Text>
      <View style={[styles.changePill, { backgroundColor: changeColor + '20' }]}>
        <Text style={[styles.changePillText, { color: changeColor }]}>
          {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
        </Text>
      </View>
    </View>

    {/* Chart */}
    <View style={styles.chartWrapper}>
      <DetailChart data={chartData} color={assetColor} />
    </View>

    {/* Time range selector */}
    <View style={styles.rangeRow}>
      {TIME_RANGES.map((r) => (
        <TouchableOpacity
          key={r}
          onPress={() => setActiveRange(r)}
          style={[
            styles.rangePill,
            activeRange === r && { backgroundColor: assetColor + '25', borderColor: assetColor + '60' },
          ]}
        >
          <Text style={[
            styles.rangeText,
            { color: activeRange === r ? assetColor : colors.textSecondary },
          ]}>
            {r}
          </Text>
        </TouchableOpacity>
      ))}
    </View>

    {/* Stats grid */}
    <View style={styles.statsGrid}>
      {[
        { label: 'Market Cap', value: formatMktCap(asset.marketCap) },
        { label: 'Volume 24h', value: formatMktCap(asset.volume) },
        { label: 'High 24h', value: asset.high24h >= 1 ? `$${asset.high24h.toFixed(2)}` : `$${asset.high24h.toFixed(4)}` },
        { label: 'Low 24h', value: asset.low24h >= 1 ? `$${asset.low24h.toFixed(2)}` : `$${asset.low24h.toFixed(4)}` },
      ].map((stat) => (
        <View key={stat.label} style={styles.statCell}>
          <Text style={styles.statLabel}>{stat.label}</Text>
          <Text style={styles.statValue}>{stat.value}</Text>
        </View>
      ))}
    </View>

    {/* Action buttons */}
    <View style={styles.modalActions}>
      <TouchableOpacity style={styles.sellButton} activeOpacity={0.8}>
        <Text style={styles.sellButtonText}>Sell</Text>
      </TouchableOpacity>
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.buyButtonGrad}
      >
        <TouchableOpacity style={styles.buyButton} activeOpacity={0.8}>
          <Text style={styles.buyButtonText}>Buy</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  </ScrollView>
);

export default function MarketsScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState('Crypto');
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cryptoData, setCryptoData] = useState([]);
  const [stockData, setStockData] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;

  const fetchData = useCallback(async () => {
    try {
      const [crypto, stocks] = await Promise.all([
        getCryptoMarket(),
        getStockMarket(),
      ]);
      setCryptoData(crypto);
      setStockData(stocks);
    } catch {
      setCryptoData(MOCK_CRYPTO);
      setStockData(MOCK_STOCKS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const switchTab = (t) => {
    setTab(t);
    Animated.spring(tabIndicatorAnim, {
      toValue: t === 'Crypto' ? 0 : 1,
      tension: 120,
      friction: 14,
      useNativeDriver: true,
    }).start();
  };

  const activeData = (tab === 'Crypto' ? cryptoData : stockData).filter(
    (a) => !searchText || a.name.toLowerCase().includes(searchText.toLowerCase()) || a.symbol.toLowerCase().includes(searchText.toLowerCase())
  );

  const tabIndicatorX = tabIndicatorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, (SCREEN_WIDTH - spacing.md * 2 - 4) / 2 + 2],
  });

  const tabWidth = (SCREEN_WIDTH - spacing.md * 2 - 8) / 2;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['rgba(0,122,255,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <Text style={styles.title}>Markets</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search assets..."
            placeholderTextColor={colors.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented control */}
        <View style={styles.segmentContainer}>
          <Animated.View
            style={[
              styles.segmentIndicator,
              { width: tabWidth, transform: [{ translateX: tabIndicatorX }] },
            ]}
          >
            <LinearGradient
              colors={colors.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.segmentGrad}
            />
          </Animated.View>
          {['Crypto', 'Stocks'].map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => switchTab(t)}
              style={[styles.segmentTab, { width: tabWidth }]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.segmentLabel,
                { color: tab === t ? '#FFFFFF' : colors.textSecondary },
              ]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Asset list */}
      <FlatList
        data={loading ? [] : activeData}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <AssetRow
            item={item}
            rank={index + 1}
            onPress={() => {
              setSelectedAsset(item);
              setModalVisible(true);
            }}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <View>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <LoadingSkeleton.Row key={i} />
              ))}
            </View>
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentBlue}
          />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      <AssetDetailModal
        asset={selectedAsset}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    overflow: 'hidden',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.textSecondary,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    padding: 0,
  },
  clearSearch: {
    fontSize: 13,
    color: colors.textSecondary,
    padding: 4,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    height: 42,
    alignItems: 'center',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    borderRadius: 11,
    overflow: 'hidden',
  },
  segmentGrad: {
    flex: 1,
  },
  segmentTab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: 11,
    zIndex: 1,
  },
  segmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  // Modal styles
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: SCREEN_HEIGHT * 0.9,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
  },
  modalBlur: {
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  modalIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalTitleBlock: {
    flex: 1,
    marginLeft: 12,
  },
  modalAssetName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  modalAssetSymbol: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  modalPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: 12,
  },
  modalPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -1,
  },
  changePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  changePillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chartWrapper: {
    paddingHorizontal: 20,
    marginBottom: spacing.md,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  rangePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rangeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: 1,
    marginBottom: spacing.md,
  },
  statCell: {
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    padding: spacing.md,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: 12,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sellButton: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,69,58,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
  },
  buyButtonGrad: {
    flex: 1,
    borderRadius: 14,
    ...shadows.blue,
  },
  buyButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
