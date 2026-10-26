import { useTimeoutFn, useUpdateEffect } from 'react-use';

const SHOW_MS = 12000;

interface WriteCardHoverHandlers {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const useWriteCardCloseTimer = (options: {
  latestId: number | undefined;
  hide: (id: number) => void;
}): WriteCardHoverHandlers => {
  const timeout = useTimeoutFn(() => {
    if (options.latestId !== undefined) options.hide(options.latestId);
  }, SHOW_MS);
  const cancel = timeout[1];
  const restart = timeout[2];
  useUpdateEffect(() => {
    restart();
  }, [options.latestId]);
  return { onMouseEnter: cancel, onMouseLeave: restart };
};
