export const SUPPORTED_QUERY = { id: 'id', tab: 'tab' } as const;
export type SupportedQuery = (typeof SUPPORTED_QUERY)[keyof typeof SUPPORTED_QUERY];
