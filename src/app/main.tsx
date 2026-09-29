import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DARK_MODE_PREF } from '../engine';
import { App } from './App';
import { preferences } from './storage';
import './styles.css';

// TAM-134: light unless the host chose dark mode on this phone (never from the phone's own setting).
if (preferences.get<boolean>(DARK_MODE_PREF, false) === true) document.documentElement.dataset.theme = 'dark';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
