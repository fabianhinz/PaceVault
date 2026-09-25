import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { List, ListItem } from '@/components/ui/List.tsx';
import { Typography } from '@/components/ui/Typography.tsx';
import { DeleteAllDataDialog } from './DeleteAllDataDialog.tsx';
import { ReimportDialog } from './ReimportDialog.tsx';
import { useReimport } from './hooks/useReimport.ts';
import { InlineSkeleton } from '@/components/ui/InlineSkeleton.tsx';
import { SplitBar, type SplitBarSegment } from '@/components/ui/SplitBar.tsx';
import { formatBytes, formatDate } from '@/lib/formatters.ts';
import { type StorageCategory } from '@/lib/storageBreakdown.ts';
import { useStorageBreakdown } from './hooks/useStorageBreakdown.ts';

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

export const DataManagementSection = () => {
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
  const [reimportOpen, setReimportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const reimport = useReimport();
  const storage = useStorageBreakdown(`${reimport.reimporting}-${sessionCount}`);

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
    const bytes = storage.categories?.[segment.category] ?? 0;
    return {
      key: segment.category,
      label: segment.label(),
      value: bytes,
      display: storage.categories === null ? null : formatBytes(bytes),
      colorClass: segment.colorClass,
    };
  });

  return (
    <>
      <Card>
        <CardHeader title={m.ui_data_storage()} subtitle={m.ui_data_storage_desc()} />
        <List>
          <ListItem
            primary={m.ui_data_sessions()}
            secondary={
              lastUpdated !== null
                ? m.ui_data_last_updated({ date: formatDate(lastUpdated, { includeTime: true }) })
                : undefined
            }
          >
            <Typography variant="body1">{sessionCount}</Typography>
          </ListItem>
          {sourcedCount > 0 && (
            <li className="pl-3">
              <SplitBar segments={sourceSegments} />
            </li>
          )}
          <ListItem primary={m.ui_data_storage_usage()}>
            <div className="flex h-5 items-center">
              {storage.total === null ? (
                <InlineSkeleton className="w-16" />
              ) : (
                <Typography variant="body1">{formatBytes(storage.total)}</Typography>
              )}
            </div>
          </ListItem>
          <li className="pl-3">
            <SplitBar segments={storageSegments} />
          </li>
        </List>
      </Card>

      <Card>
        <CardHeader title={m.ui_data_danger_zone()} />
        <List>
          <ListItem
            primary={m.ui_data_reimport()}
            secondary={m.ui_data_reimport_desc()}
            icon={<RotateCcw size={16} />}
            onClick={() => setReimportOpen(true)}
          />
          <ListItem
            primary={m.ui_data_delete_all()}
            secondary={m.ui_data_delete_all_desc()}
            icon={<Trash2 size={16} />}
            onClick={() => setDeleteOpen(true)}
          />
        </List>
      </Card>

      <ReimportDialog
        open={reimportOpen}
        onOpenChange={setReimportOpen}
        reimporting={reimport.reimporting}
        onReimport={reimport.reimportAll}
      />
      <DeleteAllDataDialog open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
};
