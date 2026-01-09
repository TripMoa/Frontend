import { ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/mate/MatePagination.css";

interface MatePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MatePagination({
  currentPage,
  totalPages,
  onPageChange,
}: MatePaginationProps): JSX.Element | null {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-8">

      {/* PREV */}
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm uppercase tracking-wide transition-all pagination-button ${
          currentPage === 1
            ? "bg-[#eee] text-black/40 cursor-not-allowed pagination-button-disabled"
            : "bg-white text-black hover:bg-black hover:text-white"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        PREV
      </button>

      {/* 페이지 번호 */}
      {Array.from({ length: totalPages }).map((_, index) => {
        const pageNumber = index + 1;
        const isActive = currentPage === pageNumber;

        return (
          <button
            key={pageNumber}
            onClick={() => onPageChange(pageNumber)}
            className={`w-11 h-11 font-bold text-sm font-mono transition-all page-button ${
              isActive
                ? "page-button-active"
                : "bg-white text-black hover:bg-[#eee]"
            }`}
          >
            {pageNumber}
          </button>
        );
      })}

      {/* NEXT */}
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm uppercase tracking-wide transition-all pagination-button ${
          currentPage === totalPages
            ? "bg-[#eee] text-black/40 cursor-not-allowed pagination-button-disabled"
            : "bg-white text-black hover:bg-black hover:text-white"
        }`}
      >
        NEXT
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
