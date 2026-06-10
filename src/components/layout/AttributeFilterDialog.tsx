import { useEffect, useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { useFiltersStore } from '@/store/filters.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import {
  ATTRIBUTE_CONFIG,
  ATTRIBUTE_FILTER_KEYS,
  type AttributeFilterKey,
  type AttributeFilters,
  isAttributeFilterActive,
  parseDecimalInput,
} from '@/lib/attributeFilters.ts';

interface AttributeFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type AttributeDrafts = Record<AttributeFilterKey, string>;

const draftsFromFilters = (filters: AttributeFilters): AttributeDrafts => {
  const entries = ATTRIBUTE_FILTER_KEYS.map((key) => {
    const target = filters[key];
    // typeof guard: persisted filter state from older app versions may lack newer keys
    if (typeof target !== 'number') {
      return [key, ''] as const;
    }
    return [key, String(ATTRIBUTE_CONFIG[key].toDisplay(target))] as const;
  });
  return Object.fromEntries(entries) as AttributeDrafts;
};

const filtersFromDrafts = (drafts: AttributeDrafts): AttributeFilters => {
  const entries = ATTRIBUTE_FILTER_KEYS.map((key) => {
    const parsed = parseDecimalInput(drafts[key]);
    if (parsed === null) {
      return [key, null] as const;
    }
    return [key, ATTRIBUTE_CONFIG[key].toCanonical(parsed)] as const;
  });
  return Object.fromEntries(entries) as AttributeFilters;
};

const isInvalidDraft = (input: string): boolean => {
  return input.trim() !== '' && parseDecimalInput(input) === null;
};

export const AttributeFilterDialog = (props: AttributeFilterDialogProps) => {
  const attributeFilters = useFiltersStore((s) => s.attributeFilters);
  const [drafts, setDrafts] = useState<AttributeDrafts>(() =>
    draftsFromFilters(useFiltersStore.getState().attributeFilters),
  );

  useEffect(() => {
    if (props.open) {
      setDrafts(draftsFromFilters(useFiltersStore.getState().attributeFilters));
    }
  }, [props.open]);

  const applyDisabled = ATTRIBUTE_FILTER_KEYS.some((key) => isInvalidDraft(drafts[key]));

  const handleApply = () => {
    if (applyDisabled) {
      return;
    }
    useFiltersStore.getState().setAttributeFilters(filtersFromDrafts(drafts));
    props.onOpenChange(false);
  };

  const handleReset = () => {
    useFiltersStore.getState().clearAttributeFilters();
    props.onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  return (
    <DialogRoot open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogTitle>{m.ui_attr_dialog_title()}</DialogTitle>
        <DialogDescription>{m.ui_attr_dialog_desc()}</DialogDescription>

        <div className="mt-4 flex flex-col gap-3">
          {ATTRIBUTE_FILTER_KEYS.map((key) => (
            <div key={key}>
              <Label htmlFor={`attr-filter-${key}`}>{ATTRIBUTE_CONFIG[key].label()}</Label>
              <Input
                id={`attr-filter-${key}`}
                type="text"
                inputMode="decimal"
                placeholder={ATTRIBUTE_CONFIG[key].placeholder}
                value={drafts[key]}
                error={isInvalidDraft(drafts[key])}
                onChange={(e) => setDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              disabled={!isAttributeFilterActive(attributeFilters)}
              onClick={handleReset}
            >
              {m.ui_attr_dialog_reset()}
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
                {m.ui_btn_cancel()}
              </Button>
              <Button disabled={applyDisabled} onClick={handleApply}>
                {m.ui_attr_dialog_apply()}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
