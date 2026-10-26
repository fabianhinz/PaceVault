import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Banner } from './Banner.tsx';
import './banner.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Banner />
    </StrictMode>,
  );
}
