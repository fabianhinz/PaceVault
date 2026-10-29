import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useLayoutStore } from '@/store/layout.ts';
import { parseDemoRoutes } from '@/lib/demo/demoRecords.ts';
import { buildPreviewPasses } from '@/lib/demo/previewDrawIn.ts';
import type { PreviewPasses, QueryResults } from '@/types.ts';

const EMPTY_PREVIEW: PreviewPasses = { passes: [], bounds: null };

export const loadOnboardingPreviewRoutes = async (): Promise<
  QueryResults['onboardingPreviewRoutes']
> => {
  const routesModule = await import('@/lib/demo/demoRoutes.json');
  const routes = parseDemoRoutes(routesModule.default);
  if (!routes) return EMPTY_PREVIEW;
  return buildPreviewPasses(routes.routes);
};

export const onboardingPreviewRoutesQueryKey = (): string[] => ['onboarding-preview-routes'];

export const useOnboardingPreviewRoutes = (): UseQueryResult<
  QueryResults['onboardingPreviewRoutes']
> => {
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  return useQuery({
    queryKey: onboardingPreviewRoutesQueryKey(),
    queryFn: loadOnboardingPreviewRoutes,
    enabled: !onboardingComplete,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
};
