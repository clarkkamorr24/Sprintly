"use client";

import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

interface AccordionSectionProps {
  readonly title: string;
  readonly defaultOpen?: boolean;
  readonly summary?: React.ReactNode;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function AccordionSection({
  title,
  defaultOpen = true,
  summary,
  children,
  className,
}: AccordionSectionProps) {
  const [isOpen, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <section
      className={cn("border border-(--sp-neutral-300)", className)}
    >
      <h3>
        <button
          type="button"
          onClick={() => setOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2.5 text-left outline-none transition-colors",
            "hover:bg-[color-mix(in_srgb,var(--sp-text)_5%,transparent)]",
            "focus-visible:ring-[3px] focus-visible:ring-ring/50"
          )}
        >
          <HugeiconsIcon
            icon={isOpen ? ArrowDown01Icon : ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 shrink-0 opacity-60"
          />
          <span className="text-sm font-semibold">{title}</span>

          {!isOpen && summary ? (
            <span className="min-w-0 flex-1 truncate text-[12px] text-muted-foreground">
              {summary}
            </span>
          ) : null}
        </button>
      </h3>

      <div id={panelId} hidden={!isOpen}>
        <div className="border-t border-(--sp-neutral-300) px-3 py-3">
          {children}
        </div>
      </div>
    </section>
  );
}
