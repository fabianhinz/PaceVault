import { useRef } from 'react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { UPLOAD_EXTENSIONS } from '@/lib/archive.ts';
import type { ProfileGate } from '@/features/settings/hooks/useThresholdsForm.ts';
import { useFileUpload } from './hooks/useFileUpload.ts';

interface FitUploadButtonProps {
  profileGate?: ProfileGate;
  onUploaded?: () => void;
}

export const FitUploadButton = (props: FitUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useFileUpload();

  let ready = upload.profile !== null;
  if (props.profileGate) ready = props.profileGate.ready;

  return (
    <>
      <Button
        disabled={!ready || upload.uploading}
        onClick={() => {
          props.profileGate?.save();
          fileInputRef.current?.click();
        }}
      >
        {m.ui_fit_files_upload()}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_EXTENSIONS.join(',')}
        multiple
        className="hidden"
        onChange={async (e) => {
          const input = e.currentTarget;
          if (!input.files) return;
          await upload.handleFiles(input.files);
          input.value = '';
          props.onUploaded?.();
        }}
        disabled={upload.uploading}
      />
    </>
  );
};
