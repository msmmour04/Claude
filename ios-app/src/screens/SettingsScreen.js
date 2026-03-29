import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Path } from 'react-native-svg';
import GlassCard from '../components/GlassCard';
import { colors, spacing, borderRadius, shadows } from '../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ACCOUNTS = [
  {
    id: 'kraken',
    name: 'Kraken',
    type: 'crypto',
    gradient: ['#2D0050', '#6B21A8'],
    color: '#9945FF',
    connected: true,
    balance: 34521.80,
    connectType: 'api',
    description: 'Crypto Exchange',
  },
  {
    id: 'public',
    name: 'Public',
    type: 'brokerage',
    gradient: ['#001A4D', '#0047CC'],
    color: '#007AFF',
    connected: true,
    balance: 28910.38,
    connectType: 'plaid',
    description: 'Stock Brokerage',
  },
  {
    id: 'bofa',
    name: 'Bank of America',
    type: 'bank',
    gradient: ['#6B0000', '#CC0000'],
    color: '#FF3B30',
    connected: false,
    balance: 0,
    connectType: 'plaid',
    description: 'Bank Account',
  },
];

const ChevronRight = ({ color = 'rgba(255,255,255,0.3)' }) => (
  <Svg width={8} height={14} viewBox="0 0 8 14" fill="none">
    <Path
      d="M1 1l6 6-6 6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const KrakenApiModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const [apiKey, setApiKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.modalOverlay, { opacity: opacityAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      <Animated.View style={[
        styles.modalSheet,
        { transform: [{ translateY: slideAnim }], paddingBottom: insets.bottom + 16 },
      ]}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={{ overflow: 'hidden', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            <KrakenModalContent
              apiKey={apiKey}
              setApiKey={setApiKey}
              privateKey={privateKey}
              setPrivateKey={setPrivateKey}
              loading={loading}
              onSave={handleSave}
              onClose={onClose}
            />
          </BlurView>
        ) : (
          <View style={{ backgroundColor: '#111111', borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            <KrakenModalContent
              apiKey={apiKey}
              setApiKey={setApiKey}
              privateKey={privateKey}
              setPrivateKey={setPrivateKey}
              loading={loading}
              onSave={handleSave}
              onClose={onClose}
            />
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const KrakenModalContent = ({ apiKey, setApiKey, privateKey, setPrivateKey, loading, onSave, onClose }) => (
  <View style={styles.krakenModalContent}>
    <View style={styles.handleContainer}>
      <View style={styles.handle} />
    </View>

    <View style={styles.modalHeader}>
      <View style={[styles.modalAccountIcon, { backgroundColor: '#9945FF20', borderColor: '#9945FF40' }]}>
        <Text style={[styles.modalAccountIconText, { color: '#9945FF' }]}>K</Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.modalTitle}>Connect Kraken</Text>
        <Text style={styles.modalSubtitle}>Enter your API credentials</Text>
      </View>
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
    </View>

    <View style={styles.apiFieldsContainer}>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>API Key</Text>
        <TextInput
          style={styles.apiInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your Kraken API key"
          placeholderTextColor="rgba(255,255,255,0.2)"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Private Key</Text>
        <TextInput
          style={styles.apiInput}
          value={privateKey}
          onChangeText={setPrivateKey}
          placeholder="Enter your Kraken private key"
          placeholderTextColor="rgba(255,255,255,0.2)"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningTitle}>Security Notice</Text>
        <Text style={styles.warningText}>
          Use read-only API keys for enhanced security. Never share keys with trading permissions unless you trust this app.
        </Text>
      </View>
    </View>

    <TouchableOpacity
      onPress={onSave}
      disabled={loading || !apiKey || !privateKey}
      activeOpacity={0.85}
      style={[styles.saveButton, { opacity: !apiKey || !privateKey ? 0.5 : 1 }]}
    >
      <LinearGradient
        colors={['#6B21A8', '#9945FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.saveButtonGrad}
      >
        <Text style={styles.saveButtonText}>{loading ? 'Connecting...' : 'Connect Account'}</Text>
      </LinearGradient>
    </TouchableOpacity>
  </View>
);

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [biometrics, setBiometrics] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [krakenModalVisible, setKrakenModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleAccountPress = (account) => {
    if (account.id === 'kraken') {
      setKrakenModalVisible(true);
    }
  };

  const formatBalance = (val) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(1)}K`;
    return `$${val.toFixed(2)}`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
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
          colors={['rgba(191,90,242,0.08)', 'transparent']}
          style={styles.headerGrad}
          pointerEvents="none"
        />

        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileAvatar}
          >
            <Text style={styles.profileAvatarText}>JD</Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>John Doe</Text>
            <Text style={styles.profileEmail}>john.doe@example.com</Text>
          </View>
          <TouchableOpacity style={styles.editProfileButton} activeOpacity={0.7}>
            <Text style={styles.editProfileText}>Edit</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Portfolio summary */}
        <GlassCard style={styles.portfolioSummaryCard}>
          <View style={styles.portfolioSummaryRow}>
            <View style={styles.portfolioSummaryItem}>
              <Text style={styles.summaryItemValue}>$87,432</Text>
              <Text style={styles.summaryItemLabel}>Net Worth</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.portfolioSummaryItem}>
              <Text style={[styles.summaryItemValue, { color: colors.success }]}>+1.44%</Text>
              <Text style={styles.summaryItemLabel}>Today</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.portfolioSummaryItem}>
              <Text style={styles.summaryItemValue}>3</Text>
              <Text style={styles.summaryItemLabel}>Accounts</Text>
            </View>
          </View>
        </GlassCard>

        {/* Connected Accounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Accounts</Text>

          <GlassCard noPadding style={styles.accountsList}>
            {accounts.map((account, index) => (
              <TouchableOpacity
                key={account.id}
                onPress={() => handleAccountPress(account)}
                activeOpacity={0.75}
                style={[
                  styles.accountRow,
                  index < accounts.length - 1 && styles.accountBorder,
                ]}
              >
                {/* Account icon */}
                <LinearGradient
                  colors={account.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.accountIconGrad}
                >
                  <Text style={styles.accountIconText}>{account.name[0]}</Text>
                </LinearGradient>

                {/* Account info */}
                <View style={styles.accountInfo}>
                  <View style={styles.accountNameRow}>
                    <Text style={styles.accountName}>{account.name}</Text>
                    {account.connected && (
                      <View style={styles.connectedDot} />
                    )}
                  </View>
                  <Text style={styles.accountDescription}>{account.description}</Text>
                  {account.connected && account.balance > 0 && (
                    <Text style={styles.accountBalance}>{formatBalance(account.balance)}</Text>
                  )}
                  {!account.connected && (
                    <Text style={styles.tapToConnect}>Tap to connect</Text>
                  )}
                </View>

                <ChevronRight />
              </TouchableOpacity>
            ))}

            {/* Add Account */}
            <TouchableOpacity style={styles.addAccountRow} activeOpacity={0.7}>
              <View style={styles.addAccountIcon}>
                <Text style={styles.addAccountPlus}>+</Text>
              </View>
              <Text style={styles.addAccountText}>Add Account</Text>
              <ChevronRight />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <GlassCard noPadding style={styles.settingsList}>
            {/* Face ID */}
            <View style={[styles.settingRow, styles.settingBorder]}>
              <View style={styles.settingIconBg}>
                <Text style={styles.settingIconEmoji}>🔒</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Face ID / Biometrics</Text>
                <Text style={styles.settingDescription}>Unlock app securely</Text>
              </View>
              <Switch
                value={biometrics}
                onValueChange={setBiometrics}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentBlue }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.1)"
              />
            </View>

            {/* Notifications */}
            <View style={[styles.settingRow, styles.settingBorder]}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(255,214,10,0.15)' }]}>
                <Text style={styles.settingIconEmoji}>🔔</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Notifications</Text>
                <Text style={styles.settingDescription}>Price alerts & trades</Text>
              </View>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: 'rgba(255,255,255,0.1)', true: colors.accentBlue }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="rgba(255,255,255,0.1)"
              />
            </View>

            {/* Currency */}
            <View style={[styles.settingRow, styles.settingBorder]}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(48,209,88,0.15)' }]}>
                <Text style={styles.settingIconEmoji}>💵</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Currency</Text>
                <Text style={styles.settingDescription}>Display currency</Text>
              </View>
              <View style={styles.settingValueRow}>
                <Text style={styles.settingValue}>USD</Text>
                <ChevronRight />
              </View>
            </View>

            {/* Dark Mode */}
            <View style={styles.settingRow}>
              <View style={[styles.settingIconBg, { backgroundColor: 'rgba(191,90,242,0.15)' }]}>
                <Text style={styles.settingIconEmoji}>🌑</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Dark Mode</Text>
                <Text style={styles.settingDescription}>Always on</Text>
              </View>
              <View style={styles.settingValueRow}>
                <Text style={[styles.settingValue, { color: colors.success }]}>On</Text>
              </View>
            </View>
          </GlassCard>
        </View>

        {/* About / Legal */}
        <View style={styles.section}>
          <GlassCard noPadding>
            {[
              { label: 'Privacy Policy', icon: '🛡' },
              { label: 'Terms of Service', icon: '📋' },
              { label: 'Rate the App', icon: '⭐' },
              { label: 'Version 1.0.0', icon: 'ℹ', noChevron: true },
            ].map((item, index, arr) => (
              <TouchableOpacity
                key={item.label}
                style={[styles.settingRow, index < arr.length - 1 && styles.settingBorder]}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconBg}>
                  <Text style={styles.settingIconEmoji}>{item.icon}</Text>
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingName}>{item.label}</Text>
                </View>
                {!item.noChevron && <ChevronRight />}
              </TouchableOpacity>
            ))}
          </GlassCard>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { marginBottom: 0 }]}>
          <TouchableOpacity activeOpacity={0.8} style={styles.signOutButton}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <KrakenApiModal
        visible={krakenModalVisible}
        onClose={() => setKrakenModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  profileCard: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.purple,
  },
  profileAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editProfileButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  editProfileText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  portfolioSummaryCard: {
    marginHorizontal: spacing.md,
    marginBottom: 12,
  },
  portfolioSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  portfolioSummaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryItemValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  summaryItemLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
  },
  accountsList: {},
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  accountBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accountIconGrad: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  accountInfo: {
    flex: 1,
    marginLeft: 12,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  connectedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  accountDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  accountBalance: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentBlue,
    marginTop: 2,
  },
  tapToConnect: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
    marginTop: 2,
  },
  addAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderStyle: 'dashed',
  },
  addAccountIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  addAccountPlus: {
    fontSize: 22,
    fontWeight: '300',
    color: colors.textSecondary,
  },
  addAccountText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 12,
  },
  settingsList: {},
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(0,122,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconEmoji: {
    fontSize: 18,
  },
  settingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  signOutButton: {
    backgroundColor: 'rgba(255,69,58,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.25)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.danger,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderBottomWidth: 0,
  },
  krakenModalContent: {
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.2)',
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
    marginBottom: spacing.lg,
  },
  modalAccountIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalAccountIconText: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
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
  apiFieldsContainer: {
    gap: 16,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  apiInput: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warningBox: {
    backgroundColor: 'rgba(255,214,10,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,214,10,0.2)',
    padding: spacing.md,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFD60A',
    marginBottom: 6,
  },
  warningText: {
    fontSize: 12,
    color: 'rgba(255,214,10,0.7)',
    lineHeight: 18,
  },
  saveButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: spacing.md,
    ...shadows.purple,
  },
  saveButtonGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
