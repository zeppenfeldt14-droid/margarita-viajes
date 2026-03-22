import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- MARGARITA VIAJES: FORZANDO POSTGRESQL ---');
console.log('Iniciando backend desde /backend/src/index.ts...');

const backendPath = path.join(__dirname, 'backend', 'src', 'index.ts');

const child = spawn('npx', ['tsx', backendPath], {
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
