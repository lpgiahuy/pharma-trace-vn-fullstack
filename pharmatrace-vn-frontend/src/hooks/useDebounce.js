import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '@/store/authStore'

// useDebounce
export const useDebounce = (value, delay = 300) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

// usePagination
export const usePagination = (initialPage = 1, initialPageSize = 20) => {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(0)

  const reset = useCallback(() => setPage(1), [])

  return {
    page, setPage, pageSize, setPageSize,
    total, setTotal, reset,
    offset: (page - 1) * pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

// useLocalStorage
export const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch { return initialValue }
  })

  const setItem = useCallback((newValue) => {
    try {
      const val = typeof newValue === 'function' ? newValue(value) : newValue
      setValue(val)
      localStorage.setItem(key, JSON.stringify(val))
    } catch {}
  }, [key, value])

  const removeItem = useCallback(() => {
    localStorage.removeItem(key)
    setValue(initialValue)
  }, [key, initialValue])

  return [value, setItem, removeItem]
}

// usePermission
export const usePermission = () => {
  const { user, hasRole } = useAuthStore()
  return {
    can: (roles) => hasRole(roles),
    isAdmin:      hasRole(['admin']),
    isManager:    hasRole(['admin', 'manager']),
    isWarehouse:  hasRole(['admin', 'manager', 'warehouse']),
    isStaff:      hasRole(['admin', 'manager', 'pharmacist', 'staff']),
    isCustomer:   hasRole(['customer']),
    role: user?.role,
  }
}

// useMediaQuery
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}
