import { ZoomOut } from 'lucide-react';
import { m } from '@/paraglide/messages.js';
import { ToolbarButton } from './ToolbarButton.tsx';

export const ZoomResetButton = (props: { isZoomed: boolean; onReset: () => void }) => (
  <ToolbarButton
    testId="zoom-reset-chip"
    disabled={!props.isZoomed}
    active={props.isZoomed}
    onClick={props.onReset}
    className="z-10 mx-3 mt-3 mb-1 hidden w-[calc(100%-1.5rem)] backdrop-blur-2xl lg:sticky lg:top-6 lg:flex"
  >
    <ZoomOut size={16} />
    <span>{m.ui_chart_reset_zoom()}</span>
  </ToolbarButton>
);
