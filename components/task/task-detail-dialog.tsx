"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { Edit02Icon } from "@hugeicons/core-free-icons";

import {
  getTaskDetailAction,
  updateTaskAction,
} from "@/app/actions/task-actions";
import { ActivityTimeline } from "@/components/task/activity-timeline";
import {
  AssigneeSelect,
  UNASSIGNED,
} from "@/components/task/assignee-picker";
import {
  EditLockProvider,
  InlineField,
  useEditLock,
} from "@/components/task/inline-field";
import { IssueTypeIcon } from "@/components/shared/issue-type-icon";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { CommentList } from "@/components/task/comment-list";
import { SubtaskList } from "@/components/task/subtask-list";
import { AccordionSection } from "@/components/ui/accordion-section";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { IssueType, TaskPriority } from "@/lib/generated/prisma/enums";
import { ISSUE_TYPE_LABEL, ISSUE_TYPE_ORDER } from "@/lib/issue-display";
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  PRIORITY_STYLE,
} from "@/lib/task-display";
import { cn, dateInputValue, formatDueDate, isOverdue } from "@/lib/utils";
import type { TaskDetailBundle } from "@/types/dto";

interface TaskDetailDialogProps {
  readonly taskId: string | null;
  readonly canComment: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onMutated: () => void;
}

