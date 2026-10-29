import { m } from '@pacevault/i18n/messages.js';
import type { ForegroundImport, ImportSummary } from '@/store/importProgress.ts';
import { formatPlural } from '@/lib/format/formatters.ts';
import { LABEL_BY_IMPORT_PHASE } from '@/microcopy/importProgress.ts';

export const foregroundLabel = (foreground: ForegroundImport): string => {
  if (foreground.task === 'reprocess') return m.ui_reprocess_updating();
  return LABEL_BY_IMPORT_PHASE[foreground.phase]();
};

const importedTitle = (summary: Extract<ImportSummary, { kind: 'imported' }>): string => {
  if (summary.imported > 0) return m.ui_import_summary_imported_title();
  if (summary.failed > 0) return m.ui_import_summary_nothing_imported_title();
  return m.ui_import_summary_nothing_new_title();
};

export const summaryTitle = (summary: ImportSummary): string => {
  switch (summary.kind) {
    case 'imported':
      return importedTitle(summary);
    case 'nothing-new':
      return m.ui_import_summary_nothing_new_title();
    case 'no-activities':
      return m.ui_import_summary_no_activities_title();
    case 'failed':
      return m.ui_import_summary_failed_title();
  }
};

const importedLine = (summary: Extract<ImportSummary, { kind: 'imported' }>): string => {
  const parts: string[] = [];
  parts.push(
    formatPlural(summary.imported, {
      one: () => m.ui_import_summary_new_one({ count: summary.imported }),
      other: () => m.ui_import_summary_new_other({ count: summary.imported }),
    }),
  );
  if (summary.duplicated > 0) {
    parts.push(
      formatPlural(summary.duplicated, {
        one: () => m.ui_import_summary_duplicates_one({ count: summary.duplicated }),
        other: () => m.ui_import_summary_duplicates_other({ count: summary.duplicated }),
      }),
    );
  }
  if (summary.failed > 0) parts.push(m.ui_import_summary_failed({ count: summary.failed }));
  return parts.join(' · ');
};

export const summaryDescription = (summary: ImportSummary): string => {
  switch (summary.kind) {
    case 'imported':
      return importedLine(summary);
    case 'nothing-new':
      return m.ui_import_summary_nothing_new_desc();
    case 'no-activities':
      return m.toast_intervals_no_activities_desc();
    case 'failed':
      return summary.message;
  }
};
