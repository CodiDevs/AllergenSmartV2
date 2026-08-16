/**
 * patch-index.js — Post-build script
 *
 * Cambia el <script defer> del bundle de Expo a <script type="module"> en el
 * index.html generado por `expo export -p web`.
 *
 * Esto es necesario porque Zustand (y otras librerías ESM) usan `import.meta.env`
 * internamente. El bundle Metro contiene esa sintaxis y falla con:
 *   "Uncaught SyntaxError: Cannot use 'import.meta' outside a module"
 * cuando el navegador carga el script como script clásico (sin type="module").
 *
 * Solución: cargar el bundle como ES module (type="module") — el navegador
 * entonces acepta la sintaxis `import.meta` correctamente.
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'dist', 'index.html');

if (!fs.existsSync(indexPath)) {
  console.error('[patch-index] ERROR: dist/index.html not found. Run expo export first.');
  process.exit(1);
}

let html = fs.readFileSync(indexPath, 'utf-8');

// Reemplazar <script src="..." defer> por <script type="module" src="...">
// para que el browser trate el bundle como ES module y soporte import.meta.
const original = html;
html = html.replace(
  /<script src="\/_expo\/static\/js\/web\/([^"]+\.js)" defer><\/script>/g,
  '<script type="module" src="/_expo/static/js/web/$1"></script>'
);

if (html !== original) {
  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('[patch-index] ✅ Bundle cambiado a type="module" en dist/index.html');
} else {
  console.log('[patch-index] ⚠️  No se encontró el patrón <script defer> — nada que parchear.');
}
