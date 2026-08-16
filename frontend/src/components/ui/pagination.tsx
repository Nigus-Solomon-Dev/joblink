import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function pageWindow(page: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: (number | "ellipsis")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push("ellipsis");
  for (let index = start; index <= end; index += 1) pages.push(index);
  if (end < totalPages - 1) pages.push("ellipsis");
  pages.push(totalPages);

  return pages;
}

export function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {pageWindow(page, totalPages).map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-1 text-sm text-slate-400">
            &hellip;
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "grid size-8 place-items-center rounded-lg text-sm font-medium transition-colors",
              item === page
                ? "bg-primary-600 text-white"
                : "text-slate-600 hover:bg-surface-muted",
            )}
          >
            {item}
          </button>
        ),
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}