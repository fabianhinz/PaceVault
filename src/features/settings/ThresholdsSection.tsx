import { useState, useTransition } from 'react';
import { Info } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import type { Gender } from '@/packages/engine/types.ts';
import type { UserProfile } from '@/types/index.ts';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import { parsePaceInput, formatPaceInput } from '@/lib/formatters.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { toast } from '@/components/ui/toastStore.ts';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { PaceEstimatorDialog } from './PaceEstimatorDialog.tsx';

type NumberField = 'restHr' | 'maxHr' | 'ftp' | 'weight' | 'birthYear';
type TextField = NumberField | 'thresholdPace';

interface FormValues {
  gender: Gender;
  birthYear: string;
  restHr: string;
  maxHr: string;
  ftp: string;
  thresholdPace: string;
  weight: string;
}

const TEXT_FIELDS: TextField[] = ['birthYear', 'restHr', 'maxHr', 'ftp', 'thresholdPace', 'weight'];
const DATED_NUMBER_FIELDS = ['restHr', 'maxHr', 'ftp', 'weight'] as const;
const MIN_BIRTH_YEAR = 1920;
const MIN_AGE_YEARS = 10;

const numberText = (value: number | undefined): string => {
  if (value === undefined) return '';
  return String(value);
};

const paceText = (value: number | undefined): string => {
  if (value === undefined) return '';
  return formatPaceInput(value);
};

const storedForm = (profile: UserProfile | null): FormValues => {
  if (!profile) {
    return {
      gender: 'male',
      birthYear: '',
      restHr: '',
      maxHr: '',
      ftp: '',
      thresholdPace: '',
      weight: '',
    };
  }
  const today = thresholdsAt(profile, Date.now());
  return {
    gender: profile.gender,
    birthYear: numberText(profile.birthYear),
    restHr: numberText(today.restHr),
    maxHr: numberText(today.maxHr),
    ftp: numberText(today.ftp),
    thresholdPace: paceText(today.thresholdPace),
    weight: numberText(today.weightKg),
  };
};

const optionalNumber = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  return Number(value);
};

interface Range {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
}

const rangeFor = (field: NumberField): Range => {
  if (field === 'restHr') {
    return {
      min: 30,
      max: 100,
      minLabel: m.ui_thresholds_min_bpm({ value: '30' }),
      maxLabel: m.ui_thresholds_max_bpm({ value: '100' }),
    };
  }
  if (field === 'maxHr') {
    return {
      min: 120,
      max: 230,
      minLabel: m.ui_thresholds_min_bpm({ value: '120' }),
      maxLabel: m.ui_thresholds_max_bpm({ value: '230' }),
    };
  }
  if (field === 'ftp') {
    return {
      min: 50,
      max: 500,
      minLabel: m.ui_thresholds_min_watts({ value: '50' }),
      maxLabel: m.ui_thresholds_max_watts({ value: '500' }),
    };
  }
  if (field === 'weight') {
    return {
      min: 30,
      max: 200,
      minLabel: m.ui_thresholds_min_kg({ value: '30' }),
      maxLabel: m.ui_thresholds_max_kg({ value: '200' }),
    };
  }
  const maxYear = new Date().getFullYear() - MIN_AGE_YEARS;
  const label = m.ui_thresholds_birth_year_range({
    min: String(MIN_BIRTH_YEAR),
    max: String(maxYear),
  });
  return { min: MIN_BIRTH_YEAR, max: maxYear, minLabel: label, maxLabel: label };
};

const isRequired = (field: TextField, stored: FormValues): boolean => {
  if (field === 'restHr' || field === 'maxHr') return true;
  if (field === 'birthYear') return false;
  return stored[field] !== '';
};

