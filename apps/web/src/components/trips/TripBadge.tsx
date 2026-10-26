import type { FC } from 'react';
import { Compass } from 'lucide-react';
import { PvIconTile } from '@pacevault/ui/components/pvIconTile/PvIconTile.tsx';

export const TripBadge: FC = () => <PvIconTile icon={Compass} />;
