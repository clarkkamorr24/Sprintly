"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { updateTaskAction } from "@/app/actions/task-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TaskPriority } from "@/lib/generated/prisma/enums";
import { PRIORITY_LABEL, PRIORITY_ORDER } from "@/lib/task-display";
import type { TaskDetailDTO } from "@/types/dto";

interface TaskFieldsEditorProps {
  readonly task: TaskDetailDTO;
  readonly onDone: () => void;
  readonly onCancel: () => void;
}

function dateInputValue(iso: string | null): string {
  return iso ? new Date(iso).toISOString().slice(0, 10) : "";
}

export function TaskFieldsEditor({
  task,
  onDone,
  onCancel,
}: TaskFieldsEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(dateInputValue(task.dueDate));
  const [error, setError] = useState<string | null>(null);

  const priorityItems = PRIORITY_ORDER.map((value) => ({
    value,
    label: PRIORITY_LABEL[value],
  }));

  const save = () => {
    setError(null);

    startTransition(async () => {
      const result = await updateTaskAction({
        taskId: task.id,
        title: task.title,
        description,
        type: task.type,
        priority,
        storyPoints: task.storyPoints,
        assigneeIds: task.assignees.map((user) => user.id),
        labelIds: task.labels.map((label) => label.id),
        dueDate: dueDate || null,
      });

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      toast.success("Issue updated.");
      onDone();
    });
  };

  return (
    <div className="space-y-4 border border-(--sp-neutral-300) bg-(--sp-neutral-100) p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-priority">Priority</Label>
          <Select
            items={priorityItems}
            value={priority}
            onValueChange={(value) => setPriority(value as TaskPriority)}
          >
            <SelectTrigger id="edit-priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {priorityItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edit-due">Due date</Label>
          <Input
            id="edit-due"
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-description">Description</Label>
        <Textarea
          id="edit-description"
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Add more detail…"
          disabled={isPending}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-(--sp-accent-700)">
          {error}
        </p>
      ) : null}

      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
