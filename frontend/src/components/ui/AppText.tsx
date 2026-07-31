import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useAppStore, selectUiScaleMultiplier } from '@/store/appStore';

/**
 * AppText
 * Componente que envuelve a React Native Text y escala automáticamente
 * su tamaño de fuente y altura de línea en base a la configuración de accesibilidad
 * global seleccionada por el usuario (Pequeño, Mediano, Grande).
 */
export function AppText(props: TextProps) {
  // Obtenemos el multiplicador en tiempo real desde Zustand
  const scaleMultiplier = useAppStore(selectUiScaleMultiplier);

  // Si no hay escalado o no hay estilos, retornamos el texto nativo optimizado
  if (scaleMultiplier === 1 || !props.style) {
    return <RNText {...props} />;
  }

  // Aplanamos el array/ID de estilos para poder inspeccionar fontSize y lineHeight
  const flattenedStyle = StyleSheet.flatten(props.style);
  
  if (!flattenedStyle) {
    return <RNText {...props} />;
  }

  // Clonamos para mutarlo localmente
  const scaledStyle = { ...flattenedStyle };

  // Escalamos fontSize si existe
  if (typeof scaledStyle.fontSize === 'number') {
    scaledStyle.fontSize = Math.round(scaledStyle.fontSize * scaleMultiplier);
  }

  // Escalamos lineHeight si existe y es número
  if (typeof scaledStyle.lineHeight === 'number') {
    scaledStyle.lineHeight = Math.round(scaledStyle.lineHeight * scaleMultiplier);
  }

  return <RNText {...props} style={[props.style, scaledStyle]} />;
}