export function TaskDetailDialog({
  taskId,
  canComment,
  onOpenChange,
  onMutated,
}: TaskDetailDialogProps) {
  return (
    <Dialog open={taskId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-[min(56rem,92vw)]">
        {taskId ? (
          <EditLockProvider key={taskId}>
            <TaskDetailContent
              taskId={taskId}
              canComment={canComment}
              onMutated={onMutated}
            />
          </EditLockProvider>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

interface TaskDetailContentProps {
  readonly taskId: string;
  readonly canComment: boolean;
  readonly onMutated: () => void;
}

function TaskDetailContent({
  taskId,
  canComment,
  onMutated,
}: TaskDetailContentProps) {
  const [bundle, setBundle] = useState<TaskDetailBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setSaving] = useState(false);
  const titleLock = useEditLock("task-title");
  const descriptionLock = useEditLock("task-description");

  const isEditingTitle = titleLock.isEditing;
  const isEditingDescription = descriptionLock.isEditing;
  const closeTitle = titleLock.close;
  const closeDescription = descriptionLock.close;
  const [, startTransition] = useTransition();

  const [draftType, setDraftType] = useState<IssueType>(IssueType.TASK);
  const [draftPriority, setDraftPriority] = useState<TaskPriority>(
    TaskPriority.MEDIUM
  );
  const [draftDueDate, setDraftDueDate] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftAssignee, setDraftAssignee] = useState<string>(UNASSIGNED);

  const load = useCallback((id: string) => {
    startTransition(async () => {
      const result = await getTaskDetailAction(id);

      if (!result.success) {
        setError(result.error.message);
        return;
      }

      setError(null);
      setBundle(result.data);

      const loaded = result.data.task;
      setDraftType(loaded.type);
      setDraftPriority(loaded.priority);
      setDraftDueDate(dateInputValue(loaded.dueDate));
      setDraftDescription(loaded.description ?? "");
      setDraftTitle(loaded.title);
      setDraftAssignee(loaded.assignees[0]?.id ?? UNASSIGNED);
    });
  }, []);

  useEffect(() => {
    load(taskId);
  }, [taskId, load]);

  useEffect(() => {
    if (!isEditingDescription && !isEditingTitle) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.stopPropagation();

      if (isEditingTitle) {
        setDraftTitle(bundle?.task.title ?? "");
        closeTitle();
      }

      if (isEditingDescription) {
        setDraftDescription(bundle?.task.description ?? "");
        closeDescription();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [
    isEditingDescription,
    isEditingTitle,
    bundle,
    closeTitle,
    closeDescription,
  ]);

  const refresh = () => {
    load(taskId);
    onMutated();
  };

  const task = bundle?.task;

  const typeItems = ISSUE_TYPE_ORDER.map((value) => ({
    value,
    label: ISSUE_TYPE_LABEL[value],
  }));

  const priorityItems = PRIORITY_ORDER.map((value) => ({
    value,
    label: PRIORITY_LABEL[value],
  }));

  const detailsSummary = task
    ? [
        task.assignees[0]?.name ?? "Unassigned",
        PRIORITY_LABEL[task.priority],
        task.dueDate ? formatDueDate(task.dueDate) : "No due date",
      ].join(" · ")
    : "";

  const saveField = async (
    patch: Partial<{
      title: string;
      type: IssueType;
      priority: TaskPriority;
      dueDate: string | null;
      description: string;
      assigneeIds: readonly string[];
    }>
  ): Promise<boolean> => {
    if (!task) return false;

    setSaving(true);

    const result = await updateTaskAction({
      taskId: task.id,
      title: patch.title ?? task.title,
      description: patch.description ?? task.description ?? "",
      type: patch.type ?? task.type,
      priority: patch.priority ?? task.priority,
      storyPoints: task.storyPoints,
      assigneeIds:
        patch.assigneeIds ?? task.assignees.map((user) => user.id),
      labelIds: task.labels.map((label) => label.id),
      dueDate:
        patch.dueDate !== undefined ? patch.dueDate : task.dueDate,
    });

    setSaving(false);

    if (!result.success) {
      toast.error(result.error.message);
      return false;
    }

    toast.success("Issue updated.");
    refresh();
    return true;
  };

  return (
    <>
      {error ? (
        <DialogHeader>
          <DialogTitle>Task unavailable</DialogTitle>
          <DialogDescription>{error}</DialogDescription>
        </DialogHeader>
      ) : !task ? (
        <div className="space-y-4">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <span className="sr-only" role="status">
            Loading task…
          </span>
        </div>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle className="flex gap-2.5 pr-6 text-left text-[1.45rem] leading-[1.15] items-center">
              <span className={cn(isEditingTitle ? "-mt-8" : "mt-0.5 shrink-0")}>
                <IssueTypeIcon type={task.type} size="lg" />
              </span>

              {isEditingTitle ? (
                <span className="min-w-0 flex-1 space-y-2">
                  <Input
                    value={draftTitle}
                    aria-label="Task title"
                    autoFocus
                    disabled={isSaving}
                    className="h-auto rounded-none px-1 py-0.5 font-heading text-[1.45rem] leading-[1.15] tracking-[-0.03em] md:text-[1.45rem]"
                    onChange={(event) => setDraftTitle(event.target.value)}
                  />
                  <span className="flex items-center gap-1.5">
                    <Button
                      size="xs"
                      disabled={isSaving || !draftTitle.trim()}
                      onClick={async () => {
                        const ok = await saveField({ title: draftTitle.trim() });
                        if (ok) titleLock.close();
                      }}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => {
                        setDraftTitle(task.title);
                        titleLock.close();
                      }}
                    >
                      Cancel
                    </Button>
                  </span>
                </span>
              ) : bundle.canEdit ? (
                <button
                  type="button"
                  onClick={titleLock.open}
                  disabled={titleLock.isLocked}
                  aria-label="Edit title"
                  className={cn(
                    "min-w-0 flex-1 px-1 py-0.5 text-left outline-none transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    titleLock.isLocked
                      ? "cursor-default opacity-45"
                      : "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]"
                  )}
                >
                  {task.title}
                </button>
              ) : (
                <span className="min-w-0">{task.title}</span>
              )}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-[13px]">
              <span className="sp-mono-key text-(--sp-accent)">{task.key}</span>
              <span aria-hidden className="text-(--sp-neutral-400)">/</span>
              <span>{task.column.name}</span>
              <span aria-hidden className="text-(--sp-neutral-400)">/</span>
              <span>created by {task.createdBy.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-2 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              <AccordionSection
                title="Description"
                summary={task.description ? "Has content" : "Empty"}
                className="sp-panel-accent"
             >
                {isEditingDescription ? (
                <div className="space-y-2">
                  <Textarea
                    rows={5}
                    value={draftDescription}
                    aria-label="Description"
                    disabled={isSaving}
                    className="px-1 py-0.5 text-sm md:text-sm"
                    onChange={(event) => setDraftDescription(event.target.value)}
                  />
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="xs"
                      disabled={isSaving}
                      onClick={async () => {
                        const ok = await saveField({
                          description: draftDescription,
                        });
                        if (ok) descriptionLock.close();
                      }}
                    >
                      {isSaving ? "Saving…" : "Save"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      disabled={isSaving}
                      onClick={() => {
                        setDraftDescription(task.description ?? "");
                        descriptionLock.close();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : bundle.canEdit ? (
                <button
                  type="button"
                  onClick={descriptionLock.open}
                  disabled={descriptionLock.isLocked}
                  aria-label="Edit description"
                  className={cn(
                    "group flex w-full items-start gap-1.5 px-1 py-0.5 text-left outline-none transition-colors",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    descriptionLock.isLocked
                      ? "cursor-default opacity-45"
                      : "hover:bg-[color-mix(in_srgb,var(--sp-text)_8%,transparent)]"
                  )}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-sm whitespace-pre-wrap text-muted-foreground",
                      !task.description && "italic"
                    )}
                  >
                    {task.description || "Add a description…"}
                  </span>
                  <HugeiconsIcon
                    icon={Edit02Icon}
                    strokeWidth={2}
                    className="mt-0.5 size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-55 group-focus-visible:opacity-55"
                  />
                </button>
              ) : task.description ? (
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {task.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">No description.</p>
              )}
            </AccordionSection>

            <Separator />

            <SubtaskList
              taskId={task.id}
              subtasks={bundle.subtasks}
              canEdit={bundle.canEdit}
              onChange={refresh}
            />

            <Separator />

            <CommentList
              taskId={task.id}
              comments={bundle.comments.items}
              members={bundle.members}
              currentUserId={bundle.currentUserId}
              canComment={canComment}
              onChange={refresh}
            />

            <Separator />

            <ActivityTimeline
              taskId={task.id}
              entries={bundle.activity.items}
              total={bundle.activity.total}
            />
          </div>

          <aside className="min-w-0 space-y-4 lg:border-l lg:border-(--sp-neutral-300) lg:pl-5">
            <AccordionSection
              title="Details"
              summary={detailsSummary}
              className="sp-panel-accent"
            >
              <dl className="text-sm">
                <InlineField
                  label="Type"
                  canEdit={bundle.canEdit}
                  isPending={isSaving}
                  onSave={() => saveField({ type: draftType })}
                  onCancel={() => setDraftType(task.type)}
                  editor={
                    <Select
                      items={typeItems}
                      value={draftType}
                      onValueChange={(value) => setDraftType(value as IssueType)}
                    >
                      <SelectTrigger size="sm" aria-label="Type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {typeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                >
                  <span className="flex items-center gap-1.5">
                    <IssueTypeIcon type={task.type} />
                    {ISSUE_TYPE_LABEL[task.type]}
                  </span>
                </InlineField>

                <InlineField
                  label="Priority"
                  canEdit={bundle.canEdit}
                  isPending={isSaving}
                  onSave={() => saveField({ priority: draftPriority })}
                  onCancel={() => setDraftPriority(task.priority)}
                  editor={
                    <Select
                      items={priorityItems}
                      value={draftPriority}
                      onValueChange={(value) =>
                        setDraftPriority(value as TaskPriority)
                      }
                    >
                      <SelectTrigger size="sm" aria-label="Priority">
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
                  }
                >
                  <Badge variant="outline" className={cn("rounded-full", PRIORITY_STYLE[task.priority])}>
                    {PRIORITY_LABEL[task.priority]}
                  </Badge>
                </InlineField>

                <InlineField
                  label="Due date"
                  canEdit={bundle.canEdit}
                  isPending={isSaving}
                  onSave={() => saveField({ dueDate: draftDueDate || null })}
                  onCancel={() => setDraftDueDate(dateInputValue(task.dueDate))}
                  editor={
                    <DatePicker
                      value={draftDueDate}
                      onValueChange={setDraftDueDate}
                      disabled={isSaving}
                    />
                  }
                >
                  <span
                    className={cn(
                      isOverdue(task.dueDate) && "font-medium text-destructive"
                    )}
                  >
                    {task.dueDate ? formatDueDate(task.dueDate) : "None"}
                  </span>
                </InlineField>

                <InlineField
                  label="Assignee"
                  canEdit={bundle.canEdit}
                  isPending={isSaving}
                  onSave={() =>
                    saveField({
                      assigneeIds:
                        draftAssignee === UNASSIGNED ? [] : [draftAssignee],
                    })
                  }
                  onCancel={() =>
                    setDraftAssignee(task.assignees[0]?.id ?? UNASSIGNED)
                  }
                  editor={
                    <AssigneeSelect
                      members={bundle.members}
                      value={draftAssignee}
                      onValueChange={setDraftAssignee}
                      disabled={isSaving}
                      size="sm"
                    />
                  }
                >
                  {task.assignees[0] ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <UserAvatar user={task.assignees[0]} size="sm" />
                      <span className="truncate">
                        {task.assignees[0].name}
                      </span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </InlineField>

                <div className="grid grid-cols-[minmax(88px,120px)_1fr] items-center gap-3 py-1">
                  <dt className="sp-kicker text-[10.5px]">Status</dt>
                  <dd className="min-w-0 text-[13.5px]">
                    {task.column.name}
                  </dd>
                </div>

                <div className="grid grid-cols-[minmax(88px,120px)_1fr] items-center gap-3 py-1">
                  <dt className="sp-kicker text-[10.5px]">Reporter</dt>
                  <dd className="min-w-0 text-[13.5px]">
                    {task.createdBy.name}
                  </dd>
                </div>
              </dl>
            </AccordionSection>

            {task.labels.length > 0 ? (
              <ul className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <li key={label.id}>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: `${label.color}1a`,
                        color: label.color,
                      }}
                    >
                      {label.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </aside>
          </div>
        </>
      )}
    </>
  );
}
