import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Alert,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily, FontSize } from '@/constants/Typography';
import { useAppStore, Allergen } from '@/store/appStore';
import { useAuthStore } from '@/stores/authStore';

export default function ProfileTab() {
  const router = useRouter();
  const { isPremium, allergens, addAllergen, removeAllergen, history } = useAppStore();
  const { user, signOut } = useAuthStore();

  const userName = user?.user_metadata?.full_name || 'Usuario';
  const userEmail = user?.email || 'usuario@correo.com';

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAllergenName, setNewAllergenName] = useState('');
  const [newAllergenSeverity, setNewAllergenSeverity] = useState<'HIGH' | 'MED' | 'LOW'>('HIGH');
  const [newAllergenNote, setNewAllergenNote] = useState('');

  // Statistics
  const totalScans = history.length;
  const safeCount = 31;
  const avoidedCount = 12;

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleAddAllergen = () => {
    if (!newAllergenName.trim()) {
      alert('Ingresa el nombre del alérgeno');
      return;
    }
    const cleanName = newAllergenName.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    addAllergen({
      id,
      name: cleanName,
      severity: newAllergenSeverity,
      note: newAllergenNote.trim() || 'Añadido manualmente',
      icon: 'droplet',
    });

    setNewAllergenName('');
    setNewAllergenNote('');
    setNewAllergenSeverity('HIGH');
    setShowAddForm(false);
  };

  const handleLogOut = async () => {
    await signOut();
  };

  const getSeverityBadgeStyle = (sev: 'HIGH' | 'MED' | 'LOW') => {
    switch (sev) {
      case 'HIGH':
        return {
          dot: Colors.danger,
          bg: Colors.dangerSurface,
          text: Colors.dangerBadgeText,
        };
      case 'MED':
        return {
          dot: Colors.warning,
          bg: Colors.warningSurface,
          text: Colors.warningBadgeText,
        };
      case 'LOW':
      default:
        return {
          dot: Colors.primary,
          bg: Colors.primarySurface,
          text: Colors.primaryDark,
        };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          {/* Background mascot silhouette watermark */}
          <View style={styles.headerWatermark}>
            <Svg width="100" height="100" viewBox="0 0 80 88" opacity={0.07}>
              <Path d="M40 8 C40 8 14 32 14 50 C14 67 25 76 40 76 C55 76 66 67 66 50 C66 32 40 8 40 8Z" fill="#5A7BFA" />
            </Svg>
          </View>

          {/* User Info Row */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
              
              {isPremium && (
                <View style={styles.premiumBadge}>
                  <Svg width="9" height="9" viewBox="0 0 14 14" fill="none">
                    <Path d="M7 1L1.5 3.5v4C1.5 11 4 13.5 7 14c3-0.5 5.5-3 5.5-6.5v-4L7 1z" fill="white" />
                  </Svg>
                  <Text style={styles.premiumText}>CodiDevs · Premium</Text>
                </View>
              )}
            </View>
          </View>

          {/* Header stats row */}
          <View style={styles.headerStats}>
            <View style={styles.headerStatItem}>
              <Text style={[styles.headerStatNum, { color: Colors.primary }]}>{totalScans}</Text>
              <Text style={styles.headerStatLabel}>Escaneos</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={[styles.headerStatNum, { color: Colors.success }]}>{safeCount}</Text>
              <Text style={styles.headerStatLabel}>Seguros</Text>
            </View>
            <View style={styles.headerStatItem}>
              <Text style={[styles.headerStatNum, { color: Colors.danger }]}>{avoidedCount}</Text>
              <Text style={styles.headerStatLabel}>Evitados</Text>
            </View>
          </View>
        </View>

        {/* Profile Content Body */}
        <View style={styles.contentBody}>
          
          {/* Allergens Header Row */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Mis alérgenos</Text>
            <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)}>
              <Text style={styles.sectionLink}>{showAddForm ? 'Cerrar' : '+ Añadir'}</Text>
            </TouchableOpacity>
          </View>

          {/* Add Allergen Form Dropdown */}
          {showAddForm && (
            <View style={styles.addFormContainer}>
              <Text style={styles.addFormTitle}>Añadir alérgeno</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nombre del alérgeno (ej: Gluten)"
                placeholderTextColor={Colors.textQuaternary}
                value={newAllergenName}
                onChangeText={setNewAllergenName}
              />
              <TextInput
                style={styles.formInput}
                placeholder="Nota/Severidad (ej: Celiaquía confirmada)"
                placeholderTextColor={Colors.textQuaternary}
                value={newAllergenNote}
                onChangeText={setNewAllergenNote}
              />
              
              <View style={styles.severitySelectRow}>
                <Text style={styles.severitySelectLabel}>Severidad:</Text>
                <View style={styles.severityOptions}>
                  {(['HIGH', 'MED', 'LOW'] as const).map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      style={[
                        styles.severityOptionBtn,
                        newAllergenSeverity === sev && styles.severityOptionBtnActive,
                      ]}
                      onPress={() => setNewAllergenSeverity(sev)}
                    >
                      <Text style={[
                        styles.severityOptionText,
                        newAllergenSeverity === sev && styles.severityOptionTextActive,
                      ]}>
                        {sev}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity
                style={styles.addSubmitBtn}
                activeOpacity={0.8}
                onPress={handleAddAllergen}
              >
                <Text style={styles.addSubmitText}>Guardar alérgeno</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Allergens list */}
          <View style={styles.allergensList}>
            {allergens.map((allergen) => {
              const cfg = getSeverityBadgeStyle(allergen.severity);

              return (
                <View key={allergen.id} style={styles.allergenItem}>
                  <View style={[styles.allergenDot, { backgroundColor: cfg.dot }]} />
                  <View style={{ flex: 1, paddingLeft: 9 }}>
                    <Text style={styles.allergenName}>
                      {allergen.name}
                    </Text>
                    <Text style={styles.allergenNote}>
                      {allergen.note}
                    </Text>
                  </View>
                  <View style={styles.allergenRight}>
                    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
                      <Text style={[styles.badgeText, { color: cfg.text }]}>
                        {allergen.severity}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                      onPress={() => removeAllergen(allergen.id)}
                    >
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={Colors.danger} strokeWidth="2">
                        <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Settings Section Header */}
          <View style={[styles.sectionRow, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>Ajustes</Text>
          </View>

          {/* Settings Options Box */}
          <View style={styles.settingsBox}>
            {/* Notification */}
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: '#EEF3FF' }]}>
                <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round">
                  <Path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <Path d="M13.73 21a2 2 0 01-3.46 0" />
                </Svg>
              </View>
              <Text style={styles.settingText}>Notificaciones</Text>
              <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0BAD0" strokeWidth="2">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>

            {/* Medical History */}
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: '#EEF3FF' }]}>
                <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round">
                  <Rect x="3" y="3" width="18" height="18" rx="3" />
                  <Path d="M9 9h6M9 12h6M9 15h4" />
                </Svg>
              </View>
              <Text style={styles.settingText}>Historial médico</Text>
              <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0BAD0" strokeWidth="2">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>

            {/* Family sharing */}
            <TouchableOpacity style={styles.settingItem} activeOpacity={0.7}>
              <View style={[styles.settingIcon, { backgroundColor: '#EEF3FF' }]}>
                <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="1.8" strokeLinecap="round">
                  <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                  <Circle cx="9" cy="7" r="4" />
                  <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </Svg>
              </View>
              <Text style={styles.settingText}>Compartir con familia</Text>
              <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B0BAD0" strokeWidth="2">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>

            {/* Log Out */}
            <TouchableOpacity
              style={[styles.settingItem, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={handleLogOut}
            >
              <View style={[styles.settingIcon, { backgroundColor: Colors.dangerSurface }]}>
                <Svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={Colors.danger} strokeWidth="1.8" strokeLinecap="round">
                  <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                </Svg>
              </View>
              <Text style={[styles.settingText, { color: Colors.danger }]}>Cerrar sesión</Text>
              <Svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={Colors.dangerLight} strokeWidth="2">
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Brand version footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SmartAllergen v1.0.0 · CodiDevs</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  header: {
    backgroundColor: '#EEF3FF',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  headerWatermark: {
    position: 'absolute',
    right: -14,
    bottom: -14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#5A7BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 18,
    color: '#FFFFFF',
  },
  profileDetails: {
    flexDirection: 'column',
  },
  profileName: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 16,
    color: '#1A2340',
  },
  profileEmail: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#6B7A99',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#5A7BFA',
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  premiumText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    paddingVertical: 8,
    justifyContent: 'space-around',
  },
  headerStatItem: {
    alignItems: 'center',
  },
  headerStatNum: {
    fontFamily: FontFamily.nunitoBlack,
    fontWeight: '900',
    fontSize: 16,
  },
  headerStatLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    color: '#6B7A99',
    fontWeight: '600',
  },
  contentBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoExtraBold,
    fontWeight: '800',
    fontSize: 12,
    color: '#1A2340',
  },
  sectionLink: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '600',
    fontSize: 11,
    color: '#5A7BFA',
  },
  allergensList: {
    flexDirection: 'column',
    gap: 6,
  },
  allergenItem: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF5',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  allergenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  allergenName: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 12,
    color: '#1A2340',
  },
  allergenNote: {
    fontFamily: FontFamily.interRegular,
    fontSize: 10,
    color: '#8896B0',
  },
  allergenRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
    paddingLeft: 8,
  },
  badge: {
    borderRadius: 20,
    paddingVertical: 2,
    paddingHorizontal: 7,
  },
  badgeText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    fontWeight: '700',
  },
  deleteBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8ECF5',
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3FA',
  },
  settingIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  settingText: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '700',
    fontSize: 12,
    color: '#1A2340',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 4,
  },
  footerText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 10,
    color: '#B0BAD0',
    fontWeight: '600',
  },
  addFormContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DDE3F0',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  addFormTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontWeight: '800',
    fontSize: 12,
    color: '#1A2340',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#DDE3F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: FontFamily.interRegular,
    fontSize: 11,
    color: '#1A2340',
  },
  severitySelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  severitySelectLabel: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    color: '#6B7A99',
  },
  severityOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  severityOptionBtn: {
    borderWidth: 1,
    borderColor: '#DDE3F0',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  severityOptionBtnActive: {
    backgroundColor: '#5A7BFA',
    borderColor: '#5A7BFA',
  },
  severityOptionText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 9,
    color: '#6B7A99',
  },
  severityOptionTextActive: {
    color: '#FFFFFF',
  },
  addSubmitBtn: {
    backgroundColor: '#5A7BFA',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  addSubmitText: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
