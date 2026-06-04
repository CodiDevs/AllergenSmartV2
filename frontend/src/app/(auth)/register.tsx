/**
 * Register Screen — Matches smartallergen_alergi_system.html REGISTRO (verde)
 * Features: Green Alergi mascot waving, step bar, trust badge, and direct Supabase auth
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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { AlergiMascot } from '@/components/ui/AlergiMascot';
import { AppButton } from '@/components/ui/AppButton';
import { supabase } from '@/services/supabase';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasError = error.length > 0;

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        // Sign up success
        // If email confirmation is required, Supabase will register user but they might need to verify email.
        // Usually anonymous key registers successfully.
      }
    } catch (err: any) {
      setError(err?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

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
        {/* Hero Section — Green */}
        <View style={styles.hero}>
          {/* Wave */}
          <View style={styles.waveContainer}>
            <Svg width="100%" height={14} viewBox="0 0 200 14" preserveAspectRatio="none">
              <Path d="M0 7 Q50 0 100 7 Q150 14 200 7 L200 14 L0 14Z" fill="#FAFBFF" />
            </Svg>
          </View>

          <View style={styles.mascotContainer}>
            <AlergiMascot state="green" size={90} />
          </View>

          <Text style={styles.brandName}>SmartAllergen</Text>
          <Text style={styles.brandTag}>¡Crea tu cuenta gratis!</Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Step Bar */}
          <View style={styles.stepBar}>
            <View style={[styles.stepSeg, styles.stepActive, { flex: 2 }]} />
            <View style={styles.stepSeg} />
            <View style={styles.stepSeg} />
          </View>

          <Text style={styles.screenTitle}>Cuéntanos de ti</Text>
          <Text style={styles.screenSub}>Paso 1 de 3 · Datos básicos</Text>

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

          {/* Name Input */}
          <View style={[styles.input, nameFocused && styles.inputFocused]}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Circle
                cx={8}
                cy={5.5}
                r={3}
                stroke={nameFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
              />
              <Path
                d="M1.5 14c0-3 2.9-5.5 6.5-5.5s6.5 2.5 6.5 5.5"
                stroke={nameFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              style={styles.inputText}
              placeholder="Tu nombre completo"
              placeholderTextColor={Colors.textQuaternary}
              value={name}
              onChangeText={(t) => { setName(t); setError(''); }}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              autoCapitalize="words"
            />
          </View>

          {/* Email Input */}
          <View style={[styles.input, emailFocused && styles.inputFocused]}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Rect
                x={1}
                y={3}
                width={14}
                height={10}
                rx={2}
                stroke={emailFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
              />
              <Path
                d="M1 5.5l7 4.5 7-4.5"
                stroke={emailFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
              />
            </Svg>
            <TextInput
              style={styles.inputText}
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
          <View style={[styles.input, passwordFocused && styles.inputFocused]}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Rect
                x={3}
                y={7}
                width={10}
                height={8}
                rx={1.5}
                stroke={passwordFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
              />
              <Path
                d="M5 7V5a3 3 0 016 0v2"
                stroke={passwordFocused ? Colors.primary : Colors.textQuaternary}
                strokeWidth={1.4}
                strokeLinecap="round"
              />
            </Svg>
            <TextInput
              style={styles.inputText}
              placeholder="Contraseña"
              placeholderTextColor={Colors.textQuaternary}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry
            />
          </View>

          {/* Continue Button */}
          <AppButton
            title="Registrar cuenta"
            variant="green"
            onPress={handleRegister}
            loading={loading}
            style={styles.continueButton}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Inicia sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Trust Badge */}
          <View style={styles.trustBadge}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 1L2 4v4c0 4.5 2.6 8.5 6 9.8C12 16.5 14.5 12.5 14.5 8V4L8 1z"
                fill={Colors.successBorder}
                stroke={Colors.successMid}
                strokeWidth={1.3}
              />
            </Svg>
            <Text style={styles.trustText}>Datos encriptados · CodiDevs</Text>
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
    backgroundColor: Colors.successSurface,
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
    color: Colors.successDark,
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
    paddingTop: 16,
    flex: 1,
  },
  stepBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 14,
  },
  stepSeg: {
    height: 4,
    borderRadius: 2,
    flex: 1,
    backgroundColor: Colors.borderInput,
  },
  stepActive: {
    backgroundColor: Colors.success,
  },
  screenTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
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
  inputText: {
    flex: 1,
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    padding: 0,
  },
  continueButton: {
    marginTop: 4,
    marginBottom: 12,
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
    backgroundColor: Colors.successSurface,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  trustText: {
    fontFamily: FontFamily.interMedium,
    fontSize: FontSize.sm,
    color: Colors.successMid,
    fontWeight: '500',
  },
});
