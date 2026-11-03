import { useState } from 'react';
import type { Segment } from '@/lib/workers/segmentsContract.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { latestPassOf } from '@/components/segments/segmentPasses.ts';

export const useSegmentPassSelection = (
  segment: Segment,
): [string, (sessionId: string) => void] => {
  const from = useRouterParam('from');
  const origin = segment.passes.find((pass) => pass.sessionId === from);
  const fallback = origin?.sessionId ?? latestPassOf(segment)?.sessionId ?? '';
  const scope = `${segment.id}|${origin?.sessionId ?? ''}`;
  const [picked, setPicked] = useState<{ scope: string; sessionId: string } | null>(null);

  let selected = fallback;
  if (picked !== null && picked.scope === scope) {
    const pickedSessionId = picked.sessionId;
    if (segment.passes.some((pass) => pass.sessionId === pickedSessionId))
      selected = pickedSessionId;
  }
  return [selected, (sessionId) => setPicked({ scope, sessionId })];
};
