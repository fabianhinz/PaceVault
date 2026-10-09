import { Search } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { Input } from '@/components/ui/Input.tsx';
import type { FilterBuilder } from './hooks/useFilterBuilder.ts';

interface FilterFieldProps {
  builder: FilterBuilder;
  className?: string;
  onFocusChange?: (focused: boolean) => void;
}

export const FilterField = (props: FilterFieldProps) => (
  <Input
    variant="bare"
    icon={Search}
    type="text"
    autoComplete="off"
    spellCheck={false}
    enterKeyHint="done"
    aria-label={m.ui_filter_builder_label()}
    placeholder={m.ui_filter_builder_placeholder()}
    value={props.builder.text}
    onChange={(e) => props.builder.setText(e.target.value)}
    onKeyDown={props.builder.handleKeyDown}
    onFocus={() => props.onFocusChange?.(true)}
    onBlur={() => props.onFocusChange?.(false)}
    className={props.className}
  />
);
