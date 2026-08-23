import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// Determine frontend directory whether script is run from root or frontend/
const currentDir = process.cwd();
const frontendDir = existsSync(join(currentDir, '.next'))
  ? currentDir
  : join(currentDir, 'frontend');

const standaloneDir = join(frontendDir, '.next', 'standalone');
const standaloneNextDir = join(standaloneDir, '.next');

if (!existsSync(standaloneDir)) {
  console.warn(`Standalone directory not found at ${standaloneDir}. Skipping static copy.`);
  process.exit(0);
}

function copyIfExists(source, destination) {
  if (!existsSync(source)) return;

  try {
    rmSync(destination, { recursive: true, force: true });
    mkdirSync(join(destination, '..'), { recursive: true });
    cpSync(source, destination, { recursive: true });
    console.log(`Copied ${source} -> ${destination}`);
  } catch (err) {
    console.warn(`Warning: failed to copy ${source} to ${destination}:`, err.message);
  }
}

copyIfExists(join(frontendDir, 'public'), join(standaloneDir, 'public'));
copyIfExists(join(frontendDir, '.next', 'static'), join(standaloneNextDir, 'static'));
console.log('✓ Standalone build prepared successfully.');
