import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Volver"
        >
          <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="2" strokeLinecap="round">
            <Path d="M19 12H5M12 19l-7-7 7-7" />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Política de Privacidad</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Última actualización: Julio 2026</Text>

        <Text style={styles.sectionTitle}>1. Información que Recopilamos</Text>
        <Text style={styles.paragraph}>
          Al utilizar SmartAllergen, podemos recopilar:
        </Text>
        <Text style={styles.listItem}>• Datos de registro (nombre, correo electrónico).</Text>
        <Text style={styles.listItem}>• Perfiles de alérgenos que usted configura voluntariamente.</Text>
        <Text style={styles.listItem}>• Imágenes tomadas con la cámara para el escaneo de etiquetas.</Text>
        <Text style={styles.listItem}>• Historial de productos escaneados (guardado localmente y respaldado en la nube).</Text>

        <Text style={styles.sectionTitle}>2. Uso de la Información</Text>
        <Text style={styles.paragraph}>
          Utilizamos la información recopilada para:
        </Text>
        <Text style={styles.listItem}>• Proporcionar el servicio de análisis de alérgenos.</Text>
        <Text style={styles.listItem}>• Personalizar las advertencias según sus alérgenos configurados.</Text>
        <Text style={styles.listItem}>• Mejorar los modelos de Inteligencia Artificial (las imágenes de etiquetas pueden ser utilizadas de forma anónima para entrenar nuestro motor de OCR, sin vincularlas a su identidad).</Text>

        <Text style={styles.sectionTitle}>3. Seguridad de los Datos</Text>
        <Text style={styles.paragraph}>
          Implementamos medidas de seguridad para proteger sus datos personales y de salud. Toda comunicación con nuestros servidores está cifrada (HTTPS/SSL). Sus credenciales y perfiles médicos básicos se resguardan de forma segura usando la plataforma Supabase.
        </Text>

        <Text style={styles.sectionTitle}>4. Compartir Información</Text>
        <Text style={styles.paragraph}>
          No vendemos, alquilamos ni compartimos su información de salud (alérgenos) con terceros para fines publicitarios. Sus datos solo se comparten con los servicios de nube estrictamente necesarios para el funcionamiento de la app (ej. OpenAI para análisis de texto).
        </Text>

        <Text style={styles.sectionTitle}>5. Derechos del Usuario</Text>
        <Text style={styles.paragraph}>
          Usted tiene derecho a acceder, modificar y eliminar sus datos en cualquier momento desde la pantalla de Perfil. Al eliminar su cuenta, todos los datos asociados a su usuario serán borrados permanentemente de nuestros servidores.
        </Text>

        <Text style={styles.sectionTitle}>6. Contacto</Text>
        <Text style={styles.paragraph}>
          Si tiene alguna pregunta sobre esta Política de Privacidad, puede contactarnos en legal@smartallergen.com.
        </Text>

        <View style={styles.footerSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#fff',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 18,
    color: '#1A2340',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  lastUpdated: {
    fontFamily: FontFamily.interMedium,
    fontSize: 13,
    color: '#8896B0',
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: FontFamily.nunitoBold,
    fontSize: 16,
    color: '#1A2340',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 8,
  },
  listItem: {
    fontFamily: FontFamily.interRegular,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
  footerSpace: {
    height: 40,
  }
});
