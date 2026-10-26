import { useMemo, type FC } from 'react';
import { cn } from '@pacevault/ui/lib/cn.ts';

interface ProseProps {
  html: string;
  className?: string;
}

// React 19 sets innerHTML again for every new `__html` object: keep one per HTML string.

export const Prose: FC<ProseProps> = (props) => {
  const html = useMemo(() => ({ __html: props.html }), [props.html]);
  return <div className={cn('wb-md', props.className)} dangerouslySetInnerHTML={html} />;
};
