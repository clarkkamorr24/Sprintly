"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateTaskAction } from "@/app/actions/task-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TaskDetailDTO, UserDTO } from "@/types/dto";

export const UNASSIGNED = "unassigned";

interface AssigneeSelectProps {
  readonly members: readonly UserDTO[];
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly id?: string;
  readonly size?: "sm";
  readonly className?: string;
}

/**
 * The assignee dropdown itself, shared by the task detail picker and the create
 * form. Members come from the caller so the list always reflects the workspace
 * the task belongs to.
 */
export function AssigneeSelect({
  members,
  value,
  onValueChange,
  disabled,
  id,
  size,
  className,
}: AssigneeSelectProps) {
  const items = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ];

  return (
    <Select
      items={items}
      value={value}
      onValueChange={(next) => onValueChange(String(next))}
      disabled={disabled}
    >
      <SelectTrigger id={id} size={size} aria-label="Assignee" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface AssigneePickerProps {
  readonly task: TaskDetailDTO;
  readonly members: readonly UserDTO[];
  readonly canEdit: boolean;
  readonly onChange: () => void;
}

export function AssigneePicker({
  task,
  members,
  canEdit,
  onChange,
}: AssigneePickerProps) {
  const [isPending, startTransition] = useTransition();

  if (!canEdit) {
    return task.assignees.length === 0 ? (
      <span className="text-muted-foreground">Unassigned</span>
    ) : (
      <ul className="flex -space-x-1.5">
        {task.assignees.map((user) => (
          <li key={user.id} title={user.name}>
            <UserAvatar user={user} size="sm" />
          </li>
        ))}
      </ul>
    );
  }

  const current = task.assignees[0]?.id ?? UNASSIGNED;

  const reassign = (value: string) => {
    if (value === current) return;

    startTransition(async () => {
      const result = await updateTaskAction({
        taskId: task.id,
        title: task.title,
        description: task.description ?? "",
        type: task.type,
        priority: task.priority,
        storyPoints: task.storyPoints,
        assigneeIds: value === UNASSIGNED ? [] : [value],
        labelIds: task.labels.map((label) => label.id),
        dueDate: task.dueDate,
      });

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(
        value === UNASSIGNED
          ? "Issue unassigned."
          : `Assigned to ${members.find((m) => m.id === value)?.name ?? "member"}.`
      );
      onChange();
    });
  };

  return (
    <AssigneeSelect
      members={members}
      value={current}
      onValueChange={reassign}
      disabled={isPending}
      size="sm"
      className="min-w-[150px]"
    />
  );
}
