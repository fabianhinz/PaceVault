import { m } from '@pacevault/i18n/messages.js';
import { parsePaceInput } from '@/lib/format/formatters.ts';
import type { FormValues, NumberField, TextField } from './hooks/types.ts';

const MIN_BIRTH_YEAR = 1920;
const MIN_AGE_YEARS = 10;

export const optionalNumber = (value: string): number | undefined => {
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

export const fieldError = ({
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

export const fieldErrorFor = ({
  field,
  draft,
  values,
}: {
  field: TextField;
  draft: string;
  values: FormValues;
}): string => fieldError({ field, form: { ...values, [field]: draft }, stored: values });
