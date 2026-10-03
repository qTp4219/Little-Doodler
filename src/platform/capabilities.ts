/**
 * Platform Capabilities & Hardware Abstraction
 * Designed for web browser and future native Capacitor wrappers.
 */

let wakeLockSentinel: WakeLockSentinel | null = null;
let shouldMaintainWakeLock = false;

// Re-acquire wake lock if tab becomes visible again
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && shouldMaintainWakeLock) {
      requestWakeLock();
    }
  });
}

export async function requestWakeLock(): Promise<boolean> {
  shouldMaintainWakeLock = true;
  if ('wakeLock' in navigator && navigator.wakeLock) {
    try {
      if (wakeLockSentinel && !wakeLockSentinel.released) {
        return true;
      }
      wakeLockSentinel = await navigator.wakeLock.request('screen');
      wakeLockSentinel.addEventListener('release', () => {
        wakeLockSentinel = null;
      });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function releaseWakeLock(): void {
  shouldMaintainWakeLock = false;
  if (wakeLockSentinel) {
    wakeLockSentinel.release().catch(() => {});
    wakeLockSentinel = null;
  }
}

export function triggerHaptic(durationMs = 25): void {
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch {
      // Ignore vibration errors
    }
  }
}

export function isTouchDevice(): boolean {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    window.matchMedia('(pointer: coarse)').matches
  );
}

export async function toggleFullscreen(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        return true;
      }
      return false;
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        return false;
      }
      return false;
    }
  } catch {
    return false;
  }
}

