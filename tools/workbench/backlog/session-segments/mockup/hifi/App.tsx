import { useMemo, useState, type FC } from 'react';
import { useMeasure } from 'react-use';
import { FlaskConical, LayoutDashboard, Settings, Zap } from 'lucide-react';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { PvSegmentedControl } from '@pacevault/ui/components/pvSegmentedControl/PvSegmentedControl.tsx';
import { PvSelect } from '@pacevault/ui/components/pvSelect/PvSelect.tsx';
import { PvSelectContent } from '@pacevault/ui/components/pvSelect/PvSelectContent.tsx';
import { PvSelectItem } from '@pacevault/ui/components/pvSelect/PvSelectItem.tsx';
import { PvSelectTrigger } from '@pacevault/ui/components/pvSelect/PvSelectTrigger.tsx';
import { PvSelectValue } from '@pacevault/ui/components/pvSelect/PvSelectValue.tsx';
import { PvSheetGrabber } from '@pacevault/ui/components/pvSheetGrabber/PvSheetGrabber.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { FLOATING_CLASS, GLASS_CLASS } from '@pacevault/ui/lib/surfaces.ts';
import { tokens } from '@pacevault/ui/lib/tokens.ts';
import { copy, type Copy, type Lang } from './copy.ts';
import { bestPass, latestPass, segmentsOf, sportsWithSegments, type Sport } from './data.ts';
import { entryLabel, entryPasses } from './entries.ts';
import { distance } from './format.ts';
import { setHover } from './hoverStore.ts';
import { SegmentMap } from './SegmentMap.tsx';
import { SegmentPage } from './SegmentPage.tsx';

type Device = 'desktop' | 'phone';

const COLOR_BY_SPORT: Record<Sport, string> = { running: tokens.sportRunning, cycling: tokens.sportCycling };
const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const PHONE_MAP_HEIGHT = 300;
const DESKTOP_COLUMN_SHARE = 0.4;
const DOCK_FOOTPRINT = 76;

const DOCK_ITEMS = [
  { key: 'dashboard', icon: LayoutDashboard },
  { key: 'sessions', icon: Zap },
  { key: 'labs', icon: FlaskConical },
  { key: 'settings', icon: Settings },
] as const;

const Dock: FC<{ text: Copy; device: Device }> = (props) => (
  <nav
    className={cn(
      FLOATING_CLASS,
      'absolute z-raised flex rounded-full',
      props.device === 'desktop' && 'top-1/2 left-3 -translate-y-1/2 flex-col gap-1 p-1',
      props.device === 'phone' && 'right-3 bottom-4 left-3 justify-around gap-0.5 p-[3px]',
    )}
  >
    {DOCK_ITEMS.map((item) => (
      <PvButton
        key={item.key}
        variant="ghost"
        size="icon"
        aria-label={props.text[item.key]}
        title={props.text[item.key]}
        className={cn('relative size-10 shrink-0 rounded-full text-text-tertiary', item.key === 'dashboard' && 'bg-accent-muted text-accent-hover hover:bg-accent-muted hover:text-accent-hover')}
      >
        <item.icon size={20} strokeWidth={1.5} />
      </PvButton>
    ))}
  </nav>
);

interface MockupBarProps {
  sport: Sport;
  segmentId: string;
  fromSessionId: string | null;
  lang: Lang;
  device: Device;
  onFrom: (sessionId: string | null) => void;
  onSport: (sport: Sport) => void;
  onSegment: (id: string) => void;
  onLang: (lang: Lang) => void;
  onDevice: (device: Device) => void;
}

