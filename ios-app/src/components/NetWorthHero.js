import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing } from '../theme';

const NetWorthHero = ({ value = 0, change = 0, changePct = 0 }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const displayRef = useRef(null);
  const currentValueRef = useRef(0);

  useEffect(() => {
    if (value <= 0) return;

    animatedValue.addListener(({ value: animVal }) => {
      currentValueRef.current = animVal;
    });

    Animated.timing(animatedValue, {
      toValue: value,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    return () => animatedValue.removeAllListeners();
  }, [value]);

  const isPositive = change >= 0;
  const changeColor = isPositive ? colors.successGreen : colors.dangerRed;
  const changeSign = isPositive ? '+' : '';

  const formatLargeNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <View style={styles.container}>
      {/* Net worth animated number */}
      <AnimatedCurrency animatedValue={animatedValue} />

      {/* Change badge */}
      <View style={styles.changeRow}>
        <View style={[styles.changeBadge, { backgroundColor: changeColor + '20', borderColor: changeColor + '40' }]}>
          <Text style={[styles.changeText, { color: changeColor }]}>
            {changeSign}{formatLargeNumber(Math.abs(change))} ({changeSign}{Math.abs(changePct).toFixed(2)}%)
          </Text>
          <View style={[styles.dot, { backgroundColor: changeColor }]} />
          <Text style={[styles.changeLabel, { color: changeColor + 'CC' }]}>Today</Text>
        </View>
      </View>
    </View>
  );
};

// Separate component to handle animated text since Animated.Text for complex formatting
const AnimatedCurrency = ({ animatedValue }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  useEffect(() => {
    const id = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });
    return () => animatedValue.removeListener(id);
  }, [animatedValue]);

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(displayValue);

  // Split into dollars and cents for styling
  const parts = formatted.split('.');
  const dollars = parts[0];
  const cents = parts[1] || '00';

  return (
    <View style={styles.numberContainer}>
      <Text style={styles.dollarSign}>$</Text>
      <Text style={styles.dollarsText}>{dollars.replace('$', '').replace(/,/g, ',')}</Text>
      <Text style={styles.centsText}>.{cents}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  numberContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  dollarSign: {
    fontSize: 26,
    fontWeight: '300',
    color: colors.textPrimary,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  dollarsText: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -2,
    lineHeight: 60,
  },
  centsText: {
    fontSize: 26,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  changeRow: {
    alignItems: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  changeLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default NetWorthHero;
