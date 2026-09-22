import { useState, useRef, useEffect, useTransition } from 'react';
import { m } from '@/paraglide/messages.js';
import type { Gender } from '@/packages/engine/types.ts';
import { useUserStore } from '@/store/user.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { parsePaceInput, formatPaceInput } from '@/lib/formatters.ts';
import { PaceEstimatorDialog } from './PaceEstimatorDialog.tsx';
import { Info } from 'lucide-react';

const DEBOUNCE_MS = 500;

export const ThresholdsSection = (props: { variant?: 'standalone' | 'embedded' }) => {
  const profile = useUserStore((s) => s.profile);
  const [, startTransition] = useTransition();

  const thresholds = profile?.thresholds;

  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'male');
  const [restHr, setRestHr] = useState(String(thresholds?.restHr ?? ''));
  const [maxHr, setMaxHr] = useState(String(thresholds?.maxHr ?? ''));
  const [ftp, setFtp] = useState(String(thresholds?.ftp ?? ''));
  const [thresholdPace, setThresholdPace] = useState(
    thresholds?.thresholdPace ? formatPaceInput(thresholds.thresholdPace) : '',
  );

  const [restHrError, setRestHrError] = useState('');
  const [maxHrError, setMaxHrError] = useState('');
  const [ftpError, setFtpError] = useState('');
  const [thresholdPaceError, setThresholdPaceError] = useState('');

  const [estimatorOpen, setEstimatorOpen] = useState(false);

  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  const debounce = (key: string, fn: () => void) => {
    clearTimeout(timersRef.current[key]);
    timersRef.current[key] = setTimeout(fn, DEBOUNCE_MS);
  };

  const tryCreateProfile = (
    nextRestHr: string,
    nextMaxHr: string,
    nextGender: Gender,
    nextFtp: string,
    nextThresholdPace: string,
  ) => {
    const restNum = Number(nextRestHr);
    const maxNum = Number(nextMaxHr);
    if (!nextRestHr || isNaN(restNum) || restNum < 30 || restNum > 100) return;
    if (!nextMaxHr || isNaN(maxNum) || maxNum < 120 || maxNum > 230) return;
    if (maxNum <= restNum) return;

    const newThresholds: {
      restHr: number;
      maxHr: number;
      ftp?: number;
      thresholdPace?: number;
    } = {
      restHr: restNum,
      maxHr: maxNum,
    };

    const ftpNum = Number(nextFtp);
    if (nextFtp && !isNaN(ftpNum) && ftpNum >= 50 && ftpNum <= 500) {
      newThresholds.ftp = ftpNum;
    }

    const parsedPace = parsePaceInput(nextThresholdPace);
    if (parsedPace !== undefined) {
      newThresholds.thresholdPace = parsedPace;
    }

    startTransition(() =>
      useUserStore.getState().setProfile({
        gender: nextGender,
        thresholds: newThresholds,
        showMetricHelp: true,
        useAutoSessionNames: false,
      }),
    );
  };

  const save = (field: 'restHr' | 'maxHr' | 'ftp', value: string) => {
    const num = Number(value);

    const constraints: Record<
      string,
      {
        min: number;
        max: number;
        minLabel: string;
        maxLabel: string;
        setError: (e: string) => void;
      }
    > = {
      restHr: {
        min: 30,
        max: 100,
        minLabel: m.ui_thresholds_min_bpm({ value: '30' }),
        maxLabel: m.ui_thresholds_max_bpm({ value: '100' }),
        setError: setRestHrError,
      },
      maxHr: {
        min: 120,
        max: 230,
        minLabel: m.ui_thresholds_min_bpm({ value: '120' }),
        maxLabel: m.ui_thresholds_max_bpm({ value: '230' }),
        setError: setMaxHrError,
      },
      ftp: {
        min: 50,
        max: 500,
        minLabel: m.ui_thresholds_min_watts({ value: '50' }),
        maxLabel: m.ui_thresholds_max_watts({ value: '500' }),
        setError: setFtpError,
      },
    };

    const c = constraints[field];
    if (!c) return;

    if (field === 'ftp') {
      if (!value) {
        c.setError('');
        if (profile && thresholds) {
          const current = { ...thresholds };
          current[field] = undefined;
          startTransition(() => useUserStore.getState().updateThresholds(current));
        }
        return;
      }
    }

    if (!value || isNaN(num)) {
      c.setError(m.ui_thresholds_required());
      return;
    }
    if (num < c.min) {
      c.setError(c.minLabel);
      return;
    }
    if (num > c.max) {
      c.setError(c.maxLabel);
      return;
    }

    if (field === 'maxHr' && num <= (Number(restHr) || 0)) {
      c.setError(m.ui_thresholds_max_hr_greater());
      return;
    }
    if (field === 'restHr' && (Number(maxHr) || Infinity) <= num) {
      c.setError(m.ui_thresholds_rest_hr_less());
      return;
    }

    c.setError('');

    if (!profile) {
      const nextRestHr = field === 'restHr' ? value : restHr;
      const nextMaxHr = field === 'maxHr' ? value : maxHr;
      tryCreateProfile(nextRestHr, nextMaxHr, gender, ftp, thresholdPace);
      return;
    }

    if (!thresholds) return;
    const current = { ...thresholds };
    if (field === 'ftp') {
      current[field] = num;
    } else {
      (current as Record<string, number>)[field] = num;
    }

    startTransition(() => useUserStore.getState().updateThresholds(current));
  };

  const saveThresholdPace = (value: string) => {
    if (!value) {
      setThresholdPaceError('');
      if (profile && thresholds) {
        const current = { ...thresholds };
        current.thresholdPace = undefined;
        startTransition(() => useUserStore.getState().updateThresholds(current));
      }
      return;
    }

    const parsed = parsePaceInput(value);
    if (parsed === undefined) {
      setThresholdPaceError(m.ui_thresholds_pace_format());
      return;
    }

    setThresholdPaceError('');

    if (!profile) {
      tryCreateProfile(restHr, maxHr, gender, ftp, value);
      return;
    }

    if (!thresholds) return;
    const current = { ...thresholds };
    current.thresholdPace = parsed;
    startTransition(() => useUserStore.getState().updateThresholds(current));
  };

  const handleGenderChange = (v: Gender) => {
    setGender(v);
    if (profile) {
      startTransition(() => useUserStore.getState().updateProfile({ gender: v }));
    } else {
      tryCreateProfile(restHr, maxHr, v, ftp, thresholdPace);
    }
  };

  const handleChange = (
    field: 'restHr' | 'maxHr' | 'ftp',
    value: string,
    setter: (v: string) => void,
  ) => {
    setter(value);
    debounce(field, () => save(field, value));
  };

  const handlePaceChange = (value: string) => {
    setThresholdPace(value);
    debounce('pace', () => saveThresholdPace(value));
  };

  const handleEstimatorSave = (paceSecPerKm: number) => {
    const formatted = formatPaceInput(paceSecPerKm);
    setThresholdPace(formatted);
    setThresholdPaceError('');
    saveThresholdPace(formatted);
  };

  const variant = props.variant ?? 'standalone';

  const fields = (
    <>
      <div className="space-y-4">
        <div>
          <Label>{m.ui_thresholds_gender()}</Label>
          <SelectRoot value={gender} onValueChange={(v) => handleGenderChange(v as Gender)}>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-restHr" required>
              {m.ui_thresholds_resting_hr()}
            </Label>
            <Input
              id="thresh-restHr"
              type="number"
              value={restHr}
              onChange={(e) => handleChange('restHr', e.target.value, setRestHr)}
              helperText={restHrError || undefined}
              error={!!restHrError}
            />
          </div>
          <div>
            <Label htmlFor="thresh-maxHr" required>
              {m.ui_thresholds_max_hr()}
            </Label>
            <Input
              id="thresh-maxHr"
              type="number"
              value={maxHr}
              onChange={(e) => handleChange('maxHr', e.target.value, setMaxHr)}
              helperText={maxHrError || undefined}
              error={!!maxHrError}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="thresh-ftp">{m.ui_thresholds_ftp()}</Label>
            <Input
              id="thresh-ftp"
              type="number"
              value={ftp}
              onChange={(e) => handleChange('ftp', e.target.value, setFtp)}
              helperText={ftpError || undefined}
              error={!!ftpError}
            />
          </div>
          <div>
            <Label htmlFor="thresh-pace">{m.ui_thresholds_threshold_pace()}</Label>
            <Input
              id="thresh-pace"
              type="text"
              value={thresholdPace}
              onChange={(e) => handlePaceChange(e.target.value)}
              helperText={
                thresholdPaceError || (
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
              error={!!thresholdPaceError}
            />
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
    return fields;
  }

  return (
    <Card>
      <CardHeader title={m.ui_thresholds_title()} subtitle={m.ui_thresholds_subtitle()} />
      {fields}
    </Card>
  );
};
