import type { FC, PropsWithChildren } from 'react';
import { BrowserRouter } from 'react-router-dom';

export const AppRouter: FC<PropsWithChildren> = (props) => (
  <BrowserRouter>{props.children}</BrowserRouter>
);
