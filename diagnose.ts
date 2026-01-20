/**
 * Script de diagnóstico - Verifica configuración de tests
 */

import * as fs from 'fs';
import * as path from 'path';

console.log('🔍 Diagnóstico de Configuración de Tests\n');

// 1. Verificar archivos de configuración
console.log('📁 Archivos de configuración:');
const configFiles = ['jest.config.js', 'tsconfig.json', 'tests/tsconfig.json'];
configFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 2. Verificar estructura de carpetas
console.log('\n📂 Estructura de carpetas:');
const folders = ['src', 'tests', 'tests/unit', 'tests/integration', 'tests/helpers'];
folders.forEach(folder => {
  const exists = fs.existsSync(folder);
  console.log(`  ${exists ? '✅' : '❌'} ${folder}`);
});

// 3. Verificar dependencias
console.log('\n📦 Dependencias instaladas:');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...packageJson.devDependencies };
  
  const required = ['jest', 'ts-jest', '@types/jest', 'sqlite3', 'typescript'];
  required.forEach(dep => {
    const installed = deps[dep] !== undefined;
    console.log(`  ${installed ? '✅' : '❌'} ${dep}${installed ? ` (${deps[dep]})` : ''}`);
  });
} catch (error) {
  console.log('  ❌ Error leyendo package.json');
}

// 4. Verificar archivos de test
console.log('\n🧪 Archivos de test:');
const testFiles = [
  'tests/setup.ts',
  'tests/helpers/database.helper.ts',
  'tests/helpers/rabbitmq.mock.ts',
  'tests/unit/outboxEvent.datasource.test.ts',
  'tests/integration/outbox-pattern.test.ts',
];
testFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

// 5. Verificar paths de TypeScript
console.log('\n🔧 Configuración de paths:');
try {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  const paths = tsconfig.compilerOptions?.paths || {};
  
  Object.entries(paths).forEach(([key, value]) => {
    console.log(`  ✅ ${key} → ${value}`);
  });
} catch (error) {
  console.log('  ❌ Error leyendo tsconfig.json');
}

console.log('\n✨ Diagnóstico completo\n');
