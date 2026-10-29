import { useState, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { Trash2 } from 'lucide-react';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvList } from '@pacevault/ui/components/pvList/PvList.tsx';
import { PvListItem } from '@pacevault/ui/components/pvList/PvListItem.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { DeleteAllDataDialog } from './DeleteAllDataDialog.tsx';
import { PvInlineSkeleton } from '@pacevault/ui/components/pvInlineSkeleton/PvInlineSkeleton.tsx';
import { PvSplitBar } from '@pacevault/ui/components/pvSplitBar/PvSplitBar.tsx';
import type { SplitBarSegment } from '@pacevault/ui/components/pvSplitBar/types.ts';
import { formatBytes, formatDate } from '@/lib/format/formatters.ts';
import type { StorageCategory } from '@/types.ts';
import { useStorageBreakdown } from '@/queries/settings/useStorageBreakdown.ts';

const STORAGE_SEGMENTS: Array<{
  category: StorageCategory;
  label: () => string;
  colorClass: string;
}> = [
  { category: 'fitFiles', label: () => m.ui_fit_files_title(), colorClass: 'bg-chart-fitness' },
  { category: 'heatmap', label: () => m.ui_data_storage_map(), colorClass: 'bg-chart-hr' },
  { category: 'weather', label: () => m.ui_data_storage_weather(), colorClass: 'bg-chart-form' },
  { category: 'appData', label: () => m.ui_data_storage_app(), colorClass: 'bg-text-tertiary' },
];

export const DataManagementSection: FC = () => {
  const sessionCount = useSessionsStore((s) => s.sessions.length);
  const fileCount = useSessionsStore(
    (s) => s.sessions.filter((session) => session.source.kind === 'file').length,
  );
  const intervalsCount = useSessionsStore(
    (s) => s.sessions.filter((session) => session.source.kind === 'intervals').length,
  );
  const sourcedCount = fileCount + intervalsCount;
  const lastUpdated = useSessionsStore((s) =>
    s.sessions.length > 0 ? Math.max(...s.sessions.map((session) => session.createdAt)) : null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);
  const storage = useStorageBreakdown({ sessionCount });
  const storageCategories = storage.data?.categories ?? null;
  const storageTotal = storage.data?.total ?? null;

  const sourceSegments: SplitBarSegment[] = [
    {
      key: 'intervals',
      label: m.ui_data_source_intervals(),
      value: intervalsCount,
      display: String(intervalsCount),
      colorClass: 'bg-chart-fitness',
    },
    {
      key: 'file',
      label: m.ui_data_source_file(),
      value: fileCount,
      display: String(fileCount),
      colorClass: 'bg-text-tertiary',
    },
  ];

  const storageSegments: SplitBarSegment[] = STORAGE_SEGMENTS.map((segment) => {
    const bytes = storageCategories?.[segment.category] ?? 0;
    return {
      key: segment.category,
      label: segment.label(),
      value: bytes,
      display: storageCategories === null ? null : formatBytes(bytes),
      colorClass: segment.colorClass,
    };
  });

  return (
    <>
      <PvCard>
        <PvCardHeader title={m.ui_data_storage()} subtitle={m.ui_data_storage_desc()} />
        <PvList>
          <PvListItem
            primary={m.ui_data_sessions()}
            secondary={
              lastUpdated !== null
                ? m.ui_data_last_updated({ date: formatDate(lastUpdated, 'date-time') })
                : undefined
            }
          >
            <PvTypography variant="body1">{sessionCount}</PvTypography>
          </PvListItem>
          {sourcedCount > 0 && (
            <li className="pl-3">
              <PvSplitBar segments={sourceSegments} />
            </li>
          )}
          <PvListItem primary={m.ui_data_storage_usage()}>
            <div className="flex h-5 items-center">
              {storageTotal === null ? (
                <PvInlineSkeleton className="w-16" />
              ) : (
                <PvTypography variant="body1">{formatBytes(storageTotal)}</PvTypography>
              )}
            </div>
          </PvListItem>
          <li className="pl-3">
            <PvSplitBar segments={storageSegments} />
          </li>
        </PvList>
      </PvCard>

      <PvCard>
        <PvCardHeader title={m.ui_data_danger_zone()} />
        <PvList>
          <PvListItem
            primary={m.ui_data_delete_all()}
            secondary={m.ui_data_delete_all_desc()}
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteOpen(true)}
          />
        </PvList>
      </PvCard>

      <DeleteAllDataDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
};
