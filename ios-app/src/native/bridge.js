// The only place that talks to native iOS APIs (through Capacitor plugins).
// Every function validates its input and degrades to a web fallback when the plugin is missing.
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Preferences } from '@capacitor/preferences';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export const isNative = () => { try { return Capacitor.isNativePlatform(); } catch { return false; } };

const HAPTIC_KINDS = ['tap', 'select', 'success', 'warning', 'error'];
export async function haptic(kind) {
  if (!HAPTIC_KINDS.includes(kind) || !isNative()) return false;
  try {
    if (kind === 'tap') await Haptics.impact({ style: ImpactStyle.Light });
    else if (kind === 'select') await Haptics.selectionChanged();
    else if (kind === 'success') await Haptics.notification({ type: NotificationType.Success });
    else if (kind === 'warning') await Haptics.notification({ type: NotificationType.Warning });
    else await Haptics.notification({ type: NotificationType.Error });
    return true;
  } catch { return false; }
}

/** Durable key-value storage in the app container (UserDefaults). null on the web. */
export function nativeStore() {
  if (!isNative()) return null;
  return {
    async get(key) { const { value } = await Preferences.get({ key }); return value; },
    async set(key, value) { await Preferences.set({ key, value }); },
  };
}

/** Lifecycle: calls onPause when the app is hidden or interrupted. Resuming is always an explicit user action. */
export function watchLifecycle(onPause) {
  const fire = () => { try { onPause(); } catch { /* never break the lifecycle */ } };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') fire(); });
  window.addEventListener('pagehide', fire);
  if (isNative()) {
    try {
      App.addListener('pause', fire);
      App.addListener('appStateChange', (state) => { if (state && state.isActive === false) fire(); });
    } catch { /* plugin unavailable: DOM events still apply */ }
  }
}

const FILE_NAME = /^[a-z0-9][a-z0-9._-]{0,80}\.(json|pdf)$/;
const MIME = { json: 'application/json', pdf: 'application/pdf' };

/**
 * Share a real file through the iOS share sheet. `base64` is the file content.
 * Resolves to 'shared' | 'cancelled' | 'downloaded'. The temporary file is removed once the sheet closes.
 */
export async function shareFile({ name, base64, title }) {
  if (typeof name !== 'string' || !FILE_NAME.test(name)) throw new Error('invalid file name');
  if (typeof base64 !== 'string' || !base64 || base64.length > 8_000_000 || /[^A-Za-z0-9+/=]/.test(base64)) throw new Error('invalid file content');
  const ext = name.split('.').pop();
  if (!isNative()) { downloadInBrowser(name, base64, MIME[ext]); return 'downloaded'; }
  const path = `exports/${name}`;
  let uri = null;
  try {
    const written = await Filesystem.writeFile({ path, data: base64, directory: Directory.Cache, recursive: true });
    uri = written.uri;
    try {
      await Share.share({ title: typeof title === 'string' ? title.slice(0, 80) : undefined, files: [uri] });
      return 'shared';
    } catch (err) {
      const msg = String((err && err.message) || err || '').toLowerCase();
      if (msg.includes('cancel')) return 'cancelled'; // closing the sheet is a normal exit
      throw err;
    }
  } finally {
    if (uri) { try { await Filesystem.deleteFile({ path, directory: Directory.Cache }); } catch { /* cache is purgeable anyway */ } }
  }
}

function downloadInBrowser(name, base64, type) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Intentional external links (support, online policy) leave the app: mail client or system browser. */
export function openExternal(url) {
  if (typeof url !== 'string' || !/^(https:\/\/|mailto:)/.test(url)) return false;
  window.open(url, '_blank', 'noopener');
  return true;
}
