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

const UNASSIGNED = "unassigned";

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

  const items = [
    { value: UNASSIGNED, label: "Unassigned" },
    ...members.map((member) => ({ value: member.id, label: member.name })),
  ];

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
    <Select
      items={items}
      value={current}
      onValueChange={(value) => reassign(String(value))}
      disabled={isPending}
    >
      <SelectTrigger size="sm" aria-label="Assignee" className="min-w-[150px]">
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
