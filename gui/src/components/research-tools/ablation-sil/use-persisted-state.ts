import { useState, useEffect, useCallback } from 'react'

/**
 * useState backed by localStorage. Serializes/deserializes JSON automatically.
 * Falls back to `initialValue` when localStorage is empty or corrupt.
 */
export function usePersistedState<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        return JSON.parse(stored) as T
      }
    } catch {
      // Corrupt data — fall through to initial
    }
    return initialValue
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [key, state])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value)
    },
    [],
  )

  return [state, setValue]
}
