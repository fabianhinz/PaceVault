const FIT_MAGIC = [0x2e, 0x46, 0x49, 0x54];

export const looksLikeFitFile = (data: ArrayBuffer): boolean => {
  if (data.byteLength < 12) return false;

  const view = new Uint8Array(data, 8, 4);
  for (let i = 0; i < FIT_MAGIC.length; i++) {
    if (view[i] !== FIT_MAGIC[i]) return false;
  }
  return true;
};
