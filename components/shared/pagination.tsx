"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export function Pagination({ page, pageSize, total }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;

  const goTo = (next: number) => {
    const params = new URLSearchParams(searchParams);

    if (next <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(next));
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3"
    >
      <p className="text-[12px] text-[color-mix(in_srgb,var(--sp-text)_60%,transparent)]">
        {first}–{last} of {total}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => goTo(page - 1)}
        >
          Previous
        </Button>
        <span className="text-[12px]">
          Page {page} of {lastPage}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= lastPage}
          onClick={() => goTo(page + 1)}
        >
          Next
        </Button>
      </div>
    </nav>
  );
}
