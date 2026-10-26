import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { m } from '@pacevault/i18n/messages.js';
import { useStudioStore, type StudioRoute } from '@/store/studio.ts';
import { useStudioMarkerEditorStore } from '@/store/studioMarkerEditor.ts';
import { toKm } from '@/lib/formatters.ts';

interface MarkerFields {
  kmText: string;
  kmFromSplitText: string;
  label: string;
  description: string;
  prevSplitM: number | null;
}

interface StudioMarkerForm {
  active: boolean;
  editing: boolean;
  poiMarker: boolean;
  maxKm: number;
  title: string;
  label: string;
  description: string;
  kmText: string;
  kmFromSplitText: string;
  showsFromSplit: boolean;
  canSave: boolean;
  setLabel: (value: string) => void;
  setDescription: (value: string) => void;
  handleKmStartChange: (value: string) => void;
  handleKmFromSplitChange: (value: string) => void;
  handleSave: () => void;
  handleDelete: () => void;
}

const EMPTY_FIELDS: MarkerFields = {
  kmText: '',
  kmFromSplitText: '',
  label: '',
  description: '',
  prevSplitM: null,
};

const clampKm = ({ km, maxKm }: { km: number; maxKm: number }): number => {
  if (Number.isNaN(km) || km < 0) return 0;
  if (km > maxKm) return maxKm;
  return km;
};

const previousSplitM = ({
  route,
  markerId,
  poiMarker,
  seedM,
}: {
  route: StudioRoute;
  markerId: string | null;
  poiMarker: boolean;
  seedM: number;
}): number | null => {
  if (poiMarker) return null;
  return route.markers
    .filter((mk) => mk.type === 'track_modifier' && mk.id !== markerId && mk.distanceM < seedM)
    .reduce<number | null>((max, mk) => Math.max(max ?? 0, mk.distanceM), null);
};

const seededFields = ({
  route,
  markerId,
  poiMarker,
  initialDistanceM,
}: {
  route: StudioRoute;
  markerId: string | null;
  poiMarker: boolean;
  initialDistanceM: number | null;
}): MarkerFields => {
  const existing = route.markers.find((mk) => mk.id === markerId);
  let seedM = initialDistanceM ?? route.distance / 2;
  if (existing) seedM = existing.distanceM;
  let label = '';
  let description = '';
  if (existing?.type === 'point_of_interest') {
    label = existing.label;
    description = existing.description ?? '';
  }
  const prevSplitM = previousSplitM({ route, markerId, poiMarker, seedM });
  let kmFromSplitText = '';
  if (prevSplitM !== null) kmFromSplitText = toKm(seedM - prevSplitM);
  return { kmText: toKm(seedM), kmFromSplitText, label, description, prevSplitM };
};

const seedTargetOf = ({
  active,
  markerId,
  type,
  initialDistanceM,
}: {
  active: boolean;
  markerId: string | null;
  type: string;
  initialDistanceM: number | null;
}): string | null => {
  if (!active) return null;
  return `${markerId ?? 'new'}|${type}|${initialDistanceM ?? ''}`;
};

const isMarkerSaveAllowed = ({
  fields,
  poiMarker,
  showsFromSplit,
}: {
  fields: MarkerFields;
  poiMarker: boolean;
  showsFromSplit: boolean;
}): boolean => {
  const kmIsNumber = !Number.isNaN(Number.parseFloat(fields.kmText));
  const fromSplitIsNumber = !Number.isNaN(Number.parseFloat(fields.kmFromSplitText));
  return (
    kmIsNumber &&
    (!poiMarker || fields.label.trim().length > 0) &&
    (!showsFromSplit || fromSplitIsNumber)
  );
};

const kmStartChanged = ({
  fields,
  value,
  maxKm,
}: {
  fields: MarkerFields;
  value: string;
  maxKm: number;
}): MarkerFields => {
  if (fields.prevSplitM === null) return { ...fields, kmText: value };
  const distanceM = clampKm({ km: Number.parseFloat(value), maxKm }) * 1000;
  return {
    ...fields,
    kmText: value,
    kmFromSplitText: toKm(Math.max(0, distanceM - fields.prevSplitM)),
  };
};

