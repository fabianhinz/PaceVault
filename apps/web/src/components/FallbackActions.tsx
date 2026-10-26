import type { FC, PropsWithChildren } from 'react';

export const FallbackActions: FC<PropsWithChildren> = (props) => (
  <div className="flex w-full flex-col-reverse gap-3 *:w-full sm:w-auto sm:flex-row sm:justify-center sm:*:w-auto">
    {props.children}
  </div>
);
