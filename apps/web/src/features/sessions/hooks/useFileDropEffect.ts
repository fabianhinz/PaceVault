import { useEffect, useRef } from 'react';
import { useSnackbar } from '@/lib/hooks/useSnackbar.ts';
import { SESSIONS_SNACKBARS } from '@/features/sessions/sessionsSnackbars.ts';

export const useFileDropEffect = ({
  onDrop,
  enabled,
}: {
  onDrop: (files: FileList) => Promise<void>;
  enabled: boolean;
}): void => {
  const counterRef = useRef(0);
  const snackbar = useSnackbar();

  useEffect(() => {
    if (!enabled) return;

    const showHint = () => {
      snackbar.enqueueSnackbar(SESSIONS_SNACKBARS.dropHint);
    };

    const hideHint = () => {
      snackbar.closeSnackbar(SESSIONS_SNACKBARS.dropHint.key);
    };

    const handleDragEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      e.preventDefault();
      counterRef.current++;
      if (counterRef.current === 1) showHint();
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      if (!e.dataTransfer?.types.includes('Files')) return;
      counterRef.current--;
      if (counterRef.current === 0) hideHint();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      counterRef.current = 0;
      hideHint();
      if (e.dataTransfer?.files.length) {
        void onDrop(e.dataTransfer.files);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
      counterRef.current = 0;
      hideHint();
    };
  }, [onDrop, enabled, snackbar]);
};
