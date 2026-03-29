import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

const LoadingSkeleton = ({ width = 100, height = 20, borderRadius = 8, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
};

const SkeletonRow = () => (
  <View style={styles.row}>
    <LoadingSkeleton width={40} height={40} borderRadius={20} />
    <View style={styles.rowContent}>
      <LoadingSkeleton width={120} height={14} borderRadius={7} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width={80} height={12} borderRadius={6} />
    </View>
    <View style={styles.rowRight}>
      <LoadingSkeleton width={70} height={14} borderRadius={7} style={{ marginBottom: 8 }} />
      <LoadingSkeleton width={50} height={12} borderRadius={6} />
    </View>
  </View>
);

const SkeletonCard = ({ width = 160, height = 100 }) => (
  <LoadingSkeleton width={width} height={height} borderRadius={16} style={{ marginRight: 12 }} />
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowContent: {
    flex: 1,
    marginLeft: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
});

LoadingSkeleton.Row = SkeletonRow;
LoadingSkeleton.Card = SkeletonCard;

export default LoadingSkeleton;
