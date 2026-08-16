// metro.config.js — Configuración de Metro Bundler para Expo con soporte Web
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// En builds web, redirigir react-native-worklets a un stub vacío.
// react-native-worklets es solo para el runtime nativo (iOS/Android);
// en web arroja: "WorkletsError: createSerializableObject should never be called in JSWorklets"
config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (
      platform === 'web' &&
      (moduleName === 'react-native-worklets' ||
        moduleName === 'react-native-worklets-core')
    ) {
      return {
        filePath: path.resolve(__dirname, 'stubs/react-native-worklets.js'),
        type: 'sourceFile',
      };
    }
    // Delegación al resolver por defecto para todo lo demás
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = config;
