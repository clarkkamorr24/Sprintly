"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EditLockValue {
  readonly activeId: string | null;
  readonly setActiveId: (id: string | null) => void;
}

const EditLockContext = createContext<EditLockValue | null>(null);

export function EditLockProvider({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const value = useMemo(() => ({ activeId, setActiveId }), [activeId]);

  return (
    <EditLockContext.Provider value={value}>
      {children}
    </EditLockContext.Provider>
  );
}

export function useEditLock(id: string) {
  const context = useContext(EditLockContext);

  const activeId = context?.activeId ?? null;
  const setActiveId = context?.setActiveId;

  const open = useCallback(() => setActiveId?.(id), [setActiveId, id]);
  
  const close = useCallback(() => setActiveId?.(null), [setActiveId]);

  return {
    isEditing: activeId === id,
    isLocked: activeId !== null && activeId !== id,
    open,
    close,
  };
}

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
  const fieldId = useId();
  const { isEditing, isLocked, open, close } = useEditLock(fieldId);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const committing = useRef(false);

  const cancel = () => {
    onCancel?.();
    committing.current = false;
    close();
  };

  const commit = async () => {
    if (committing.current) return;
    committing.current = true;

    const ok = await onSave();

    committing.current = false;
    if (ok) close();
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

  if (canEdit && isEditing) {
    return (
      <div
        ref={wrapperRef}
        className="grid grid-cols-[minmax(88px,120px)_1fr] items-start gap-3 py-1"
      >
        <dt className="sp-kicker mt-1.5 text-[10.5px]">{label}</dt>

        <dd className="min-w-0 space-y-2">
          {/* Normalises every editor to the same size the read state uses,
              so switching modes does not visibly resize the text. */}
          <div className="min-w-0 text-[13.5px] [&_button]:w-full [&_button]:text-[13.5px] [&_input]:text-[13.5px] [&_input]:md:text-[13.5px]">
            {editor}
          </div>

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
        </dd>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(88px,120px)_1fr] items-center gap-3 py-1">
      <dt className="sp-kicker text-[10.5px]">{label}</dt>

      <dd className="min-w-0">
        {!canEdit ? (
          <span className="px-1.5 py-1 text-[13.5px]">{children}</span>
        ) : (
          <button
            type="button"
            onClick={open}
            disabled={isLocked}
            aria-label={`Edit ${label.toLowerCase()}`}
            className={cn(
              "flex w-full items-center gap-1.5 px-1.5 py-1 text-left text-[13.5px] outline-none transition-colors",
              "focus-visible:ring-[3px] focus-visible:ring-ring/50",
              isLocked
                ? "cursor-default opacity-45"
                : "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]"
            )}
          >
            {children}
          </button>
        )}
      </dd>
    </div>
  );
}
