import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './tailwind.css';
const style = document.createElement('style');
style.textContent = `
  * { font-family: Georgia, 'Times New Roman', serif !important; box-sizing: border-box; }
  .brand-bg { background-size: cover; }
  @media (max-width: 768px) { .brand-bg { background-size: cover; } }
`;
document.head.appendChild(style);
createRoot(document.getElementById('root')).render(_jsx(StrictMode, { children: _jsx(BrowserRouter, { children: _jsx(App, {}) }) }));
