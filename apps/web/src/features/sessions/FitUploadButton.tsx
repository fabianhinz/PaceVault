import { useRef, type FC } from 'react';
import { m } from '@pacevault/i18n/messages.js';
import { PvButton } from '@pacevault/ui/components/pvButton/PvButton.tsx';
import { UPLOAD_EXTENSIONS } from '@/lib/archive.ts';
import type { ProfileGate } from '@/features/settings/hooks/types.ts';
import { useFileUpload } from './hooks/useFileUpload.ts';

interface FitUploadButtonProps {
  profileGate?: ProfileGate;
  onUploaded?: () => void;
}

export const FitUploadButton: FC<FitUploadButtonProps> = (props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useFileUpload();

  let ready = upload.profile !== null;
  if (props.profileGate) ready = props.profileGate.ready;

  const handleChange = async (input: HTMLInputElement) => {
    if (!input.files) return;
    await upload.handleFiles(input.files);
    input.value = '';
    props.onUploaded?.();
  };

  return (
    <>
      <PvButton
        disabled={!ready || upload.uploading}
        onClick={() => {
          props.profileGate?.save();
          fileInputRef.current?.click();
        }}
      >
        {m.ui_fit_files_upload()}
      </PvButton>
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_EXTENSIONS.join(',')}
        multiple
        className="hidden"
        onChange={(e) => void handleChange(e.currentTarget)}
        disabled={upload.uploading}
      />
    </>
  );
};
