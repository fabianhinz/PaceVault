export const requestPersistentStorage = async (): Promise<boolean> => {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
};
