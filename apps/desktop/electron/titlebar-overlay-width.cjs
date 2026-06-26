// titlebar-overlay-width.cjs
//
// Fallback right-edge reservation for the native window controls (min/max/close)
// when the renderer can't measure the real Window Controls Overlay geometry yet
// (the brief window before first layout). Once laid out, the renderer reads the
// exact width from navigator.windowControlsOverlay — see
// use-window-controls-overlay-width.ts — so this is only a sensible default, not
// the source of truth. Consumed as --titlebar-tools-right.
//
// Pure + param-injected so it's unit-testable without spinning up Electron.

// Approx footprint of the 3-button WCO cluster; both native Windows and WSLg
// paint it, so both reserve this until the live measurement takes over.
const OVERLAY_FALLBACK_WIDTH = 144

/**
 * @param {object} opts
 * @param {boolean} opts.isWindows - process.platform === 'win32'
 * @param {boolean} opts.isWsl     - running under WSL/WSLg
 * @returns {number} pixels to reserve on the right edge (0 = none)
 */
function nativeOverlayWidth({ isWindows = false, isWsl = false } = {}) {
  // Windows + WSLg paint the WCO on the right; macOS (left traffic lights) and
  // plain Linux (no overlay) need no reservation.
  return isWindows || isWsl ? OVERLAY_FALLBACK_WIDTH : 0
}

module.exports = { OVERLAY_FALLBACK_WIDTH, nativeOverlayWidth }
