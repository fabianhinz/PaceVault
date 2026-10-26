import type { LucideIcon } from 'lucide-react';

export interface ActionsMenuItem {
  id: string;
  icon: LucideIcon;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  danger?: boolean;
}
