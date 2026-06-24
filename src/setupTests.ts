import '@testing-library/jest-dom';
import { vi } from 'vitest';

const noop = () => undefined;
const noopEventDispatch = () => false;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

vi.stubGlobal('localStorage', localStorageMock);
// Ensure window.localStorage is also defined in jsdom
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  });
}

// jsdom does not implement HTMLDialogElement.showModal / .close / Escape-to-close
if (typeof HTMLDialogElement !== 'undefined') {
  const openDialogs = new Set<HTMLDialogElement>();

  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
    openDialogs.add(this);
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    openDialogs.delete(this);
    this.dispatchEvent(new Event('close'));
  };

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      const topDialog = [...openDialogs].at(-1);
      if (topDialog) {
        event.preventDefault();
        topDialog.close();
      }
    }
  });
}

vi.stubGlobal('matchMedia', (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: noop,
  removeListener: noop,
  addEventListener: noop,
  removeEventListener: noop,
  dispatchEvent: noopEventDispatch,
}));
