import type { FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';

interface ContinueButtonProps {
  onClick: () => void;
}

export const ContinueButton: FC<ContinueButtonProps> = (props) => (
  <PvButton onClick={props.onClick}>{m.ui_btn_continue()}</PvButton>
);
