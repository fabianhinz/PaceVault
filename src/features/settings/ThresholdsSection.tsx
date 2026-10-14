import { useState, type ReactNode } from 'react';
import { m } from '@/paraglide/messages.js';
import type { DatedValue } from '@/packages/engine/datedValue.ts';
import { wattsPerKgHistory } from '@/packages/engine/wattsPerKg.ts';
import type { UserProfile } from '@/types/index.ts';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { parsePaceInput } from '@/lib/formatters.ts';
import { Input } from '@/components/ui/Input.tsx';
import { Label } from '@/components/ui/Label.tsx';
import { Card } from '@/components/ui/Card.tsx';
import { CardHeader } from '@/components/ui/CardHeader.tsx';
import { Button } from '@/components/ui/Button.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/Select.tsx';
import { ThresholdEditDialog } from './ThresholdEditDialog.tsx';
import { ThresholdTiles } from './ThresholdTiles.tsx';
import type { ThresholdTileKey } from './thresholdIcons.ts';
import {
  useThresholdsForm,
  type FormValues,
  type ThresholdsForm,
} from './hooks/useThresholdsForm.ts';

type Histories = Record<ThresholdTileKey, DatedValue<number>[]>;

const ProfileFields = (props: { thresholds: ThresholdsForm }) => {
  const thresholds = props.thresholds;
  const birthYearError = thresholds.visibleError('birthYear');
  return (
    <>
      <div>
        <Label>{m.ui_thresholds_gender()}</Label>
        <SelectRoot value={thresholds.form.gender} onValueChange={thresholds.setGender}>
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
        <Input
          id="thresh-birthYear"
          type="number"
          value={thresholds.form.birthYear}
          onChange={(e) => thresholds.setField('birthYear', e.target.value)}
          helperText={birthYearError || undefined}
          error={!!birthYearError}
        />
      </div>
    </>
  );
};

const Divider = () => <hr className="my-4 border-white/10" />;

const stagedHistory = (value: number | undefined): DatedValue<number>[] => {
  if (value === undefined || Number.isNaN(value)) return [];
  return [{ date: 0, value }];
};

const stagedNumber = (value: string): number | undefined => {
  if (value.trim() === '') return undefined;
  return Number(value);
};

const stagedHistories = (form: FormValues): Histories => {
  const ftp = stagedHistory(stagedNumber(form.ftp));
  const weight = stagedHistory(stagedNumber(form.weight));
  return {
    restHr: stagedHistory(stagedNumber(form.restHr)),
    maxHr: stagedHistory(stagedNumber(form.maxHr)),
    ftp,
    thresholdPace: stagedHistory(parsePaceInput(form.thresholdPace)),
    weight,
    wkg: wattsPerKgHistory(ftp, weight),
  };
};

export const OnboardingThresholds = (props: { thresholds: ThresholdsForm }) => {
  const [editing, setEditing] = useState<ThresholdKey | null>(null);
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ProfileFields thresholds={props.thresholds} />
      </div>
      <Divider />
      <ThresholdTiles
        histories={stagedHistories(props.thresholds.form)}
        fresh={[]}
        onEdit={setEditing}
        mode="create"
      />
      <ThresholdEditDialog
        field={editing}
        thresholds={props.thresholds}
        onConfirm={(field, value) => {
          props.thresholds.setField(field, value);
          setEditing(null);
        }}
        onClose={() => setEditing(null)}
      />
      <p className="mt-3 text-xs text-text-quaternary">{m.ui_thresholds_onboarding_note()}</p>
    </div>
  );
};

const wattsPerKgOf = (profile: UserProfile) =>
  wattsPerKgHistory(profile.thresholds.ftp ?? [], profile.weight ?? []);

export const ThresholdsSection = () => {
  const thresholds = useThresholdsForm('update');
  const profile = useUserStore((s) => s.profile);
  const [editing, setEditing] = useState<ThresholdKey | null>(null);
  const [fresh, setFresh] = useState<ThresholdTileKey[]>([]);

  let tiles: ReactNode = null;
  if (profile) {
    const histories: Histories = {
      restHr: profile.thresholds.restHr,
      maxHr: profile.thresholds.maxHr,
      ftp: profile.thresholds.ftp ?? [],
      thresholdPace: profile.thresholds.thresholdPace ?? [],
      weight: profile.weight ?? [],
      wkg: wattsPerKgOf(profile),
    };
    tiles = (
      <ThresholdTiles
        histories={histories}
        fresh={fresh}
        onEdit={(key) => {
          setFresh([]);
          setEditing(key);
        }}
        mode="update"
      />
    );
  }

  const handleConfirm = (field: ThresholdKey, value: string) => {
    const saved = thresholds.saveField(field, value);
    setEditing(null);
    if (saved === undefined) return;
    const next: ThresholdTileKey[] = [saved];
    const updated = useUserStore.getState().profile;
    if ((saved === 'ftp' || saved === 'weight') && updated && wattsPerKgOf(updated).length > 0) {
      next.push('wkg');
    }
    setFresh(next);
  };

  return (
    <Card>
      <CardHeader title={m.ui_thresholds_title()} subtitle={m.ui_thresholds_subtitle()} />
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <ProfileFields thresholds={thresholds} />
        <Button
          className="justify-self-end"
          disabled={!thresholds.dirty || !thresholds.valid}
          onClick={thresholds.save}
        >
          {m.ui_thresholds_save()}
        </Button>
      </div>
      <Divider />
      {tiles}
      <ThresholdEditDialog
        field={editing}
        thresholds={thresholds}
        onConfirm={handleConfirm}
        onClose={() => setEditing(null)}
      />
    </Card>
  );
};
