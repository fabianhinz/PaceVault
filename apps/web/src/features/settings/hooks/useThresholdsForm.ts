import { useState, useTransition } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { Gender } from '@pacevault/engine/types.ts';
import type { UserProfile } from '@/types.ts';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { thresholdsAt } from '@/lib/thresholdsAt.ts';
import { parsePaceInput, formatPaceInput } from '@/lib/formatters.ts';
import type { FormField, NumberField, TextField } from './types.ts';

interface FormValues {
  gender: Gender | null;
  birthYear: string;
  restHr: string;
  maxHr: string;
  thresholdHr: string;
  ftp: string;
  thresholdPace: string;
  weight: string;
}

const TEXT_FIELDS: TextField[] = [
  'birthYear',
  'restHr',
  'maxHr',
  'thresholdHr',
  'ftp',
  'thresholdPace',
  'weight',
];
const PROFILE_FIELDS: TextField[] = ['birthYear'];
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
      gender: null,
      birthYear: '',
      restHr: '',
      maxHr: '',
      thresholdHr: '',
      ftp: '',
      thresholdPace: '',
      weight: '',
    };
  }
  const today = thresholdsAt({ profile, date: Date.now() });
  return {
    gender: profile.gender,
    birthYear: numberText(profile.birthYear),
    restHr: numberText(today.restHr),
    maxHr: numberText(today.maxHr),
    thresholdHr: numberText(today.thresholdHr),
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

/** Threshold HR lies between the resting and the max HR the form holds. */
const thresholdHrRange = (form: FormValues): Range => {
  const restHr = optionalNumber(form.restHr);
  const maxHr = optionalNumber(form.maxHr);
  let min = 31;
  let max = 229;
  if (restHr !== undefined && !Number.isNaN(restHr)) min = restHr + 1;
  if (maxHr !== undefined && !Number.isNaN(maxHr)) max = maxHr - 1;
  return {
    min,
    max,
    minLabel: m.ui_thresholds_min_bpm({ value: String(min) }),
    maxLabel: m.ui_thresholds_max_bpm({ value: String(max) }),
  };
};

const rangeFor = ({ field, form }: { field: NumberField; form: FormValues }): Range => {
  if (field === 'thresholdHr') return thresholdHrRange(form);
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

const isRequired = ({ field, stored }: { field: TextField; stored: FormValues }): boolean => {
  if (field === 'restHr' || field === 'maxHr') return true;
  if (field === 'birthYear') return false;
  return stored[field] !== '';
};

const numberError = ({ field, form }: { field: NumberField; form: FormValues }): string => {
  const value = Number(form[field]);
  if (Number.isNaN(value)) return m.ui_thresholds_required();
  const range = rangeFor({ field, form });
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

const fieldError = ({
  field,
  form,
  stored,
}: {
  field: TextField;
  form: FormValues;
  stored: FormValues;
}): string => {
  if (form[field].trim() === '') {
    if (isRequired({ field, stored })) return m.ui_thresholds_required();
    return '';
  }
  if (field === 'thresholdPace') {
    if (parsePaceInput(form.thresholdPace) === undefined) return m.ui_thresholds_pace_format();
    return '';
  }
  return numberError({ field, form });
};

const formFieldError = ({
  field,
  form,
  stored,
}: {
  field: FormField;
  form: FormValues;
  stored: FormValues;
}): string => {
  if (field !== 'gender') return fieldError({ field, form, stored });
  if (form.gender === null) return m.ui_thresholds_required();
  return '';
};

export const fieldErrorFor = ({
  field,
  draft,
  values,
}: {
  field: TextField;
  draft: string;
  values: FormValues;
}): string => fieldError({ field, form: { ...values, [field]: draft }, stored: values });

const formErrors = ({
  form,
  stored,
}: {
  form: FormValues;
  stored: FormValues;
}): Record<TextField, string> => ({
  birthYear: fieldError({ field: 'birthYear', form, stored }),
  restHr: fieldError({ field: 'restHr', form, stored }),
  maxHr: fieldError({ field: 'maxHr', form, stored }),
  thresholdHr: fieldError({ field: 'thresholdHr', form, stored }),
  ftp: fieldError({ field: 'ftp', form, stored }),
  thresholdPace: fieldError({ field: 'thresholdPace', form, stored }),
  weight: fieldError({ field: 'weight', form, stored }),
});

const isGender = (value: string): value is Gender => value === 'male' || value === 'female';

const epochHistory = (value: number | undefined) => {
  if (value === undefined) return undefined;
  return [{ date: 0, value }];
};

const thresholdsFromForm = (form: FormValues): UserProfile['thresholds'] => {
  const restHr = Number(form.restHr);
  const maxHr = Number(form.maxHr);
  const thresholds: UserProfile['thresholds'] = {
    restHr: [{ date: 0, value: restHr }],
    maxHr: [{ date: 0, value: maxHr }],
  };
  const thresholdHr = epochHistory(optionalNumber(form.thresholdHr));
  if (thresholdHr) thresholds.thresholdHr = thresholdHr;
  const ftp = epochHistory(optionalNumber(form.ftp));
  if (ftp) thresholds.ftp = ftp;
  const thresholdPace = epochHistory(parsePaceInput(form.thresholdPace));
  if (thresholdPace) thresholds.thresholdPace = thresholdPace;
  return thresholds;
};

const optionalProfileFields = (
  form: FormValues,
): Partial<Pick<UserProfile, 'weight' | 'birthYear'>> => {
  const fields: Partial<Pick<UserProfile, 'weight' | 'birthYear'>> = {};
  const weight = epochHistory(optionalNumber(form.weight));
  if (weight) fields.weight = weight;
  const birthYear = optionalNumber(form.birthYear);
  if (birthYear !== undefined) fields.birthYear = birthYear;
  return fields;
};

const createProfile = ({ form, gender }: { form: FormValues; gender: Gender }) => {
  const profile: Omit<UserProfile, 'id' | 'createdAt'> = {
    gender,
    thresholds: thresholdsFromForm(form),
    showMetricHelp: true,
    ...optionalProfileFields(form),
  };
  useUserStore.getState().setProfile(profile);
};

const parsedThreshold = ({
  field,
  value,
}: {
  field: ThresholdKey;
  value: string;
}): number | undefined => {
  if (field === 'thresholdPace') return parsePaceInput(value);
  return optionalNumber(value);
};

const saveChanges = ({ form, stored }: { form: FormValues; stored: FormValues }) => {
  if (form.gender !== null && form.gender !== stored.gender) {
    useUserStore.getState().setProfileGender(form.gender);
  }
  if (form.birthYear !== stored.birthYear) {
    useUserStore.getState().setProfileBirthYear(optionalNumber(form.birthYear));
  }
};

interface FormErrorState {
  stored: FormValues;
  current: FormValues;
  dirty: boolean;
  valid: boolean;
  visibleError: (field: FormField) => string;
}

const formErrorState = ({
  form,
  profile,
  mode,
  revealed,
}: {
  form: FormValues;
  profile: UserProfile | null;
  mode: 'create' | 'update';
  revealed: FormField[];
}): FormErrorState => {
  const stored = storedForm(profile);
  const errors = formErrors({ form, stored });
  let fields = TEXT_FIELDS;
  let current = form;
  if (mode === 'update') {
    fields = PROFILE_FIELDS;
    current = stored;
  }
  const dirty =
    form.gender !== stored.gender || fields.some((field) => form[field] !== stored[field]);
  const valid = form.gender !== null && fields.every((field) => errors[field] === '');

  // An error shows only once its field is left (blur) or a submit is tried while it is invalid,
  // and hides as soon as the value is valid again, so typing never flags a half-entered value.
  const visibleError = (field: FormField): string => {
    if (!revealed.includes(field)) return '';
    return formFieldError({ field, form, stored });
  };
  return { stored, current, dirty, valid, visibleError };
};

export interface ThresholdsForm {
  form: FormValues;
  current: FormValues;
  dirty: boolean;
  valid: boolean;
  visibleError: (field: FormField) => string;
  revealErrors: (targets: FormField[]) => FormField[];
  setField: ({ field, value }: { field: TextField; value: string }) => void;
  saveField: ({ field, value }: { field: ThresholdKey; value: string }) => ThresholdKey | undefined;
  setGender: (value: string) => void;
  save: () => void;
}

export const useThresholdsForm = (mode: 'create' | 'update'): ThresholdsForm => {
  const profile = useUserStore((s) => s.profile);
  const [, startTransition] = useTransition();
  const [form, setForm] = useState<FormValues>(() => storedForm(profile));
  const [revealed, setRevealed] = useState<FormField[]>([]);

  const errorState = formErrorState({ form, profile, mode, revealed });
  const stored = errorState.stored;

  /** Shows the errors of the invalid `targets` and returns them, in the order given. */
  const revealErrors = (targets: FormField[]): FormField[] => {
    const invalid = targets.filter((field) => formFieldError({ field, form, stored }) !== '');
    setRevealed((current) => [...current, ...invalid.filter((field) => !current.includes(field))]);
    return invalid;
  };

  const setField = ({ field, value }: { field: TextField; value: string }) => {
    const next = { ...form, [field]: value };
    setForm(next);
    setRevealed((current) =>
      current.filter((shown) => formFieldError({ field: shown, form: next, stored }) !== ''),
    );
  };

  const saveField = ({
    field,
    value,
  }: {
    field: ThresholdKey;
    value: string;
  }): ThresholdKey | undefined => {
    if (fieldErrorFor({ field, draft: value, values: stored }) !== '') return undefined;
    const parsed = parsedThreshold({ field, value });
    if (parsed === undefined) return undefined;
    useUserStore.getState().saveTodaysThresholds({ [field]: parsed });
    return field;
  };

  const setGender = (value: string) => {
    if (!isGender(value)) return;
    setForm((current) => ({ ...current, gender: value }));
    setRevealed((current) => current.filter((shown) => shown !== 'gender'));
  };

  const save = () => {
    const gender = form.gender;
    if (!errorState.valid || gender === null) return;
    startTransition(() => {
      if (mode === 'create' || !profile) {
        createProfile({ form, gender });
      } else {
        saveChanges({ form, stored });
      }
      setForm(storedForm(useUserStore.getState().profile));
    });
  };

  return {
    form,
    current: errorState.current,
    dirty: errorState.dirty,
    valid: errorState.valid,
    visibleError: errorState.visibleError,
    revealErrors,
    setField,
    saveField,
    setGender,
    save,
  };
};
