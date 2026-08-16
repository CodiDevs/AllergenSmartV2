import { SymbolView } from '@/components/ui/symbol-view';
import React, { ErrorInfo, ReactNode } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can also log the error to an error reporting service like Sentry here
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <SymbolView name="exclamationmark.triangle.fill" size={64} tintColor="#EF4444" />
          </View>
          <ThemedText style={styles.title}>¡Oops, algo salió mal!</ThemedText>
          <ThemedText style={styles.subtitle}>
            Encontramos un error inesperado. Por favor, intenta de nuevo.
          </ThemedText>
          
          {__DEV__ && this.state.error && (
            <View style={styles.devErrorContainer}>
              <ThemedText style={styles.devErrorText}>{this.state.error.message}</ThemedText>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <ThemedText style={styles.buttonText}>Intentar de nuevo</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.light.background,
  },
  iconContainer: {
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#EF444415',
    borderRadius: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  devErrorContainer: {
    backgroundColor: '#ffcccc',
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
    width: '100%',
  },
  devErrorText: {
    color: '#cc0000',
    fontFamily: 'monospace',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#5262E3', // SmartAllergen primary blue
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 99,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
