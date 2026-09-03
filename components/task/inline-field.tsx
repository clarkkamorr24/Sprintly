"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface InlineFieldProps {
  readonly label: string;
  readonly canEdit: boolean;
  readonly isPending?: boolean;
  readonly children: React.ReactNode;
  readonly editor: React.ReactNode;
  readonly onSave: () => Promise<boolean> | boolean;
  readonly onCancel?: () => void;
}

export function InlineField({
  label,
  canEdit,
  isPending = false,
  children,
  editor,
  onSave,
  onCancel,
}: InlineFieldProps) {
  const [isEditing, setEditing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const committing = useRef(false);

  const cancel = () => {
    onCancel?.();
    committing.current = false;
    setEditing(false);
  };

  const commit = async () => {
    if (committing.current) return;
    committing.current = true;

    const ok = await onSave();

    committing.current = false;
    if (ok) setEditing(false);
  };

  const cancelRef = useRef(cancel);

  useEffect(() => {
    cancelRef.current = cancel;
  });

  useEffect(() => {
    if (!isEditing) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.stopPropagation();
      cancelRef.current();
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isEditing]);

  return (
    <div className="grid grid-cols-[minmax(88px,120px)_1fr] items-center gap-3 py-1">
      <dt className="text-[13px] text-muted-foreground">{label}</dt>

      <dd className="min-w-0">
        {!canEdit ? (
          <span className="text-[13px]">{children}</span>
        ) : isEditing ? (
          <div ref={wrapperRef} className="flex flex-wrap items-center gap-2">
            {editor}

            <div className="flex items-center gap-1.5">
              <Button size="xs" onClick={() => void commit()} disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
              <Button
                size="xs"
                variant="ghost"
                onClick={cancel}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit ${label.toLowerCase()}`}
            className={cn(
              "flex w-full items-center gap-1.5 px-1.5 py-1 text-left text-[13px] outline-none transition-colors",
              "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
          >
            {children}
          </button>
        )}
      </dd>
    </div>
  );
}
