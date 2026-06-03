import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const standaloneDir = join(root, '.next', 'standalone');
const standaloneNextDir = join(standaloneDir, '.next');

if (!existsSync(standaloneDir)) {
  throw new Error('Standalone build output was not found at .next/standalone.');
}

function copyIfExists(source, destination) {
  if (!existsSync(source)) return;

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(join(destination, '..'), { recursive: true });
  cpSync(source, destination, { recursive: true });
}

copyIfExists(join(root, 'public'), join(standaloneDir, 'public'));
copyIfExists(join(root, '.next', 'static'), join(standaloneNextDir, 'static'));
