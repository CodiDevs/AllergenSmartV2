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
import { AppText } from '@/components/ui/AppText';
import * as Linking from 'expo-linking';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registered, setRegistered] = useState(false);

  const hasError = error.length > 0;

  // ── Password strength validation ──────────────────────────────────────────
  const pwChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };
  const passedCount = Object.values(pwChecks).filter(Boolean).length;
  const strengthLevel = passedCount <= 1 ? 'weak' : passedCount <= 3 ? 'fair' : passedCount <= 4 ? 'good' : 'strong';
  const strengthColor = strengthLevel === 'weak' ? '#E24B4A' : strengthLevel === 'fair' ? '#F59E0B' : strengthLevel === 'good' ? '#3B82F6' : '#1D9E75';
  const strengthLabel = strengthLevel === 'weak' ? 'Débil' : strengthLevel === 'fair' ? 'Regular' : strengthLevel === 'good' ? 'Buena' : 'Fuerte';
  const allPassed = passedCount === 5;

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setError('Completa todos los campos');
      return;
    }
    if (!allPassed) {
      setError('Tu contraseña no cumple todos los requisitos de seguridad');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const redirectUrl = Linking.createURL('/');
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: name,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (data.user) {
        setRegistered(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  /** Small check/x icon for password requirements */
  const CheckIcon = ({ passed }: { passed: boolean }) => (
    <Svg width={12} height={12} viewBox="0 0 16 16" fill="none">
      {passed ? (
        <Path d="M3 8.5l3 3 7-7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <Circle cx="8" cy="8" r="5" stroke="#CBD5E1" strokeWidth="1.5" />
      )}
    </Svg>
  );

  if (registered) {
    return (
      <View style={styles.container}>
        <View style={[styles.hero, { flex: 1, justifyContent: 'center', paddingBottom: 60 }]}>
          <View style={styles.mascotContainer}>
            <AlergiMascot state="green" size={120} />
          </View>
          <AppText style={styles.brandName}>SmartAllergen</AppText>
          <AppText style={styles.brandTag}>¡Cuenta creada con éxito!</AppText>

          <View style={styles.successCard}>
            <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16 }}>
              <Circle cx="12" cy="12" r="10" fill={Colors.successSurface} stroke={Colors.success} strokeWidth="1.5" />
              <Path d="M9 12l2 2 4-4" stroke={Colors.success} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <AppText style={styles.successTitle}>¡Casi listo!</AppText>
            <AppText style={styles.successMessage}>
              Te hemos enviado un enlace de confirmación a:
            </AppText>
            <AppText style={styles.successEmail}>{email}</AppText>
            <AppText style={styles.successSubmessage}>
              Por favor, revisa tu bandeja de entrada (y la carpeta de spam o correo no deseado si es necesario) para activar tu cuenta antes de iniciar sesión.
            </AppText>
          </View>

          <View style={{ width: '100%', paddingHorizontal: 24, marginTop: 40 }}>
            <AppButton
              title="Ir al inicio de sesión"
              variant="green"
              onPress={() => router.replace('/(auth)/login')}
            />
          </View>
        </View>
      </View>
    );
  }

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

          {/* Password Strength Indicator */}
          {password.length > 0 && (
            <View style={styles.strengthContainer}>
              {/* Strength Bars */}
              <View style={styles.strengthBars}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      { backgroundColor: i <= passedCount ? strengthColor : '#E8ECF4' },
                    ]}
                  />
                ))}
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>

              {/* Requirements Checklist */}
              <View style={styles.reqList}>
                <View style={styles.reqItem}>
                  <CheckIcon passed={pwChecks.length} />
                  <Text style={[styles.reqText, pwChecks.length && styles.reqTextPassed]}>
                    Mínimo 8 caracteres
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <CheckIcon passed={pwChecks.upper} />
                  <Text style={[styles.reqText, pwChecks.upper && styles.reqTextPassed]}>
                    Una letra mayúscula (A-Z)
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <CheckIcon passed={pwChecks.lower} />
                  <Text style={[styles.reqText, pwChecks.lower && styles.reqTextPassed]}>
                    Una letra minúscula (a-z)
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <CheckIcon passed={pwChecks.number} />
                  <Text style={[styles.reqText, pwChecks.number && styles.reqTextPassed]}>
                    Un número (0-9)
                  </Text>
                </View>
                <View style={styles.reqItem}>
                  <CheckIcon passed={pwChecks.special} />
                  <Text style={[styles.reqText, pwChecks.special && styles.reqTextPassed]}>
                    Un carácter especial (!@#$...)
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Legal Notice */}
          <Text style={styles.legalNotice}>
            Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" asChild>
              <Text style={styles.legalLink}>Términos y Condiciones</Text>
            </Link>
            {' '}y nuestra{' '}
            <Link href="/privacy" asChild>
              <Text style={styles.legalLink}>Política de Privacidad</Text>
            </Link>.
          </Text>

          {/* Continue Button */}
          <AppButton
            title="Registrar cuenta"
            variant="green"
            onPress={handleRegister}
            loading={loading}
            style={[styles.continueButton, !allPassed && password.length > 0 && { opacity: 0.5 }]}
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
  // ── Password Strength Styles ──
  strengthContainer: {
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  strengthBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 11,
    marginLeft: 8,
  },
  reqList: {
    gap: 4,
  },
  reqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqText: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: '#94A3B8',
  },
  reqTextPassed: {
    color: '#1D9E75',
  },
  continueButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  legalNotice: {
    fontFamily: FontFamily.interRegular,
    fontSize: 12,
    color: '#8896B0',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  legalLink: {
    fontFamily: FontFamily.interSemiBold,
    color: Colors.primary,
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
    color: Colors.successDark,
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
