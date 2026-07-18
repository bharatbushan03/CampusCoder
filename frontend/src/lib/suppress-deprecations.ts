const warned = new Set<string>();
const originalWarn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  const joined = args.join(' ');
  if (joined.includes('THREE.Clock') && joined.includes('deprecated')) {
    if (warned.has('THREE.Clock')) return;
    warned.add('THREE.Clock');
  }
  originalWarn(...args);
};
