/**
 * AppButton — Primary button component with variants
 */
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { BorderRadius } from '@/constants/Layout';

type ButtonVariant = 'blue' | 'green' | 'red' | 'amber' | 'outline' | 'outlineDanger' | 'outlineSuccess';

interface AppButtonProps {
  title: string;
  variant?: ButtonVariant;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

const BUTTON_STYLES: Record<ButtonVariant, { bg: string; text: string; border?: string }> = {
  blue: { bg: Colors.primary, text: Colors.white },
  green: { bg: Colors.success, text: Colors.white },
  red: { bg: Colors.danger, text: Colors.white },
  amber: { bg: Colors.warning, text: Colors.warningDark },
  outline: { bg: '#F7F9FF', text: Colors.primary, border: Colors.borderInput },
  outlineDanger: { bg: Colors.white, text: Colors.dangerMid, border: Colors.dangerBorder },
  outlineSuccess: { bg: Colors.white, text: Colors.successMid, border: Colors.successBorder },
};

export function AppButton({
  title,
  variant = 'blue',
  onPress,
  loading,
  disabled,
  style,
  icon,
}: AppButtonProps) {
  const colors = BUTTON_STYLES[variant];
  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border || 'transparent',
          borderWidth: colors.border ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, { color: colors.text }]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.lg,
  },
  buttonText: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: FontSize.base,
    fontWeight: '800',
  },
});
