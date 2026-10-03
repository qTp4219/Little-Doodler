import { ColoringState, FreeDrawState } from '../types';

const COLORING_STORAGE_PREFIX = 'toddler_pic_state_';
const FREEDRAW_STORAGE_KEY = 'toddler_freedraw_state';
const DB_NAME = 'toddler_doodler_db';
const DB_VERSION = 1;
const DRAWINGS_STORE = 'canvas_drawings';

/**
 * Open or create native IndexedDB for large drawing bitmaps
 */
function openDB(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(DRAWINGS_STORE)) {
          db.createObjectStore(DRAWINGS_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Save large canvas drawing data URL asynchronously to IndexedDB with localStorage fallback
 */
export async function saveDrawingBitmap(key: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(DRAWINGS_STORE, 'readwrite');
      const store = tx.objectStore(DRAWINGS_STORE);
      store.put(dataUrl, key);
      return;
    } catch {
      // Fallback
    }
  }

  // Fallback to localStorage if small or IDB fails
  try {
    localStorage.setItem(key, dataUrl);
  } catch {
    // Storage quota reached, gracefully ignore
  }
}

/**
 * Load large canvas drawing data URL from IndexedDB with localStorage fallback
 */
export async function loadDrawingBitmap(key: string): Promise<string | null> {
  const db = await openDB();
  if (db) {
    try {
      return await new Promise((resolve) => {
        const tx = db.transaction(DRAWINGS_STORE, 'readonly');
        const store = tx.objectStore(DRAWINGS_STORE);
        const req = store.get(key);
        req.onsuccess = () => resolve((req.result as string) || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      // Fallback
    }
  }

  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Remove drawing bitmap
 */
export async function removeDrawingBitmap(key: string): Promise<void> {
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(DRAWINGS_STORE, 'readwrite');
      tx.objectStore(DRAWINGS_STORE).delete(key);
    } catch {
      // Ignore
    }
  }
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// Synchronous metadata & region fills management
export function saveColoringFills(pictureId: string, regionFills: Record<string, string>): void {
  try {
    const meta = {
      pictureId,
      regionFills,
      updatedAt: Date.now(),
    };
    localStorage.setItem(COLORING_STORAGE_PREFIX + pictureId, JSON.stringify(meta));
  } catch {
    // Ignore
  }
}

export function loadColoringFills(pictureId: string): Record<string, string> | null {
  try {
    const raw = localStorage.getItem(COLORING_STORAGE_PREFIX + pictureId);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.regionFills || null;
  } catch {
    return null;
  }
}

export function clearColoringState(pictureId: string): void {
  try {
    localStorage.removeItem(COLORING_STORAGE_PREFIX + pictureId);
    removeDrawingBitmap(`pic_drawing_${pictureId}`);
  } catch {
    // Ignore
  }
}

export function clearFreeDrawState(): void {
  try {
    localStorage.removeItem(FREEDRAW_STORAGE_KEY);
    removeDrawingBitmap('freedraw_canvas');
  } catch {
    // Ignore
  }
}

const CUSTOM_PICTURES_STORAGE_KEY = 'toddler_custom_svg_pictures';

/**
 * Save custom user/designer imported pictures
 */
export function saveCustomPictures(pictures: import('../types').ColoringPicture[]): void {
  try {
    localStorage.setItem(CUSTOM_PICTURES_STORAGE_KEY, JSON.stringify(pictures));
  } catch {
    // Ignore
  }
}

/**
 * Load custom user/designer imported pictures
 */
export function loadCustomPictures(): import('../types').ColoringPicture[] {
  try {
    const raw = localStorage.getItem(CUSTOM_PICTURES_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}

/**
 * Add a single imported custom picture
 */
export function addCustomPicture(picture: import('../types').ColoringPicture): void {
  try {
    const existing = loadCustomPictures();
    const updated = [picture, ...existing.filter((p) => p.id !== picture.id)];
    saveCustomPictures(updated);
  } catch {
    // Ignore
  }
}

/**
 * Delete a custom picture
 */
export function deleteCustomPicture(pictureId: string): void {
  try {
    const existing = loadCustomPictures();
    saveCustomPictures(existing.filter((p) => p.id !== pictureId));
    clearColoringState(pictureId);
  } catch {
    // Ignore
  }
}

