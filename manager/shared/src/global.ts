/* istanbul ignore next */
function globalSelf() {
  try {
    if (typeof self !== 'undefined') {
      return self
    }
  } catch {}
  try {
    if (typeof window !== 'undefined') {
      return window
    }
  } catch {}
  return globalThis as typeof globalThis & Window
}
export const globalThisPolyfill: Window = globalSelf()