const kmFromSplitChanged = ({
  fields,
  value,
  maxKm,
}: {
  fields: MarkerFields;
  value: string;
  maxKm: number;
}): MarkerFields => {
  const offsetKm = Number.parseFloat(value);
  if (fields.prevSplitM === null || Number.isNaN(offsetKm)) {
    return { ...fields, kmFromSplitText: value };
  }
  const distanceM = clampKm({ km: fields.prevSplitM / 1000 + Math.max(0, offsetKm), maxKm }) * 1000;
  return { ...fields, kmFromSplitText: value, kmText: toKm(distanceM) };
};

const saveMarker = ({
  route,
  markerId,
  poiMarker,
  fields,
  maxKm,
}: {
  route: StudioRoute;
  markerId: string | null;
  poiMarker: boolean;
  fields: MarkerFields;
  maxKm: number;
}) => {
  const distanceM = clampKm({ km: Number.parseFloat(fields.kmText), maxKm }) * 1000;
  const store = useStudioStore.getState();

  if (poiMarker) {
    const poiFields = {
      distanceM,
      label: fields.label.trim(),
      description: fields.description.trim() || undefined,
    };
    if (markerId) {
      store.updateStudioPoi({ routeId: route.id, markerId, fields: poiFields });
    } else {
      store.addStudioMarker({
        routeId: route.id,
        marker: { type: 'point_of_interest', ...poiFields },
      });
    }
  } else if (markerId) {
    store.moveStudioMarker({ routeId: route.id, markerId, distanceM });
  } else {
    store.addStudioMarker({ routeId: route.id, marker: { type: 'track_modifier', distanceM } });
  }
};

const markerTitle = ({ poiMarker, editing }: { poiMarker: boolean; editing: boolean }): string => {
  if (poiMarker && editing) return m.ui_studio_marker_edit_waypoint();
  if (poiMarker) return m.ui_studio_marker_add_waypoint();
  if (editing) return m.ui_studio_marker_edit_split();
  return m.ui_studio_marker_add_split();
};

export const useStudioMarkerForm = (route: StudioRoute): StudioMarkerForm => {
  const editor = useStudioMarkerEditorStore(
    useShallow((s) => ({
      open: s.open,
      routeId: s.routeId,
      markerId: s.markerId,
      type: s.type,
      initialDistanceM: s.initialDistanceM,
    })),
  );
  const active = editor.open && editor.routeId === route.id;
  const poiMarker = editor.type === 'point_of_interest';
  const maxKm = route.distance / 1000;
  const seedTarget = seedTargetOf({ active, ...editor });
  const [fields, setFields] = useState<MarkerFields>(EMPTY_FIELDS);
  const [seededTarget, setSeededTarget] = useState<string | null>(null);
  if (seedTarget !== seededTarget) {
    setSeededTarget(seedTarget);
    if (seedTarget !== null) {
      setFields(seededFields({ route, poiMarker, ...editor }));
    }
  }
  const showsFromSplit = !poiMarker && fields.prevSplitM !== null;
  const canSave = isMarkerSaveAllowed({ fields, poiMarker, showsFromSplit });

  return {
    active,
    editing: editor.markerId !== null,
    poiMarker,
    maxKm,
    title: markerTitle({ poiMarker, editing: editor.markerId !== null }),
    label: fields.label,
    description: fields.description,
    kmText: fields.kmText,
    kmFromSplitText: fields.kmFromSplitText,
    showsFromSplit,
    canSave,
    setLabel: (value) => setFields((current) => ({ ...current, label: value })),
    setDescription: (value) => setFields((current) => ({ ...current, description: value })),
    handleKmStartChange: (value) =>
      setFields((current) => kmStartChanged({ fields: current, value, maxKm })),
    handleKmFromSplitChange: (value) =>
      setFields((current) => kmFromSplitChanged({ fields: current, value, maxKm })),
    handleSave: () => {
      if (!canSave) return;
      saveMarker({ route, markerId: editor.markerId, poiMarker, fields, maxKm });
      useStudioMarkerEditorStore.getState().close();
    },
    handleDelete: () => {
      if (editor.markerId) {
        useStudioStore
          .getState()
          .deleteStudioMarker({ routeId: route.id, markerId: editor.markerId });
      }
      useStudioMarkerEditorStore.getState().close();
    },
  };
};
