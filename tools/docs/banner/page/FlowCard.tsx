import { Fragment, type FC } from 'react';
import { ArrowRight } from 'lucide-react';
import { PvCard } from '@pacevault/ui/components/pvCard/PvCard.tsx';
import { PvTypography } from '@pacevault/ui/components/pvTypography/PvTypography.tsx';
import { cn } from '@pacevault/ui/lib/cn.ts';
import { FRAMES_BY_FLOW, type FlowKey } from '../bannerContent.ts';
import { BANNER_COPY } from './bannerLocale.ts';
import { FitText } from './FitText.tsx';
import { FrameShots } from './FrameShots.tsx';
import { FRAME_HEIGHT_CLASS } from './frameSize.ts';
import { StepCaption } from './StepCaption.tsx';

interface FlowCardProps {
  flowKey: FlowKey;
  index: number;
}

export const FlowCard: FC<FlowCardProps> = (props) => {
  const flowText = BANNER_COPY.flows[props.flowKey];
  const fill = props.index === 0;
  return (
    <PvCard className={cn('min-w-0 gap-3 p-3', fill && 'flex-1', !fill && 'flex-none')}>
      <FitText className="px-1">
        <PvTypography variant="title" as="span">
          {flowText.title}
        </PvTypography>
      </FitText>
      <div className="flex">
        {FRAMES_BY_FLOW[props.flowKey].map((frame, frameIndex) => (
          <Fragment key={frame.file}>
            {frameIndex > 0 && (
              <div
                className={cn(
                  'flex',
                  FRAME_HEIGHT_CLASS,
                  'w-12 flex-none items-center justify-center text-text-tertiary',
                )}
              >
                <ArrowRight size={28} />
              </div>
            )}
            <div
              className={cn(
                'flex flex-col gap-2.5',
                fill && 'min-w-0 flex-1',
                !fill && 'w-246px flex-none',
              )}
            >
              <FrameShots frame={frame} />
              <StepCaption step={frameIndex + 1} label={flowText.steps[frameIndex] ?? ''} />
            </div>
          </Fragment>
        ))}
      </div>
    </PvCard>
  );
};
