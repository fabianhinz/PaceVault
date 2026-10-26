import { useState } from 'react';
import type { Trip } from '@/store/trips.ts';

interface TripDraft {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedIds: Set<string>;
  setSelectedIds: (update: (prev: Set<string>) => Set<string>) => void;
  showAll: boolean;
  setShowAll: (showAll: boolean) => void;
}

export const useTripDraft = ({
  open,
  trip,
}: {
  open: boolean;
  trip: Trip | undefined;
}): TripDraft => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);
  const [seededOpen, setSeededOpen] = useState(false);
  if (open !== seededOpen) {
    setSeededOpen(open);
    if (open) {
      setName(trip?.name ?? '');
      setDescription(trip?.description ?? '');
      setSelectedIds(new Set(trip?.sessionIds ?? []));
      setShowAll(false);
    }
  }
  return {
    name,
    setName,
    description,
    setDescription,
    selectedIds,
    setSelectedIds,
    showAll,
    setShowAll,
  };
};
