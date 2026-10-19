import type { ReactNode } from 'react';
import { cn } from '../lib/cn.ts';
import { List, ListItem } from './List.tsx';
import { Typography } from './Typography.tsx';

interface Field<T> {
  label: ReactNode;
  value: (row: T) => ReactNode;
  visible?: boolean;
  priority?: 'primary' | 'secondary';
}

interface DataTableProps<T> {
  fields: Field<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  rowLabel?: (row: T) => ReactNode;
  onRowHover?: (row: T | null) => void;
  rowClassName?: (row: T) => string;
  className?: string;
}

export type { Field, DataTableProps };

export const DataTable = <T,>(props: DataTableProps<T>) => {
  const visibleFields = props.fields.filter((f) => f.visible !== false);

  return (
    <div className={cn('@container', props.className)}>
      {/* Table view — visible at ≥500px container width */}
      <table className="hidden w-full tabular-nums @[500px]:table">
        <thead>
          <tr className="border-b border-white/10 text-left">
            {props.rowLabel && (
              <th className="px-3 py-2 text-xs font-medium text-text-secondary">#</th>
            )}
            {visibleFields.map((field, i) => (
              <th key={i} className="px-3 py-2 text-xs font-medium text-text-secondary">
                {field.label}
              </th>
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
                <td className="px-3 py-2 text-sm font-medium">{props.rowLabel(row)}</td>
              )}
              {visibleFields.map((field, i) => (
                <td key={i} className="px-3 py-2 text-sm">
                  {field.value(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Card view — visible below 500px container width */}
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
              <Typography variant="title" className="mb-2">
                {props.rowLabel(row)}
              </Typography>
            )}
            <List className="space-y-1">
              {visibleFields.map((field, i) => (
                <ListItem key={i} primary={field.label}>
                  <Typography variant="caption" as="p">
                    {field.value(row)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </div>
        ))}
      </div>
    </div>
  );
};
