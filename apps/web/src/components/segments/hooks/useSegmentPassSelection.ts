import { useState } from 'react';
import type { MatchedSegment } from '@/components/segments/types.ts';
import { useRouterParam } from '@/routing/useRouterParam.ts';
import { latestPassOf } from '@/components/segments/segmentPasses.ts';

export const useSegmentPassSelection = (
  segment: MatchedSegment,
): [string | null, (sessionId: string) => void] => {
  const from = useRouterParam('from');
  const origin = segment.passes.find((pass) => pass.sessionId === from);
  const fallback = origin?.sessionId ?? latestPassOf(segment)?.sessionId ?? null;
  const scope = `${segment.id}|${origin?.sessionId ?? ''}`;
  const [picked, setPicked] = useState<{ scope: string; sessionId: string } | null>(null);

  let selected = fallback;
  if (
    picked !== null &&
    picked.scope === scope &&
    segment.passes.some((pass) => pass.sessionId === picked.sessionId)
  )
    selected = picked.sessionId;
  return [selected, (sessionId) => setPicked({ scope, sessionId })];
};