const numberError = (field: NumberField, form: FormValues): string => {
  const value = Number(form[field]);
  if (Number.isNaN(value)) return m.ui_thresholds_required();
  const range = rangeFor(field);
  if (value < range.min) return range.minLabel;
  if (value > range.max) return range.maxLabel;
  if (field === 'birthYear' && !Number.isInteger(value)) return range.minLabel;
  const restHr = optionalNumber(form.restHr);
  const maxHr = optionalNumber(form.maxHr);
  if (field === 'maxHr' && restHr !== undefined && value <= restHr) {
    return m.ui_thresholds_max_hr_greater();
  }
  if (field === 'restHr' && maxHr !== undefined && maxHr <= value) {
    return m.ui_thresholds_rest_hr_less();
  }
  return '';
};

const fieldError = (field: TextField, form: FormValues, stored: FormValues): string => {
  if (form[field].trim() === '') {
    if (isRequired(field, stored)) return m.ui_thresholds_required();
    return '';
  }
  if (field === 'thresholdPace') {
    if (parsePaceInput(form.thresholdPace) === undefined) return m.ui_thresholds_pace_format();
    return '';
  }
  return numberError(field, form);
};

const formErrors = (form: FormValues, stored: FormValues): Record<TextField, string> => ({
  birthYear: fieldError('birthYear', form, stored),
  restHr: fieldError('restHr', form, stored),
  maxHr: fieldError('maxHr', form, stored),
  ftp: fieldError('ftp', form, stored),
  thresholdPace: fieldError('thresholdPace', form, stored),
  weight: fieldError('weight', form, stored),
});

const isGender = (value: string): value is Gender =>
  value === 'male' || value === 'female' || value === 'other';

const datedChanges = (
  form: FormValues,
  stored: FormValues,
): Partial<Record<ThresholdKey, number>> => {
  const changes: Partial<Record<ThresholdKey, number>> = {};
  for (const field of DATED_NUMBER_FIELDS) {
    const next = optionalNumber(form[field]);
    if (next !== undefined && next !== optionalNumber(stored[field])) changes[field] = next;
  }
  const pace = parsePaceInput(form.thresholdPace);
  if (pace !== undefined && pace !== parsePaceInput(stored.thresholdPace)) {
    changes.thresholdPace = pace;
  }
  return changes;
};

const epochHistory = (value: number | undefined) => {
  if (value === undefined) return undefined;
  return [{ date: 0, value }];
};

const createProfile = (form: FormValues) => {
  const restHr = Number(form.restHr);
  const maxHr = Number(form.maxHr);
  const thresholds: UserProfile['thresholds'] = {
    restHr: [{ date: 0, value: restHr }],
    maxHr: [{ date: 0, value: maxHr }],
  };
  const ftp = epochHistory(optionalNumber(form.ftp));
  if (ftp) thresholds.ftp = ftp;
  const thresholdPace = epochHistory(parsePaceInput(form.thresholdPace));
  if (thresholdPace) thresholds.thresholdPace = thresholdPace;
  const profile: Omit<UserProfile, 'id' | 'createdAt'> = {
    gender: form.gender,
    thresholds,
    showMetricHelp: true,
  };
  const weight = epochHistory(optionalNumber(form.weight));
  if (weight) profile.weight = weight;
  const birthYear = optionalNumber(form.birthYear);
  if (birthYear !== undefined) profile.birthYear = birthYear;
  useUserStore.getState().setProfile(profile);
};

const saveChanges = (form: FormValues, stored: FormValues) => {
  useUserStore.getState().saveTodaysThresholds(datedChanges(form, stored));
  if (form.gender !== stored.gender) useUserStore.getState().setProfileGender(form.gender);
  if (form.birthYear !== stored.birthYear) {
    useUserStore.getState().setProfileBirthYear(optionalNumber(form.birthYear));
  }
  toast(m.ui_thresholds_saved_title(), m.ui_thresholds_saved_desc(), 'success');
};

