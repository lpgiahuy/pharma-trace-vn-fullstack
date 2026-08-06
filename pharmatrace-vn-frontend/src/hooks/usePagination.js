import { useState, useCallback } from 'react'

export const usePagination = (initialPage = 1, initialPageSize = 20) => {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [total, setTotal] = useState(0)
  const reset = useCallback(() => setPage(1), [])
  return { page, setPage, pageSize, setPageSize, total, setTotal, reset, offset: (page - 1) * pageSize, totalPages: Math.ceil(total / pageSize) }
}
