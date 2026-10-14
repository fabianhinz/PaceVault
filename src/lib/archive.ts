import { gunzipSync, unzipSync } from 'fflate';

const ARCHIVE_EXTENSIONS = ['.zip'] as const;
const IGNORED_PREFIXES = ['__MACOSX/', '.'];
// Strava's bulk export stores FIT activities gzipped inside the ZIP.
const GZIP_SUFFIX = '.gz';
const GZIPPED_FIT_EXTENSION = '.fit.gz';
const ACTIVITY_EXTENSIONS = ['.fit', '.tcx'] as const;
export const UPLOAD_EXTENSIONS = [...ACTIVITY_EXTENSIONS, '.zip'] as const;

type ActivityExtension = (typeof ACTIVITY_EXTENSIONS)[number];

export interface ArchiveEntry {
  path: string;
  fileName: string;
  extension: ActivityExtension;
}

export const isArchiveFile = (fileName: string): boolean => {
  const lower = fileName.toLowerCase();
  return ARCHIVE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

const toActivityEntry = (path: string): ArchiveEntry | undefined => {
  if (IGNORED_PREFIXES.some((p) => path.startsWith(p))) return undefined;
  const fileName = path.split('/').pop() ?? path;
  const lower = fileName.toLowerCase();
  if (lower.endsWith(GZIPPED_FIT_EXTENSION)) {
    return { path, fileName: fileName.slice(0, -GZIP_SUFFIX.length), extension: '.fit' };
  }
  const extension = ACTIVITY_EXTENSIONS.find((e) => lower.endsWith(e));
  if (!extension) return undefined;
  return { path, fileName, extension };
};

export const listActivityEntries = (archive: ArrayBuffer): ArchiveEntry[] => {
  const entries: ArchiveEntry[] = [];
  unzipSync(new Uint8Array(archive), {
    filter: (file) => {
      const entry = toActivityEntry(file.name);
      if (entry) entries.push(entry);
      return false;
    },
  });
  return entries;
};

export const extractArchiveEntry = (archive: ArrayBuffer, path: string): ArrayBuffer => {
  const files = unzipSync(new Uint8Array(archive), { filter: (file) => file.name === path });
  const data = files[path];
  if (!data) throw new Error(`Archive entry "${path}" not found`);
  if (path.toLowerCase().endsWith(GZIPPED_FIT_EXTENSION)) {
    return gunzipSync(data).buffer as ArrayBuffer;
  }
  return data.buffer as ArrayBuffer;
};
