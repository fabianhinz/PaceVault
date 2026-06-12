import { useState } from 'react';
import { m } from '@/paraglide/messages.js';
import { useSessionsStore } from '@/store/sessions.ts';
import { useUserStore } from '@/store/user.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  DialogRoot,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/Dialog.tsx';
import { AutoSessionNamesToggle } from '@/features/sessions/AutoSessionNamesToggle.tsx';
import { useSessionTitle } from '@/features/sessions/hooks/useSessionTitle.ts';
import type { TrainingSession } from '@/packages/engine/types.ts';

export const RenameSessionDialog = (props: {
  session: TrainingSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
}) => {
  const [nameInput, setNameInput] = useState(props.initialName);
  const useAutoNames = useUserStore((s) => s.profile?.useAutoSessionNames ?? false);
  const sessionTitle = useSessionTitle(props.session);

  const handleSave = () => {
    if (nameInput.trim()) {
      useSessionsStore.getState().renameSession(props.session.id, nameInput.trim());
      props.onOpenChange(false);
    }
  };

  return (
    <DialogRoot
      open={props.open}
      onOpenChange={(open) => {
        if (!open) props.onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogTitle>{m.ui_session_rename_title()}</DialogTitle>
        <DialogDescription>{m.ui_session_rename_desc()}</DialogDescription>
        <div className="mt-4">
          <AutoSessionNamesToggle />
        </div>
        <input
          type="text"
          value={useAutoNames ? sessionTitle.title : nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !useAutoNames && nameInput.trim()) {
              handleSave();
            }
          }}
          disabled={useAutoNames}
          className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-base lg:text-sm text-text-primary outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
          autoFocus
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => props.onOpenChange(false)}>
            {m.ui_btn_cancel()}
          </Button>
          <Button disabled={useAutoNames} onClick={handleSave}>
            {m.ui_btn_save()}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  );
};
