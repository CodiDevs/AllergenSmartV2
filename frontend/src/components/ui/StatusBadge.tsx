/**
 * StatusBadge — Severity/status badge component
 * Used for: PELIGRO, PRECAUCIÓN, SEGURO, HIGH, MED, LOW, OK, etc.
 */
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';

type BadgeVariant = 'danger' | 'warning' | 'safe' | 'processing' | 'high' | 'med' | 'low';

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  style?: ViewStyle;
}

const BADGE_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  danger: { bg: Colors.dangerBadgeBg, text: Colors.dangerBadgeText },
  high: { bg: Colors.dangerBadgeBg, text: Colors.dangerBadgeText },
  warning: { bg: Colors.warningBadgeBg, text: Colors.warningBadgeText },
  med: { bg: Colors.warningBadgeBg, text: Colors.warningBadgeText },
  safe: { bg: Colors.successBadgeBg, text: Colors.successBadgeText },
  low: { bg: Colors.successBadgeBg, text: Colors.successBadgeText },
  processing: { bg: '#E6F1FB', text: '#0C447C' },
};

export function StatusBadge({ label, variant, style }: StatusBadgeProps) {
  const colors = BADGE_STYLES[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }, style]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
});
