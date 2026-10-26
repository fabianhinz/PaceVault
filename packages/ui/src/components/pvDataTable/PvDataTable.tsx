import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.ts';
import { PvList } from '../pvList/PvList.tsx';
import { PvListItem } from '../pvList/PvListItem.tsx';
import { PvTypography } from '../pvTypography/PvTypography.tsx';

type FieldPriority = 'primary' | 'secondary';

interface Field<T> {
  label: ReactNode;
  value: (row: T) => ReactNode;
  visible?: boolean;
  priority?: FieldPriority;
}

interface PvDataTableProps<T> {
  fields: Field<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  rowLabel?: (row: T) => ReactNode;
  onRowHover?: (row: T | null) => void;
  rowClassName?: (row: T) => string;
  className?: string;
}

export const PvDataTable = <T,>(props: PvDataTableProps<T>) => {
  const visibleFields = props.fields.filter((f) => f.visible !== false);

  return (
    <div className={cn('@container', props.className)}>
      <table className="hidden w-full tabular-nums @[500px]:table">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {props.rowLabel && (
              <PvTypography as="th" variant="caption" className="px-3 py-2 font-medium">
                #
              </PvTypography>
            )}
            {visibleFields.map((field, i) => (
              <PvTypography key={i} as="th" variant="caption" className="px-3 py-2 font-medium">
                {field.label}
              </PvTypography>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.data.map((row) => (
            <tr
              key={props.rowKey(row)}
              className={cn(
                'border-b border-white/5 transition-colors last:border-b-0',
                props.rowClassName?.(row),
              )}
              onPointerEnter={() => props.onRowHover?.(row)}
              onPointerLeave={() => props.onRowHover?.(null)}
            >
              {props.rowLabel && (
                <PvTypography as="td" variant="subtitle1" className="px-3 py-2">
                  {props.rowLabel(row)}
                </PvTypography>
              )}
              {visibleFields.map((field, i) => (
                <PvTypography key={i} as="td" variant="body1" className="px-3 py-2">
                  {field.value(row)}
                </PvTypography>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-2 @[500px]:hidden">
        {props.data.map((row) => (
          <div
            key={props.rowKey(row)}
            className={cn(
              'rounded-xl bg-white/5 p-3 tabular-nums transition-colors',
              props.rowClassName?.(row),
            )}
            onPointerEnter={() => props.onRowHover?.(row)}
            onPointerLeave={() => props.onRowHover?.(null)}
          >
            {props.rowLabel && (
              <PvTypography variant="title" className="mb-2">
                {props.rowLabel(row)}
              </PvTypography>
            )}
            <PvList className="space-y-1">
              {visibleFields.map((field, i) => (
                <PvListItem key={i} primary={field.label}>
                  <PvTypography variant="caption" as="p">
                    {field.value(row)}
                  </PvTypography>
                </PvListItem>
              ))}
            </PvList>
          </div>
        ))}
      </div>
    </div>
  );
};
