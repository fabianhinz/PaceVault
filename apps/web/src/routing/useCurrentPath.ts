import { useLocation } from 'react-router-dom';

export const useCurrentPath = (): string => useLocation().pathname;
