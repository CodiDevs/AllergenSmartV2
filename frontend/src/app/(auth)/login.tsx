/**
 * Login Screen — Matches smartallergen_alergi_system.html LOGIN NORMAL (azul)
 * Features: Blue Alergi mascot, brand wave, email/password inputs, error state
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
import { Link, router } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { AlergiMascot } from '@/components/ui/AlergiMascot';
import { AppButton } from '@/components/ui/AppButton';
import { supabase } from '@/services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasError = error.length > 0;
  const mascotState = hasError ? 'red' : 'blue';
  const heroBg = hasError ? Colors.dangerSurface : '#EEF3FF';
  const brandColor = hasError ? Colors.dangerDark : '#2D3A8C';
  const brandTag = hasError ? 'Algo salió mal...' : 'Tu guardián de alergias';
  const brandTagColor = hasError ? Colors.dangerMid : Colors.textTertiary;
  const waveFill = hasError ? '#FFFAFA' : '#FAFBFF';
  const phoneBg = hasError ? '#FFFAFA' : '#FAFBFF';

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: phoneBg }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: heroBg }]}>
          {/* Wave at bottom */}
          <View style={styles.waveContainer}>
            <Svg
              width="100%"
              height={14}
              viewBox="0 0 200 14"
              preserveAspectRatio="none"
            >
              <Path
                d="M0 7 Q50 0 100 7 Q150 14 200 7 L200 14 L0 14Z"
                fill={waveFill}
              />
            </Svg>
          </View>

          <View style={styles.mascotContainer}>
            <AlergiMascot state={mascotState} size={90} />
          </View>

          <Text style={[styles.brandName, { color: brandColor }]}>
            SmartAllergen
          </Text>
          <Text style={[styles.brandTag, { color: brandTagColor }]}>
            {brandTag}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={[styles.screenTitle, hasError && styles.screenTitleError]}>
            {hasError ? '¡Ups, intenta de nuevo!' : '¡Hola de nuevo!'}
          </Text>
          <Text style={styles.screenSub}>
            {hasError ? '' : 'Inicia sesión para continuar'}
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
          <View
            style={[
              styles.input,
              emailFocused && styles.inputFocused,
              hasError && styles.inputError,
            ]}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Rect
                x={1}
                y={3}
                width={14}
                height={10}
                rx={2}
                stroke={
                  hasError
                    ? Colors.danger
                    : emailFocused
                    ? Colors.primary
                    : Colors.textQuaternary
                }
                strokeWidth={1.4}
              />
              <Path
                d="M1 5.5l7 4.5 7-4.5"
                stroke={
                  hasError
                    ? Colors.danger
                    : emailFocused
                    ? Colors.primary
                    : Colors.textQuaternary
                }
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
            />
          </View>

          {/* Password Input */}
          <View
            style={[
              styles.input,
              passwordFocused && styles.inputFocused,
              hasError && styles.inputError,
            ]}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Rect
                x={3}
                y={7}
                width={10}
                height={8}
                rx={1.5}
                stroke={
                  hasError
                    ? Colors.danger
                    : passwordFocused
                    ? Colors.primary
                    : Colors.textQuaternary
                }
                strokeWidth={1.4}
              />
              <Path
                d="M5 7V5a3 3 0 016 0v2"
                stroke={
                  hasError
                    ? Colors.danger
                    : passwordFocused
                    ? Colors.primary
                    : Colors.textQuaternary
                }
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              style={styles.inputText}
              placeholder="••••••••"
              placeholderTextColor={Colors.textQuaternary}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)} 
              style={{ padding: 4 }}
              activeOpacity={0.7}
            >
              {showPassword ? (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx="12" cy="12" r="3" />
                </Svg>
              ) : (
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={Colors.textQuaternary} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <Path d="M1 1l22 22" />
                </Svg>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <AppButton
            title={hasError ? 'Intentar de nuevo' : 'Iniciar sesión'}
            variant={hasError ? 'red' : 'blue'}
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          {/* Forgot Password */}
          <TouchableOpacity
            style={styles.forgotBtn}
            onPress={() => router.push('/(auth)/forgot-password')}
            activeOpacity={0.7}
          >
            <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Regístrate</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
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
  mascotContainer: {
    marginBottom: 12,
  },
  brandName: {
    fontFamily: FontFamily.nunitoBlack,
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  brandTag: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    marginBottom: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    flex: 1,
  },
  screenTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  screenTitleError: {
    color: Colors.dangerDark,
  },
  screenSub: {
    fontFamily: FontFamily.interRegular,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 16,
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
    marginBottom: 10,
  },
  inputFocused: {
    borderColor: Colors.primary,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: '#FFFAFA',
  },
  inputText: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  loginButton: {
    marginTop: 4,
    marginBottom: 8,
  },
  forgotBtn: {
    alignSelf: 'center',
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: FontFamily.interMedium,
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
});
