/**
 * Haptic feedback utility for Map & Mingle
 * Uses Web Vibration API with graceful fallback
 * All haptics are LOW INTENSITY (never > 30ms)
 */

// Debounce tracking to prevent stacked vibrations
let lastHapticTime = 0;
const HAPTIC_DEBOUNCE = 150; // ms

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

function vibrate(duration: number): void {
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_DEBOUNCE) return;
  
  lastHapticTime = now;
  
  if (canVibrate()) {
    try {
      navigator.vibrate(duration);
    } catch {
      // Silently ignore - no haptic support
    }
  }
}

export const haptic = {
  /**
   * Light tap for primary actions (Where I'm At, Where I'll Be)
   * Duration: 10-20ms
   */
  lightTap: () => vibrate(15),

  /**
   * Confirmation tick for successful actions (pin drop, map tap)
   * Duration: 15-25ms
   */
  confirm: () => vibrate(20),

  /**
   * Soft tick for state changes (cancel, visibility toggle)
   * Duration: 10-15ms
   */
  softTick: () => vibrate(12),

  /**
   * Very light tap for navigation (bottom nav, minor UI)
   * Duration: 8-12ms
   */
  navTap: () => vibrate(10),

  /**
   * Micro pulse for toasts and notifications
   * Duration: 8-12ms
   */
  microPulse: () => vibrate(10),
};

export default haptic;
