import { useSegmentsStore, type Segment } from '@/store/segments.ts';
import { usePageRouting } from '@/routing/usePageRouting.ts';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { SEGMENTS_SNACKBARS } from '@/components/segments/segmentsSnackbars.ts';

interface SaveSegment {
  save: (draft: Segment | null) => void;
}

export const useSaveSegment = (): SaveSegment => {
  const pageRouting = usePageRouting();
  const snackbar = useSnackbar();

  return {
    save: (draft) => {
      if (draft === null) {
        snackbar.enqueueSnackbar(SEGMENTS_SNACKBARS.noGps);
        return;
      }
      useSegmentsStore.getState().addSegment(draft);
      pageRouting.open({ page: 'segmentDetail', params: { segmentId: draft.id } });
    },
  };
};
