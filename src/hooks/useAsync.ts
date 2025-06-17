import { useState, useCallback, useEffect } from 'react'

interface UseAsyncState<T> {
  loading: boolean
  error: Error | null
  data: T | null
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [state, setState] = useState<UseAsyncState<T>>({
    loading: false,
    error: null,
    data: null,
  })

  const execute = useCallback(async () => {
    setState({ loading: true, error: null, data: null })
    
    try {
      const data = await asyncFunction()
      setState({ loading: false, error: null, data })
    } catch (error) {
      setState({ loading: false, error: error as Error, data: null })
    }
  }, [asyncFunction])

  useEffect(() => {
    if (immediate) {
      execute()
    }
  }, [execute, immediate])

  return { ...state, execute }
}