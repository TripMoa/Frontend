interface MatePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MatePagination({
  currentPage,
  totalPages,
  onPageChange,
}: MatePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="mate-pg" aria-label="페이지 이동">
      <button
        type="button"
        className="mate-pg__b"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {Array.from({ length: totalPages }).map((_, index) => {
        const pageNumber = index + 1;
        const isActive = currentPage === pageNumber;

        return (
          <button
            key={pageNumber}
            type="button"
            onClick={() => onPageChange(pageNumber)}
            className={`mate-pg__b ${isActive ? "is-on" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            {pageNumber}
          </button>
        );
      })}

      <button
        type="button"
        className="mate-pg__b"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </nav>
  );
}
