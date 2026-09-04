"use client";

import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { cn } from "@/lib/utils";

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      style={
        {
          "--rdp-accent-color": "var(--sp-accent)",
          "--rdp-accent-background-color": "var(--sp-accent-100)",
          "--rdp-today-color": "var(--sp-accent)",
          "--rdp-selected-border": "none",  
          "--rdp-day-width": "2.25rem",
          "--rdp-day-height": "2.25rem",
          "--rdp-weekday-padding": "0",
          "--rdp-weekday-opacity": "1",
        } as React.CSSProperties
      }
      className={cn("p-3", className)}
      classNames={{
        root: cn(defaults.root, "w-fit"),
        months: cn(defaults.months, "flex flex-col gap-3"),
        month: cn(
          defaults.month,
          ""
        ),
        button_previous: cn(
          defaults.button_previous,
          "flex size-7 items-center justify-center border border-(--sp-neutral-300) transition-colors hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)] disabled:opacity-40"
        ),
        button_next: cn(
          defaults.button_next,
          "flex size-7 items-center justify-center border border-(--sp-neutral-300) transition-colors hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)] disabled:opacity-40"
        ),
        month_caption: cn(
          defaults.month_caption,
          "flex h-7 flex-1 items-center justify-center"
        ),
        caption_label: cn(
          defaults.caption_label,
          "font-heading text-[13px] font-bold"
        ),
        month_grid: cn(
          defaults.month_grid,
          "w-[15.75rem] table-fixed border-collapse"
        ),
        weekday: cn(
          defaults.weekday,
          "sp-kicker h-9 p-0 text-center align-middle text-[10px] font-bold"
        ),
        day: cn(defaults.day, "h-9 p-0 text-center align-middle text-[13px]"),
        day_button: cn(
          defaults.day_button,
          "mx-auto flex size-9 items-center justify-center border-0 bg-transparent outline-none transition-colors hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
        ),
        selected: cn(
          defaults.selected,
          "flex bg-(--sp-accent-300) items-center justify-center rounded-full"
        ),
        today: cn(defaults.today, "font-bold text-(--sp-accent)"),
        outside: cn(defaults.outside, "text-(--sp-neutral-500)"),
        disabled: cn(defaults.disabled, "opacity-40"),
        ...classNames,
      }}
      components={{
        
        Chevron: ({ orientation, ...chevronProps }) => (
          <HugeiconsIcon
            {...chevronProps}
            icon={
              orientation === "left" ? ArrowLeft01Icon : ArrowRight01Icon
            }
            strokeWidth={2}
            className="size-4"
          />
        ),
      }}
      {...props}
    />
  );
}
