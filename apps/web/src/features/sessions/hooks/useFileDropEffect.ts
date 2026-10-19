import { useEffect, useRef } from 'react';
import { useToastStore } from '@/store/toast.ts';
import { m } from '@pacevault/i18n/messages.js';

const DROP_TOAST_ID = 'file-drop-hint';

export const useFileDropEffect = (onDrop: (files: FileList) => void, enabled: boolean) => {
  const counterRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const showHint = () => {
      useToastStore.getState().addToast({
        id: DROP_TOAST_ID,
        title: m.toast_drop_hint(),
        persistent: true,
      });
    };

    const hideHint = () => {
      useToastStore.getState().removeToast(DROP_TOAST_ID);
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
        onDrop(e.dataTransfer.files);
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
  }, [onDrop, enabled]);
};
