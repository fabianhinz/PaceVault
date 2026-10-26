import { m } from '@pacevault/i18n/messages.js';
import type { ImportPhase } from '@/store/importProgress.ts';

export const LABEL_BY_IMPORT_PHASE: Record<ImportPhase, () => string> = {
  preparing: m.ui_import_phase_preparing,
  importing: m.ui_import_phase_importing,
  saving: m.ui_import_phase_saving,
};
