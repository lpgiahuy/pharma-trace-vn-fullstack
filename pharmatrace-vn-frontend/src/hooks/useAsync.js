import { useState, useCallback, useRef, useEffect } from 'react'

export const useAsync = (asyncFn, immediate = false) => {
  const [state, setState] = useState({ data: null, loading: immediate, error: null })
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = useCallback(async (...args) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const result = await asyncFn(...args)
      if (mountedRef.current) setState({ data: result, loading: false, error: null })
      return result
    } catch (err) {
      if (mountedRef.current) setState(s => ({ ...s, loading: false, error: err }))
      throw err
    }
  }, [asyncFn])

  useEffect(() => { if (immediate) execute() }, [])

  return { ...state, execute, setData: (data) => setState(s => ({ ...s, data })) }
}
