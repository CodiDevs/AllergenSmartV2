import React from 'react';
import { Platform, Text, View } from 'react-native';

const ICON_MAP: Record<string, string> = {
  'shield.checkerboard': '🛡️',
  'barcode.viewfinder': '🔍',
  'person.crop.circle.badge.plus': '👤',
  'arrow.right': '→',
  'chevron.right': '›',
  'wifi.exclamationmark': '⚠️',
  'exclamationmark.triangle.fill': '⚠️',
  'applelogo': '',
  'paperplane.fill': '✈️',
  'house.fill': '🏠',
  'heart.fill': '❤️',
  'gear': '⚙️',
};

interface SafeSymbolViewProps {
  name: string;
  size?: number;
  tintColor?: string;
  style?: any;
  weight?: string;
}

export function SymbolView({ name, size = 24, tintColor, style }: SafeSymbolViewProps) {
  // On iOS native, we could use expo-symbols, but to be 100% crash-proof everywhere (Web, Android, iOS):
  const icon = ICON_MAP[name] || '•';

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.8, color: tintColor, textAlign: 'center' }}>
        {icon}
      </Text>
    </View>
  );
}
