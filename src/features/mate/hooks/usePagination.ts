// hooks/usePagination.ts
import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], itemsPerPage: number = 5) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  const visiblePosts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [items, currentPage, itemsPerPage]);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    visiblePosts,
  };
}