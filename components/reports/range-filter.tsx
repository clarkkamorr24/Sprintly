"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { REPORT_RANGES } from "@/schemas/report";
import { cn } from "@/lib/utils";

interface RangeFilterProps {
  readonly active: number;
}

export function RangeFilter({ active }: RangeFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const select = (days: number) => {
    const params = new URLSearchParams(searchParams);

    if (days === 30) {
      params.delete("range");
    } else {
      params.set("range", String(days));
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <div
      role="group"
      aria-label="Reporting period"
      className="flex flex-wrap items-center gap-1"
    >
      {REPORT_RANGES.map((days) => (
        <Button
          key={days}
          variant={days === active ? "default" : "outline"}
          size="sm"
          aria-pressed={days === active}
          onClick={() => select(days)}
          className={cn("min-w-[64px] justify-center")}
        >
          {days} days
        </Button>
      ))}
    </div>
  );
}
