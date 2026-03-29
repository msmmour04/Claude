import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Polyline } from 'react-native-svg';

import DashboardScreen from '../screens/DashboardScreen';
import MarketsScreen from '../screens/MarketsScreen';
import TradeScreen from '../screens/TradeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors, shadows } from '../theme';

const Tab = createBottomTabNavigator();

const DashboardIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="7" height="7" rx="1.5" fill={color} opacity={0.9} />
    <Rect x="14" y="3" width="7" height="7" rx="1.5" fill={color} opacity={0.5} />
    <Rect x="3" y="14" width="7" height="7" rx="1.5" fill={color} opacity={0.5} />
    <Rect x="14" y="14" width="7" height="7" rx="1.5" fill={color} opacity={0.9} />
  </Svg>
);

const MarketsIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline
      points="3,17 7,12 11,14 16,7 21,9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M19 3h2v2"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const TradeIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" opacity={0.4} />
    <Path
      d="M12 7v5l3 3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M8 12H4M20 12h-4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity={0.5}
    />
  </Svg>
);

const SettingsIcon = ({ color, size }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    <Path
      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </Svg>
);

const TABS = [
  { name: 'Dashboard', label: 'Portfolio', Icon: DashboardIcon },
  { name: 'Markets', label: 'Markets', Icon: MarketsIcon },
  { name: 'Trade', label: 'Trade', Icon: TradeIcon },
  { name: 'Settings', label: 'Settings', Icon: SettingsIcon },
];

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: bottomPad }]}>
      <View style={styles.tabBarContainer}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={40} tint="dark" style={styles.blurView}>
            <View style={styles.tabBarInner}>
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const { Icon, label } = TABS[index];

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });
                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name);
                  }
                };

                return (
                  <TouchableOpacity
                    key={route.key}
                    onPress={onPress}
                    activeOpacity={0.7}
                    style={styles.tabItem}
                  >
                    {isFocused && (
                      <LinearGradient
                        colors={['rgba(0,122,255,0.2)', 'rgba(191,90,242,0.1)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.activeBackground}
                      />
                    )}
                    <Icon
                      color={isFocused ? colors.accentBlue : 'rgba(255,255,255,0.35)'}
                      size={22}
                    />
                    <Text style={[
                      styles.tabLabel,
                      { color: isFocused ? colors.accentBlue : 'rgba(255,255,255,0.35)' },
                    ]}>
                      {label}
                    </Text>
                    {isFocused && (
                      <View style={styles.activeDot} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </BlurView>
        ) : (
          <View style={[styles.tabBarInner, styles.androidTabBar]}>
            {state.routes.map((route, index) => {
              const isFocused = state.index === index;
              const { Icon, label } = TABS[index];
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };
              return (
                <TouchableOpacity
                  key={route.key}
                  onPress={onPress}
                  activeOpacity={0.7}
                  style={styles.tabItem}
                >
                  <Icon
                    color={isFocused ? colors.accentBlue : 'rgba(255,255,255,0.35)'}
                    size={22}
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isFocused ? colors.accentBlue : 'rgba(255,255,255,0.35)' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  tabBarContainer: {
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...shadows.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  blurView: {
    overflow: 'hidden',
    borderRadius: 28,
  },
  tabBarInner: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  androidTabBar: {
    backgroundColor: '#111111',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 20,
    gap: 3,
    position: 'relative',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 4,
    right: 4,
    bottom: 0,
    borderRadius: 16,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    bottom: 2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accentBlue,
  },
});

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Markets" component={MarketsScreen} />
      <Tab.Screen name="Trade" component={TradeScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
