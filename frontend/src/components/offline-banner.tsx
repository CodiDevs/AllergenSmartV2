import * as Network from 'expo-network';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function OfflineBanner() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  useEffect(() => {
    // Check initial status
    Network.getNetworkStateAsync().then((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    // Subscribe to changes
    const subscription = Network.addNetworkStateListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top || 16,
          backgroundColor: '#EF4444', // Tailwind red-500
        },
      ]}>
      <SymbolView name="wifi.exclamationmark" size={16} tintColor="#fff" />
      <ThemedText style={styles.text}>Sin conexión a internet</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
    zIndex: 9999,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
