/**
 * Forgot Password Screen — Allows the user to request a password reset email via Supabase.
 * Matches the AllergenSmart brand design with the Alergi mascot.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { AlergiMascot } from '@/components/ui/AlergiMascot';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { supabase } from '@/services/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const hasError = error.length > 0;

  const handleReset = async () => {
    if (!email) {
      setError('Ingresa tu correo electrónico');
      return;
    }
    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingresa un correo electrónico válido');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://allergensmart-backend.onrender.com/api/v1/auth/reset-password',
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al enviar el enlace de recuperación');
    } finally {
      setLoading(false);
    }
  };

  // ── Success state ──
  if (sent) {
    return (
      <View style={styles.container}>
        <View style={[styles.hero, { flex: 1, justifyContent: 'center', paddingBottom: 60 }]}>
          <View style={styles.mascotContainer}>
            <AlergiMascot state="blue" size={120} />
          </View>
          <AppText style={styles.brandName}>SmartAllergen</AppText>
          <AppText style={styles.brandTag}>¡Revisa tu correo!</AppText>

          <View style={styles.successCard}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
              <Circle cx="12" cy="12" r="10" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
              <Path d="M8 12l3 3 5-5" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <AppText style={styles.successTitle}>Enlace enviado</AppText>
            <AppText style={styles.successMessage}>
              Hemos enviado un enlace de recuperación a:
            </AppText>
            <AppText style={styles.successEmail}>{email}</AppText>
            <AppText style={styles.successSubmessage}>
              Revisa tu bandeja de entrada (y la carpeta de spam). El enlace expirará en 24 horas.
            </AppText>
          </View>

          <View style={{ width: '100%', paddingHorizontal: 24, marginTop: 40 }}>
            <AppButton
              title="Volver al inicio de sesión"
              variant="blue"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </View>
      </View>
    );
  }

  // ── Main form ──
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.hero}>
          {/* Wave at bottom */}
          <View style={styles.waveContainer}>
            <Svg width="100%" height={14} viewBox="0 0 200 14" preserveAspectRatio="none">
              <Path d="M0 7 Q50 0 100 7 Q150 14 200 7 L200 14 L0 14Z" fill="#FAFBFF" />
            </Svg>
          </View>

          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2D3A8C" strokeWidth="2" strokeLinecap="round">
              <Path d="M19 12H5M12 19l-7-7 7-7" />
            </Svg>
          </TouchableOpacity>

          <View style={styles.mascotContainer}>
            <AlergiMascot state="blue" size={90} />
          </View>

          <Text style={styles.brandName}>SmartAllergen</Text>
          <Text style={styles.brandTag}>Recupera tu contraseña</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.screenTitle}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.screenSub}>
            No te preocupes, ingresa el correo con el que te registraste y te enviaremos un enlace para crear una nueva contraseña.
          </Text>

          {/* Error Banner */}
          {hasError && (
            <View style={styles.errorBanner}>
              <Svg width={14} height={14} viewBox="0 0 16 16" fill="none">
                <Circle cx={8} cy={8} r={7} stroke={Colors.danger} strokeWidth={1.4} />
                <Path d="M8 5v4" stroke={Colors.danger} strokeWidth={1.4} strokeLinecap="round" />
                <Circle cx={8} cy={12} r={1} fill={Colors.danger} />
              </Svg>
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={[styles.input, emailFocused && styles.inputFocused, hasError && styles.inputError]}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Rect
                x={1} y={3} width={14} height={10} rx={2}
                stroke={hasError ? Colors.danger : emailFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
              />
              <Path
                d="M1 5.5l7 4.5 7-4.5"
                stroke={hasError ? Colors.danger : emailFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
              />
            </Svg>
            <TextInput
              style={[styles.inputText, hasError && { color: Colors.dangerMid }]}
              placeholder="tu@correo.com"
              placeholderTextColor={Colors.textQuaternary}
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          </View>

          {/* Send Button */}
          <AppButton
            title="Enviar enlace de recuperación"
            variant="blue"
            onPress={handleReset}
            loading={loading}
            style={styles.sendButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya recordaste tu contraseña? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1L2 4v4c0 4.5 2.6 8.5 6 9.8C12 16.5 14.5 12.5 14.5 8V4L8 1z"
                fill="#DBEAFE"
                stroke="#93C5FD"
                strokeWidth={1.3}
              />
            </Svg>
            <Text style={styles.trustText}>Enlace seguro · Expira en 24h</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: '#EEF3FF',
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  waveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 14,
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  mascotContainer: {
    marginBottom: 12,
  },
  brandName: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 22,
    fontWeight: '900',
    color: '#2D3A8C',
    marginBottom: 2,
  },
  brandTag: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
    flex: 1,
  },
  screenTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  screenSub: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.dangerSurface,
    borderWidth: 1,
    borderColor: Colors.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: FontSize.sm,
    color: Colors.dangerDark,
    fontWeight: '600',
    lineHeight: 14,
    flex: 1,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.bgInput,
    borderWidth: 1.5,
    borderColor: Colors.borderInput,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerSurface,
  },
  inputText: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  sendButton: {
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  footerText: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
  },
  footerLink: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '700',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF3FF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  trustText: {
    fontFamily: FontFamily.interMedium,
    fontSize: FontSize.sm,
    color: '#5B7EB5',
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    marginTop: 20,
  },
  successTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  successMessage: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  successEmail: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubmessage: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
