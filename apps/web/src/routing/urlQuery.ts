export const SUPPORTED_QUERY = { id: 'id', tab: 'tab', from: 'from' } as const;
export type SupportedQuery = (typeof SUPPORTED_QUERY)[keyof typeof SUPPORTED_QUERY];
