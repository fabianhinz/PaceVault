import { useTimeoutFn, useUpdateEffect } from 'react-use';

const SHOW_MS = 12000;

interface WriteCardHoverHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const useWriteCardCloseTimer = ({
  latestId,
  hide,
}: {
  latestId: number | undefined;
  hide: (id: number) => void;
}): WriteCardHoverHandlers => {
  const timeout = useTimeoutFn(() => {
    if (latestId !== undefined) hide(latestId);
  }, SHOW_MS);
  const cancel = timeout[1];
  const restart = timeout[2];
  useUpdateEffect(() => {
    restart();
  }, [latestId]);
  return { onMouseEnter: cancel, onMouseLeave: restart };
};
