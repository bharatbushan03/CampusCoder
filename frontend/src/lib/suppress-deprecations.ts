const originalWarn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  const joined = args.join(' ');
  if (joined.includes('THREE.Clock') && joined.includes('deprecated')) {
    return;
  }
  originalWarn(...args);
};