const MockupBar: FC<MockupBarProps> = (props) => {
  const text = copy(props.lang);
  const sports = sportsWithSegments();
  const segment = segmentsOf(props.sport).find((s) => s.id === props.segmentId);
  if (segment === undefined) return null;
  let route = `/segments/${props.segmentId}`;
  if (props.fromSessionId !== null) route = `${route}?from=${props.fromSessionId}`;
  return (
    <div data-testid="mockup-bar" className="flex h-12 shrink-0 items-center gap-3 border-b border-dashed border-amber-400/40 bg-surface-sunken px-4">
      <PvTypography variant="overline" color="warning" noWrap>
        Mockup only
      </PvTypography>
      <div className="w-80">
        <PvSelect value={props.segmentId} onValueChange={props.onSegment}>
          <PvSelectTrigger className="h-8 py-1 whitespace-nowrap [&>span]:truncate" aria-label="Segment" data-testid="segment-picker">
            <PvSelectValue />
          </PvSelectTrigger>
          <PvSelectContent className="max-h-96">
            {segmentsOf(props.sport).map((segment) => (
              <PvSelectItem key={segment.id} value={segment.id}>
                {`${text.segmentLabel(segment.type, segment.typeNumber)} · ${distance(props.lang, segment.distanceMeters)} · ${text.passes(segment.passes.length)}`}
              </PvSelectItem>
            ))}
          </PvSelectContent>
        </PvSelect>
      </div>
      <div className="w-64">
        <PvSelect value={props.fromSessionId ?? FROM_TAB} onValueChange={(value) => props.onFrom(value === FROM_TAB ? null : value)}>
          <PvSelectTrigger className="h-8 py-1 whitespace-nowrap [&>span]:truncate" aria-label="Entered from" data-testid="from-picker">
            <PvSelectValue />
          </PvSelectTrigger>
          <PvSelectContent>
            <PvSelectItem value={FROM_TAB}>From · Segments tab</PvSelectItem>
            {entryPasses(segment.passes).map((entry) => (
              <PvSelectItem key={entry.pass.sessionId} value={entry.pass.sessionId}>
                {entryLabel({ date: entry.pass.date, role: entry.role })}
              </PvSelectItem>
            ))}
          </PvSelectContent>
        </PvSelect>
      </div>
      {sports.length > 1 && (
        <PvSegmentedControl size="sm" aria-label="Sport" value={props.sport} onValueChange={(value) => props.onSport(value === 'cycling' ? 'cycling' : 'running')} options={sports.map((sport) => ({ value: sport, label: text.sport(sport) }))} />
      )}
      <PvSegmentedControl size="sm" aria-label="Language" value={props.lang} onValueChange={(value) => props.onLang(value === 'de' ? 'de' : 'en')} options={[{ value: 'en', label: 'EN' }, { value: 'de', label: 'DE' }]} />
      <PvSegmentedControl size="sm" aria-label="Device" value={props.device} onValueChange={(value) => props.onDevice(value === 'phone' ? 'phone' : 'desktop')} options={[{ value: 'desktop', label: 'Desktop' }, { value: 'phone', label: 'Phone 390' }]} />
      <PvTypography variant="caption" color="textTertiary" noWrap className="ml-auto min-w-0" data-testid="route-label">
        {route}
      </PvTypography>
    </div>
  );
};

const PARAMS = new URLSearchParams(location.search);
const EMBED = PARAMS.get('embed') === '1';

const paramSport = (): Sport | undefined => {
  const value = PARAMS.get('sport');
  if (value === 'running' || value === 'cycling') return value;
  return undefined;
};

const initialSport = (): Sport => paramSport() ?? sportsWithSegments()[0] ?? 'running';

const firstSegmentId = (sport: Sport) => segmentsOf(sport)[0]?.id ?? '';

const initialSegmentId = () => {
  const sport = initialSport();
  const wanted = PARAMS.get('segment');
  if (segmentsOf(sport).some((s) => s.id === wanted)) return wanted ?? '';
  return firstSegmentId(sport);
};

const initialLang = (): Lang => {
  if (PARAMS.get('lang') === 'de') return 'de';
  return 'en';
};

const FROM_TAB = 'tab';

const initialFrom = (): string | null => {
  const wanted = PARAMS.get('from');
  const sport = initialSport();
  const segment = segmentsOf(sport).find((s) => s.id === initialSegmentId());
  if (wanted === null || segment === undefined || !segment.passes.some((p) => p.sessionId === wanted)) return null;
  return wanted;
};

const initialDevice = (): Device => {
  if (PARAMS.get('device') === 'phone') return 'phone';
  return 'desktop';
};

