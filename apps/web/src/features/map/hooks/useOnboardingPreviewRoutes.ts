import { useQuery } from '@tanstack/react-query';
import { useLayoutStore } from '@/store/layout.ts';
import { parseDemoRoutes } from '@/features/demo/demoRecords.ts';
import { buildPreviewPasses, type PreviewPasses } from '../previewDrawIn.ts';

const EMPTY_PREVIEW: PreviewPasses = { passes: [], bounds: null };

const loadPreviewRoutes = async (): Promise<PreviewPasses> => {
  const routesModule = await import('@/features/demo/demoRoutes.json');
  const routes = parseDemoRoutes(routesModule.default);
  if (!routes) return EMPTY_PREVIEW;
  return buildPreviewPasses(routes.routes);
};

/** The demo routes decoded for the first-start preview; fetched once, dropped after onboarding. */
export const useOnboardingPreviewRoutes = () => {
  const onboardingComplete = useLayoutStore((s) => s.onboardingComplete);
  return useQuery({
    queryKey: ['onboarding-preview-routes'],
    queryFn: loadPreviewRoutes,
    enabled: !onboardingComplete,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
};
