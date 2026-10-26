import { useState, type ReactNode, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import type { DatedValue } from '@pacevault/engine/types.ts';
import { wattsPerKgHistory } from '@pacevault/engine/wattsPerKg.ts';
import type { UserProfile } from '@/types.ts';
import { useUserStore, type ThresholdKey } from '@/store/user.ts';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvCardHeader } from '@pacevault/ui/components/pvCardHeader/PvCardHeader.tsx';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { ThresholdEditDialog } from './ThresholdEditDialog.tsx';
import { ThresholdTiles } from './ThresholdTiles.tsx';
import type { ThresholdTileKey } from './thresholdIcons.ts';
import { useThresholdsForm } from './hooks/useThresholdsForm.ts';
import { ProfileFields } from './ProfileFields.tsx';
import { Divider } from './Divider.tsx';

type Histories = Record<ThresholdTileKey, DatedValue<number>[]>;

const wattsPerKgOf = (profile: UserProfile) =>
  wattsPerKgHistory({ ftp: profile.thresholds.ftp ?? [], weight: profile.weight ?? [] });

export const ThresholdsSection: FC = () => {
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

  const handleConfirm = ({ field, value }: { field: ThresholdKey; value: string }) => {
    const saved = thresholds.saveField({ field, value });
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
    <PvCard>
      <PvCardHeader title={m.ui_thresholds_title()} subtitle={m.ui_thresholds_subtitle()} />
      {/* Top-aligned, so the birth year's helper line only grows downward. `sm:mt-6` = label
          (20 px) + 4 px, which puts the 36 px Save on the 40 px inputs' bottom edge. */}
      <div className="grid items-start gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <ProfileFields thresholds={thresholds} />
        <PvButton
          className="justify-self-end sm:mt-6"
          disabled={!thresholds.dirty || !thresholds.valid}
          onClick={thresholds.save}
        >
          {m.ui_btn_save()}
        </PvButton>
      </div>
      <Divider />
      {tiles}
      <ThresholdEditDialog
        field={editing}
        thresholds={thresholds}
        onConfirm={handleConfirm}
        onClose={() => setEditing(null)}
      />
    </PvCard>
  );
};