export const App: FC = () => {
  const [sport, setSport] = useState<Sport>(initialSport);
  const [segmentId, setSegmentId] = useState(initialSegmentId);
  const [lang, setLang] = useState<Lang>(initialLang);
  const [device, setDevice] = useState<Device>(initialDevice);
  const [fromSessionId, setFromSessionId] = useState<string | null>(initialFrom);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [timesOpen, setTimesOpen] = useState(true);
  const [frameRef, frame] = useMeasure<HTMLDivElement>();
  const text = useMemo(() => copy(lang), [lang]);

  const segment = segmentsOf(sport).find((s) => s.id === segmentId) ?? segmentsOf(sport)[0];
  if (segment === undefined) return null;
  const best = bestPass(segment);
  const latest = latestPass(segment);
  const origin = segment.passes.find((p) => p.sessionId === fromSessionId);
  const selected = segment.passes.find((p) => p.sessionId === selectedSessionId) ?? origin ?? latest;
  const sportColor = COLOR_BY_SPORT[sport];

  const chooseSegment = (id: string) => {
    setSegmentId(id);
    setFromSessionId(null);
    setSelectedSessionId(null);
    setTimesOpen(true);
    setHover(null);
  };
  const chooseFrom = (sessionId: string | null) => {
    setFromSessionId(sessionId);
    setSelectedSessionId(null);
    setTimesOpen(true);
    setHover(null);
  };
  const chooseSport = (next: Sport) => {
    setSport(next);
    chooseSegment(firstSegmentId(next));
  };

  const page = (
    <SegmentPage
      segment={segment}
      best={best}
      origin={origin}
      selected={selected}
      timesOpen={timesOpen}
      onToggleTimes={() => setTimesOpen((open) => !open)}
      onSelect={setSelectedSessionId}
      sportColor={sportColor}
      lang={lang}
      text={text}
    />
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface-base" lang={lang}>
      {!EMBED && <MockupBar sport={sport} segmentId={segment.id} fromSessionId={origin?.sessionId ?? null} onFrom={chooseFrom} lang={lang} device={device} onSport={chooseSport} onSegment={chooseSegment} onLang={setLang} onDevice={setDevice} />}
      <div ref={frameRef} className="relative min-h-0 flex-1 overflow-hidden">
        {device === 'desktop' && (
          <div className="absolute inset-0" data-testid="desktop-frame">
            <SegmentMap
              segment={segment}
              selected={selected}
              best={best}
              sportColor={sportColor}
              label={text.map}
              inset={{ top: 64, bottom: 64, left: DOCK_FOOTPRINT + 32, right: frame.width * DESKTOP_COLUMN_SHARE + 56 }}
            />
            <Dock text={text} device="desktop" />
            <div data-testid="content-column" className="absolute top-0 right-0 bottom-0 overflow-y-auto pt-6 pr-6 pb-28" style={{ width: `${DESKTOP_COLUMN_SHARE * 100}%`, scrollbarWidth: 'none' }}>
              {page}
            </div>
          </div>
        )}
        {device === 'phone' && (
          <div className={cn('flex h-full items-center justify-center', !EMBED && 'p-2')}>
            <div
              data-testid="phone-frame"
              className={cn('relative overflow-hidden', !EMBED && 'rounded-[28px] border border-white/10')}
              style={EMBED ? { width: '100%', height: '100%' } : { width: PHONE_WIDTH, height: Math.min(PHONE_HEIGHT, frame.height - 16) }}
            >
              <div className="absolute inset-x-0 top-0" style={{ height: PHONE_MAP_HEIGHT + 24 }}>
                <SegmentMap segment={segment} selected={selected} best={best} sportColor={sportColor} label={text.map} inset={{ top: 24, bottom: 48, left: 24, right: 24 }} />
              </div>
              <div className={cn(GLASS_CLASS, 'absolute inset-x-0 bottom-0 flex flex-col rounded-t-2xl border-b-0')} style={{ top: PHONE_MAP_HEIGHT }}>
                <div className="flex justify-center pt-2.5 pb-1">
                  <PvSheetGrabber />
                </div>
                <div data-testid="content-column" className="min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-28" style={{ scrollbarWidth: 'none' }}>
                  {page}
                </div>
              </div>
              <Dock text={text} device="phone" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
