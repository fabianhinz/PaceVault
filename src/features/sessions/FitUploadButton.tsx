import { useRef } from 'react';
import { m } from '@/paraglide/messages.js';
import { Button } from '@/components/ui/Button.tsx';
import { UPLOAD_EXTENSIONS } from '@/lib/archive.ts';
import { useFileUpload } from './hooks/useFileUpload.ts';

interface FitUploadButtonProps {
  onUploaded?: () => void;
}

export const FitUploadButton = (props: FitUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const upload = useFileUpload(fileInputRef);

  return (
    <>
      <Button disabled={!upload.profile || upload.uploading} onClick={upload.triggerUpload}>
        {m.ui_fit_files_upload()}
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept={UPLOAD_EXTENSIONS.join(',')}
        multiple
        className="hidden"
        onChange={async (e) => {
          if (!e.target.files) return;
          await upload.handleFiles(e.target.files);
          props.onUploaded?.();
        }}
        disabled={upload.uploading}
      />
    </>
  );
};
