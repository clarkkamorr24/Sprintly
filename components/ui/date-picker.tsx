"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar03Icon } from "@hugeicons/core-free-icons";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { dateInputValue, formatDueDate } from "@/lib/utils";

interface DatePickerProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly ariaLabel?: string;
  readonly className?: string;
}

export function DatePicker({
  value,
  onValueChange,
  disabled,
  ariaLabel = "Due date",
  className,
}: DatePickerProps) {
  const [isOpen, setOpen] = useState(false);

  const selected = value ? new Date(`${value}T00:00:00`) : undefined;

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            disabled={disabled}
            aria-label={ariaLabel}
            className={cn(
              "flex items-center gap-2 border border-(--sp-neutral-300) bg-(--sp-neutral-100) px-2.5 py-1.5 text-left text-[13px] outline-none transition-colors",
              "hover:bg-[color-mix(in_srgb,var(--sp-text)_5%,transparent)]",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              "disabled:opacity-50",
              className
            )}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              strokeWidth={2}
              className="size-4 shrink-0 opacity-60"
            />
            <span className={cn(!value && "text-muted-foreground")}>
              {value ? formatDueDate(`${value}T00:00:00`) : "No due date"}
            </span>
          </button>
        }
      />

      <PopoverContent
        align="start"
        className="w-auto max-w-[20rem] gap-0 p-0"
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          autoFocus
          onSelect={(date) => {
            onValueChange(date ? dateInputValue(date.toISOString()) : "");
            setOpen(false);
          }}
        />

        {value ? (
          <div className="border-t border-(--sp-neutral-300) p-2">
            <button
              type="button"
              onClick={() => {
                onValueChange("");
                setOpen(false);
              }}
              className="w-full px-2 py-1 text-left text-[13px] outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              Clear due date
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
