import React from 'react';
import { ViewStyle, StyleSheet, StyleProp } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
} from 'react-native-reanimated';

interface SkeletonProps {
  style?: StyleProp<ViewStyle>;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius = 8 }: SkeletonProps) {
  const opacity = useSharedValue(0.5);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width: width as any, height: height as any, borderRadius },
        style,
        animatedStyle,
      ]}
    />
  );
}

// ─── Componentes Específicos para Pantallas ──────────────────────────────────

export function HistoryCardSkeleton() {
  return (
    <Animated.View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Skeleton width={150} height={20} />
        <Skeleton width={60} height={20} borderRadius={12} />
      </View>
      <View style={styles.cardBody}>
        <Skeleton width="100%" height={16} />
        <View style={{ height: 4 }} />
        <Skeleton width="80%" height={16} />
      </View>
      <View style={styles.cardFooter}>
        <Skeleton width={80} height={14} />
      </View>
    </Animated.View>
  );
}

export function ProfileAllergenSkeleton() {
  return (
    <Animated.View style={styles.allergenItem}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={{ flex: 1, marginLeft: 12, gap: 6 }}>
        <Skeleton width={120} height={16} />
        <Skeleton width={80} height={14} />
      </View>
      <Skeleton width={60} height={24} borderRadius={12} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  // History Card Skeleton Styles
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardBody: {
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  // Profile Allergen Skeleton
  allergenItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
});
