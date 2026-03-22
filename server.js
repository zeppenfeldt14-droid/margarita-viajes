import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- MARGARITA VIAJES: FORZANDO POSTGRESQL ---');
console.log('Iniciando backend desde /backend/dist/src/index.js...');

const fs = require('fs');

// Intentar encontrar el backend en diferentes rutas comunes de compilación
const possiblePaths = [
  path.join(__dirname, 'backend', 'dist', 'src', 'index.js'),
  path.join(__dirname, 'backend', 'dist', 'index.js'),
  path.join(__dirname, 'dist', 'src', 'index.js'),
  path.join(__dirname, 'dist', 'index.js')
];

let backendPath = possiblePaths.find(p => fs.existsSync(p));

if (!backendPath) {
  console.error('❌ ERROR: No se encontró el archivo compilado del backend en ninguna de las rutas esperadas.');
  console.log('Rutas intentadas:', possiblePaths);
  // Intentar ejecutar directamente con tsx si estamos en Render y falló el build
  backendPath = path.join(__dirname, 'backend', 'src', 'index.ts');
  console.log('Intentando fallback a tsx con:', backendPath);
}

const command = backendPath.endsWith('.ts') ? 'npx' : 'node';
const args = backendPath.endsWith('.ts') ? ['tsx', backendPath] : [backendPath];

const child = spawn(command, args, {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'production' }
});

child.on('error', (err) => {
  console.error('Fallo al iniciar el backend:', err);
});

child.on('close', (code) => {
  console.log(`Backend finalizado con código ${code}`);
});
