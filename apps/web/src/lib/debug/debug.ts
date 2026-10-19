export const installDebugTools = async () => {
  if (!import.meta.env.DEV) return;
  const pvDebug = await import('./pvDebug.ts');
  pvDebug.registerPvDebug();
};
