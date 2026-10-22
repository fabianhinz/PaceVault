import { useState, type ReactNode } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { DatedValue } from '@pacevault/engine/datedValue.ts';
import { wattsPerKgHistory } from '@pacevault/engine/wattsPerKg.ts';
import type { UserProfile } from '@/types/index.ts';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { Input } from '@pacevault/ui/components/Input.tsx';
import { Label } from '@pacevault/ui/components/Label.tsx';
import { Card } from '@pacevault/ui/components/Card.tsx';
import { CardHeader } from '@pacevault/ui/components/CardHeader.tsx';
import { Button } from '@pacevault/ui/components/Button.tsx';
import {
  SelectRoot,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@pacevault/ui/components/Select.tsx';
import { ThresholdEditDialog } from './ThresholdEditDialog.tsx';
import { ThresholdTiles } from './ThresholdTiles.tsx';
import type { ThresholdTileKey } from './thresholdIcons.ts';
import { useThresholdsForm, type ThresholdsForm } from './hooks/useThresholdsForm.ts';

type Histories = Record<ThresholdTileKey, DatedValue<number>[]>;

const ProfileFields = (props: { thresholds: ThresholdsForm }) => {
  const thresholds = props.thresholds;
  const birthYearError = thresholds.visibleError('birthYear');
  return (
    <>
      <div>
        <Label>{m.ui_thresholds_gender()}</Label>
        <SelectRoot
          value={thresholds.form.gender ?? undefined}
          onValueChange={thresholds.setGender}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">{m.ui_thresholds_male()}</SelectItem>
            <SelectItem value="female">{m.ui_thresholds_female()}</SelectItem>
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
          onBlur={() => thresholds.revealErrors(['birthYear'])}
          helperText={birthYearError}
          error={birthYearError !== ''}
          reserveHelper
        />
      </div>
    </>
  );
};

const Divider = () => <hr className="my-4 border-white/10" />;

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
      thresholdHr: profile.thresholds.thresholdHr ?? [],
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
      {/* Top-aligned, so the birth year's helper line only grows downward. `sm:mt-6` = label
          (20 px) + 4 px, which puts the 36 px Save on the 40 px inputs' bottom edge. */}
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <ProfileFields thresholds={thresholds} />
        <Button
          className="justify-self-end sm:mt-6"
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
