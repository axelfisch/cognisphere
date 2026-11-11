import { boot } from './ui/app.js';

window.addEventListener('error', (e) => { document.documentElement.dataset.error = String(e.message || 'error'); });
window.addEventListener('unhandledrejection', (e) => { document.documentElement.dataset.error = String((e.reason && e.reason.message) || e.reason || 'rejection'); });
boot(document.getElementById('app')).then((app) => { window.__cognisphere = { version: typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev', saveState: () => app.store.saveState }; });