export const ThresholdsSection = (props: { variant?: 'standalone' | 'embedded' }) => {
  const profile = useUserStore((s) => s.profile);
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<FormValues>(() => storedForm(profile));
  const [estimatorOpen, setEstimatorOpen] = useState(false);

  const variant = props.variant ?? 'standalone';
  const stored = storedForm(profile);
  const errors = formErrors(form, stored);
  const dirty =
    form.gender !== stored.gender || TEXT_FIELDS.some((field) => form[field] !== stored[field]);
  const valid = TEXT_FIELDS.every((field) => errors[field] === '');

  const visibleError = (field: TextField): string => {
    if (form[field] === stored[field]) return '';
    return errors[field];
  };

  const setField = (field: TextField, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setGender = (value: string) => {
    if (isGender(value)) setForm((current) => ({ ...current, gender: value }));
  };

  const handleSave = () => {
    startTransition(() => {
      if (variant === 'embedded' || !profile) {
        createProfile(form);
      } else {
        saveChanges(form, stored);
      }
      setForm(storedForm(useUserStore.getState().profile));
    });
  };

  const handleCancel = () => setForm(stored);

  const handleEstimatorSave = (paceSecPerKm: number) => {
    setField('thresholdPace', formatPaceInput(paceSecPerKm));
  };

  const numberInput = (field: NumberField, id: string) => {
    const error = visibleError(field);
    return (
      <Input
        id={id}
        type="number"
        value={form[field]}
        onChange={(e) => setField(field, e.target.value)}
        helperText={error || undefined}
        error={!!error}
      />
    );
  };

  const paceError = visibleError('thresholdPace');

  const footer = (
    <div className="flex justify-end gap-2">
      <Button variant="secondary" disabled={!dirty} onClick={handleCancel}>
        {m.ui_thresholds_cancel()}
      </Button>
      <Button disabled={!dirty || !valid} onClick={handleSave}>
        {m.ui_thresholds_save()}
      </Button>
    </div>
  );

  const fields = (
    <>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{m.ui_thresholds_gender()}</Label>
            <SelectRoot value={form.gender} onValueChange={setGender}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">{m.ui_thresholds_male()}</SelectItem>
                <SelectItem value="female">{m.ui_thresholds_female()}</SelectItem>
                <SelectItem value="other">{m.ui_thresholds_other()}</SelectItem>
              </SelectContent>
            </SelectRoot>
          </div>
          <div>
            <Label htmlFor="thresh-birthYear">{m.ui_thresholds_birth_year()}</Label>
            {numberInput('birthYear', 'thresh-birthYear')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-restHr" required>
              {m.ui_thresholds_resting_hr()}
            </Label>
            {numberInput('restHr', 'thresh-restHr')}
          </div>
          <div>
            <Label htmlFor="thresh-maxHr" required>
              {m.ui_thresholds_max_hr()}
            </Label>
            {numberInput('maxHr', 'thresh-maxHr')}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-ftp">{m.ui_thresholds_ftp()}</Label>
            {numberInput('ftp', 'thresh-ftp')}
          </div>
          <div>
            <Label htmlFor="thresh-pace">{m.ui_thresholds_threshold_pace()}</Label>
            <Input
              id="thresh-pace"
              type="text"
              value={form.thresholdPace}
              onChange={(e) => setField('thresholdPace', e.target.value)}
              helperText={
                paceError || (
                  <div className="flex gap-1 align-center text-accent">
                    <Info size={16} strokeWidth={1.5} className="shrink-0" />
                    <button
                      type="button"
                      className="cursor-pointer hover:underline"
                      onClick={() => setEstimatorOpen(true)}
                    >
                      {m.ui_thresholds_estimate_from_race()}
                    </button>
                  </div>
                )
              }
              error={!!paceError}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-weight">{m.ui_thresholds_weight()}</Label>
            {numberInput('weight', 'thresh-weight')}
          </div>
        </div>
      </div>

      <PaceEstimatorDialog
        open={estimatorOpen}
        onOpenChange={setEstimatorOpen}
        onSave={handleEstimatorSave}
      />
    </>
  );

  if (variant === 'embedded') {
    return (
      <div>
        {fields}
        <p className="mt-3 text-xs text-text-quaternary">{m.ui_thresholds_onboarding_note()}</p>
        <div className="border-t border-white/10 mt-4 pt-3">{footer}</div>
      </div>
    );
  }

  return (
    <Card footer={footer}>
      <CardHeader title={m.ui_thresholds_title()} subtitle={m.ui_thresholds_subtitle()} />
      {fields}
    </Card>
  );
};
