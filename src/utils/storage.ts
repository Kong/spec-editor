/**
 * Safely save a value to localStorage.
 * If saving fails (usually due to size limit),
 * the fallbackValue will be saved instead.
 */
export function saveSpecToLocalStorage(
  key: string,
  value: string,
  onFallback?: (error: unknown) => void,
) {
  try {
    localStorage.setItem(key, value)
  } catch (err) {
    console.error('Failed to save spec to localStorage:', err)
    onFallback?.(err)
  }
}

/**
 * Load a spec safely from localStorage.
 * Returns null if key not found or read fails.
 */
export function loadSpecFromLocalStorage(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (err) {
    console.warn('Failed to load spec from localStorage:', err)
    return null
  }
}

/**
 * Remove an item from localStorage safely.
 */
export function clearLocalStorageKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch (err) {
    console.warn('Failed to clear key from localStorage:', err)
  }
}
