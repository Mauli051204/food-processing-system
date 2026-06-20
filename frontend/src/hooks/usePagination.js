import { useState } from 'react';

export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [pagination, setPagination] = useState(null);

  const reset = () => setPage(1);

  return { page, setPage, pageSize, pagination, setPagination, reset };
}