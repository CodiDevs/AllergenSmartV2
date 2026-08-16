import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/Colors';
import { FontFamily } from '@/constants/Typography';

export default function TermsScreen() {
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
        <Text style={styles.headerTitle}>Términos y Condiciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Última actualización: Julio 2026</Text>

        <Text style={styles.sectionTitle}>1. Aceptación de los términos</Text>
        <Text style={styles.paragraph}>
          Al descargar y utilizar SmartAllergen ("la Aplicación"), usted acepta quedar vinculado por estos Términos y Condiciones de Uso. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la Aplicación.
        </Text>

        <Text style={styles.sectionTitle}>2. Descargo de Responsabilidad Médica (IMPORTANTE)</Text>
        <Text style={styles.paragraph}>
          SmartAllergen es una herramienta de asistencia diseñada para ayudar a identificar posibles alérgenos a partir del texto e ingredientes de productos alimenticios mediante IA y reconocimiento óptico. 
        </Text>
        <Text style={styles.paragraphBold}>
          NUNCA DEBE CONFIAR EXCLUSIVAMENTE EN LA APLICACIÓN PARA TOMAR DECISIONES RELACIONADAS CON SU SALUD.
        </Text>
        <Text style={styles.paragraph}>
          La aplicación puede cometer errores al leer las etiquetas (debido a mala iluminación, fuentes ilegibles, pliegues del empaque o inexactitudes de la IA). Siempre lea el empaque físico original y consulte a un médico en caso de dudas severas. SmartAllergen y CodiDevs no se hacen responsables de reacciones alérgicas o problemas de salud derivados del uso de esta app.
        </Text>

        <Text style={styles.sectionTitle}>3. Uso de la Aplicación</Text>
        <Text style={styles.paragraph}>
          Usted se compromete a usar la aplicación solo con fines legales y de una manera que no infrinja los derechos de, ni restrinja o inhiba el uso y disfrute de la aplicación por parte de terceros.
        </Text>

        <Text style={styles.sectionTitle}>4. Precisión de la Información</Text>
        <Text style={styles.paragraph}>
          Aunque nos esforzamos por proporcionar análisis precisos, las bases de datos de alimentos y el reconocimiento de imágenes no son infalibles. Los ingredientes cambian y las etiquetas varían. El usuario final asume la responsabilidad de verificar el empaque físico.
        </Text>

        <Text style={styles.sectionTitle}>5. Modificaciones</Text>
        <Text style={styles.paragraph}>
          Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento. Si una revisión es importante, intentaremos proporcionar un aviso con al menos 30 días de antelación antes de que los nuevos términos entren en vigor.
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
  paragraphBold: {
    fontFamily: FontFamily.interSemiBold,
    fontSize: 14,
    color: Colors.danger,
    lineHeight: 22,
    marginBottom: 8,
    backgroundColor: Colors.dangerSurface,
    padding: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  footerSpace: {
    height: 40,
  }
});
