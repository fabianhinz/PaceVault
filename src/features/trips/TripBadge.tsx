import { Compass } from 'lucide-react';

export const TripBadge = () => {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-text-secondary">
      <Compass size={18} strokeWidth={2} />
    </div>
  );
};
