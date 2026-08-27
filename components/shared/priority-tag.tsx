import { TaskPriority } from "@/lib/generated/prisma/enums";
import { PRIORITY_LABEL } from "@/lib/task-display";
import { cn } from "@/lib/utils";

const TONE: Readonly<Record<TaskPriority, string>> = {
  [TaskPriority.URGENT]: "bg-(--sp-accent) text-(--sp-bg)",
  [TaskPriority.HIGH]:
    "bg-(--sp-accent-100) text-(--sp-accent-800) border border-(--sp-accent-300)",
  [TaskPriority.MEDIUM]:
    "bg-(--sp-neutral-200) text-(--sp-neutral-800) border border-(--sp-neutral-300)",
  [TaskPriority.LOW]:
    "border border-(--sp-neutral-300) text-(--sp-neutral-700)",
};

interface PriorityTagProps {
  readonly priority: TaskPriority;
  readonly className?: string;
}

export function PriorityTag({ priority, className }: PriorityTagProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center px-2.5 py-[3px] text-[11px] tracking-[0.02em]",
        TONE[priority],
        className
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}
