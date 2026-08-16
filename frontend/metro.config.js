// metro.config.js — Configuración de Metro Bundler para Expo con soporte Web
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reemplazar import.meta.env por valores estáticos en el bundle web de producción.
// Zustand y otras librerías ESM usan `import.meta.env.MODE` — esto evita el SyntaxError
// cuando el bundle se carga como un <script> clásico (no como ES module) en Vercel.
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...(config.transformer.minifierConfig || {}),
  },
};

// Definir `import.meta` como un objeto global seguro para el entorno web de producción.
// Metro transpila `import.meta.env` a `__importMeta.env` cuando se usa este shim.
const originalGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  const result = originalGetTransformOptions
    ? await originalGetTransformOptions(...args)
    : {};
  return {
    ...result,
    transform: {
      ...(result.transform || {}),
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  };
};

module.exports = config;
