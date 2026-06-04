import { useAppStore, selectUiScaleMultiplier } from '@/store/appStore';

/**
 * useUiScale
 * Hook útil para escalar dimensiones de iconos (SVGs), paddings o márgenes específicos
 * de forma dinámica cuando cambia la preferencia de tamaño de fuente del usuario.
 */
export function useUiScale(): number {
  return useAppStore(selectUiScaleMultiplier);
}
