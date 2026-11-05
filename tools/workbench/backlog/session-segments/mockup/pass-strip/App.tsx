import { useState, type FC } from 'react';
import { ChevronLeft, Ellipsis, Footprints, SplinePointer } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';
import { PvSegmentedControl } from '@pacevault/ui/components/pvSegmentedControl/PvSegmentedControl.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { FLOATING_CLASS, GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { PASSES_BY_SCENARIO, SCENARIOS, bestOf, initialSelection, type Pass, type Scenario } from './data.ts';
import { formatDate } from './format.ts';
import { PassStrip } from './PassStrip.tsx';
import { Explorer } from './Explorer.tsx';
import type { DotChipLook } from './kit/pvDotChip/types.ts';

const DESIGNS: Array<{ id: DotChipLook; label: string }> = [
  { id: 'current', label: 'Current' },
  { id: 'tile', label: 'Filled tile, dotted best line' },
  { id: 'underline', label: 'Underline bar, faint line' },
  { id: 'pill', label: 'Pills, amber tint, date below' },
  { id: 'columns', label: 'Columns, day over month' },
  { id: 'glow', label: 'No box, glowing dot' },
];

const scenarioFromUrl = (): Scenario => {
  const raw = new URLSearchParams(location.search).get('scenario');
  return SCENARIOS.find((candidate) => candidate.id === raw)?.id ?? 'from';
};

const designFromUrl = (): DotChipLook => {
  const raw = new URLSearchParams(location.search).get('design');
  return DESIGNS.find((candidate) => candidate.id === raw)?.id ?? 'current';
};

const writeUrl = ({ scenario, design }: { scenario: Scenario; design: DotChipLook }) =>
  history.replaceState(null, '', `?scenario=${scenario}&design=${design}`);

interface ControlsProps {
  scenario: Scenario;
  design: DotChipLook;
  onScenario: (scenario: Scenario) => void;
  onDesign: (design: DotChipLook) => void;
}

const MapPlaceholder: FC<ControlsProps> = (props) => (
  <div className="relative h-56 shrink-0 overflow-hidden bg-surface-sunken lg:h-auto lg:flex-1">
    <svg aria-hidden viewBox="0 0 100 60" preserveAspectRatio="xMidYMid meet" className="absolute inset-[15%] h-[70%] w-[70%]">
      <path d="M5 50 C 25 10, 45 55, 60 25 S 90 15, 95 8" fill="none" stroke="var(--color-sport-running)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
    <div className="absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2">
      <div className={cn(FLOATING_CLASS, 'max-w-full overflow-x-auto rounded-xl p-1')}>
        <PvSegmentedControl
          size="sm"
          aria-label="Scenario"
          value={props.scenario}
          onValueChange={(value) => props.onScenario(SCENARIOS.find((candidate) => candidate.id === value)?.id ?? 'from')}
          options={SCENARIOS.map((scenario) => ({ value: scenario.id, label: scenario.label }))}
        />
      </div>
      <div className={cn(FLOATING_CLASS, 'flex items-center gap-2 rounded-xl py-1 pr-1 pl-3')}>
        <PvTypography variant="caption" as="span">
          Design
        </PvTypography>
        <PvSelect
          value={props.design}
          onValueChange={(value) => props.onDesign(DESIGNS.find((candidate) => candidate.id === value)?.id ?? 'current')}
        >
          <PvSelectTrigger aria-label="Design" data-testid="design-select" className="h-8 w-60 gap-2 text-xs">
            <PvSelectValue />
          </PvSelectTrigger>
          <PvSelectContent>
            {DESIGNS.map((design) => (
              <PvSelectItem key={design.id} value={design.id} className="text-xs">
                {design.label}
              </PvSelectItem>
            ))}
          </PvSelectContent>
        </PvSelect>
      </div>
    </div>
  </div>
);

const SegmentHeader: FC<{ passCount: number; latest: Pass | undefined }> = (props) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex min-w-0 items-center gap-2">
      <PvIconTile icon={SplinePointer} className="text-sport-running" />
      <div className="min-w-0">
        <PvTypography variant="h2" as="h1" className="truncate">
          Isar loop · Reichenbach → Wittelsbacher
        </PvTypography>
        <PvTypography variant="caption" as="p" tabularNums className="truncate">
          {`${props.latest === undefined ? '' : formatDate(props.latest.date)} · 1.40 km · +4 m · ${props.passCount} passes`}
        </PvTypography>
      </div>
    </div>
    <PvButton variant="ghost" size="icon" aria-label="Segment actions">
      <Ellipsis size={18} />
    </PvButton>
  </div>
);

const SessionPlaceholder: FC<{ pass: Pass; onBack: () => void }> = (props) => (
  <div data-testid="session-placeholder" className="flex flex-col gap-3">
    <PvButton variant="ghost" size="sm" className="self-start" onClick={props.onBack}>
      <ChevronLeft size={16} /> Segment
    </PvButton>
    <PvCard className="gap-3">
      <div className="flex items-center gap-2">
        <PvIconTile icon={Footprints} className="text-sport-running" />
        <div>
          <PvTypography variant="h2" as="h1">
            {props.pass.name}
          </PvTypography>
          <PvTypography variant="caption" as="p">
            {`${formatDate(props.pass.date)} · session detail`}
          </PvTypography>
        </div>
      </div>
      <div className="h-24 rounded-xl bg-white/5" />
      <div className="h-48 rounded-xl bg-white/5" />
    </PvCard>
  </div>
);

export const App: FC = () => {
  const [scenario, setScenario] = useState<Scenario>(scenarioFromUrl);
  const passes = PASSES_BY_SCENARIO[scenario];
  const best = bestOf(passes);
  const [selection, setSelection] = useState({ scenario, id: initialSelection({ scenario, passes }) });
  const [openPass, setOpenPass] = useState<Pass | null>(null);
  const [design, setDesign] = useState<DotChipLook>(designFromUrl);
  let selectedId = selection.id;
  if (selection.scenario !== scenario) selectedId = initialSelection({ scenario, passes });
  const selected = passes.find((pass) => pass.id === selectedId) ?? best;

  const changeScenario = (next: Scenario) => {
    setScenario(next);
    setOpenPass(null);
    setSelection({ scenario: next, id: initialSelection({ scenario: next, passes: PASSES_BY_SCENARIO[next] }) });
    writeUrl({ scenario: next, design });
  };

  const changeDesign = (next: DotChipLook) => {
    setDesign(next);
    writeUrl({ scenario, design: next });
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-surface-base text-text-primary lg:flex-row">
      <MapPlaceholder scenario={scenario} design={design} onScenario={changeScenario} onDesign={changeDesign} />
      <main
        data-testid="panel"
        className={cn(
          GLASS_CLASS,
          'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-t-2xl px-4 pb-6 lg:w-120 lg:flex-none lg:rounded-none lg:border-y-0 lg:border-r-0 lg:px-6',
        )}
      >
        {openPass !== null && <div className="pt-4"><SessionPlaceholder pass={openPass} onBack={() => setOpenPass(null)} /></div>}
        {openPass === null && (
          <>
            <div className="pt-4">
              <SegmentHeader passCount={passes.length} latest={passes[passes.length - 1]} />
            </div>
            <PassStrip
              passes={passes}
              best={best}
              selected={selected}
              onSelect={(id) => setSelection({ scenario, id })}
              onOpen={setOpenPass}
              look={design}
            />
            <Explorer selected={selected} best={best} />
          </>
        )}
      </main>
    </div>
  );
};
