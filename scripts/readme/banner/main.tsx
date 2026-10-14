import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Banner } from './Banner.tsx';
import '@/index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <Banner />
    </StrictMode>,
  );
}
