import { useState, useCallback } from 'react'

export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try { const item = localStorage.getItem(key); return item ? JSON.parse(item) : initialValue } catch { return initialValue }
  })
  const setItem = useCallback((newValue) => {
    try { const val = typeof newValue === 'function' ? newValue(value) : newValue; setValue(val); localStorage.setItem(key, JSON.stringify(val)) } catch {}
  }, [key, value])
  const removeItem = useCallback(() => { localStorage.removeItem(key); setValue(initialValue) }, [key, initialValue])
  return [value, setItem, removeItem]
}
