import { useState, useTransition } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { Gender } from '@pacevault/engine/types.ts';
import type { ThresholdKey, UserProfile } from '@/types.ts';
import { useUserStore } from '@/store/user.ts';
import { thresholdsAt } from '@/lib/analysis/thresholdsAt.ts';
import { parsePaceInput, formatPaceInput } from '@/lib/format/formatters.ts';
import {
  fieldError,
  fieldErrorFor,
  optionalNumber,
} from '@/components/settings/thresholdFieldErrors.ts';
import type { FormField, FormValues, TextField, ThresholdsForm } from './types.ts';

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
