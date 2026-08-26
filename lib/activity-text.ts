import { ActivityType } from "@/lib/generated/prisma/enums";
import type { ActivityEntryDTO } from "@/types/dto";

function text(metadata: Readonly<Record<string, unknown>>, key: string): string {
  const value = metadata[key];
  return typeof value === "string" ? value : "";
}

export function describeActivity(entry: ActivityEntryDTO): string {
  const { metadata } = entry;
  const title = text(metadata, "taskTitle");
  const quoted = title ? `"${title}"` : "this task";

  switch (entry.type) {
    case ActivityType.TASK_CREATED:
      return `created ${quoted}`;
    case ActivityType.TASK_MOVED:
      return `moved ${quoted} from "${text(metadata, "from")}" to "${text(metadata, "to")}"`;
    case ActivityType.TASK_UPDATED:
      return metadata.reordered ? `reordered ${quoted}` : `updated ${quoted}`;
    case ActivityType.TASK_ASSIGNED:
      return `assigned ${quoted} to ${text(metadata, "assigneeName")}`;
    case ActivityType.TASK_UNASSIGNED:
      return `unassigned ${text(metadata, "assigneeName")} from ${quoted}`;
    case ActivityType.TASK_PRIORITY_CHANGED:
      return `changed priority to ${text(metadata, "to")}`;
    case ActivityType.TASK_DUE_DATE_CHANGED:
      return `changed the due date`;
    case ActivityType.TASK_DELETED:
      return `deleted ${quoted}`;
    case ActivityType.SUBTASK_CREATED:
      return `added subtask "${text(metadata, "subtaskTitle")}"`;
    case ActivityType.SUBTASK_COMPLETED:
      return `completed subtask "${text(metadata, "subtaskTitle")}"`;
    case ActivityType.SUBTASK_DELETED:
      return `removed subtask "${text(metadata, "subtaskTitle")}"`;
    case ActivityType.COMMENT_ADDED:
      return `commented`;
    case ActivityType.COMMENT_DELETED:
      return `deleted a comment`;
    case ActivityType.LABEL_ADDED:
      return `added label "${text(metadata, "labelName")}"`;
    case ActivityType.LABEL_REMOVED:
      return `removed label "${text(metadata, "labelName")}"`;
    case ActivityType.COLUMN_CREATED:
      return `created column "${text(metadata, "columnName")}"`;
    case ActivityType.COLUMN_RENAMED:
      return `renamed column "${text(metadata, "from")}" to "${text(metadata, "to")}"`;
    case ActivityType.COLUMN_DELETED:
      return `deleted column "${text(metadata, "columnName")}"`;
    case ActivityType.COLUMN_REORDERED:
      return `reordered the board columns`;
    case ActivityType.PROJECT_CREATED:
      return `created this project`;
    case ActivityType.PROJECT_UPDATED:
      return `updated this project`;
    case ActivityType.MEMBER_ADDED:
      return `added ${text(metadata, "memberName")} to the workspace`;
    case ActivityType.MEMBER_REMOVED:
      return `removed ${text(metadata, "memberName")} from the workspace`;
    case ActivityType.MEMBER_ROLE_CHANGED:
      return `changed ${text(metadata, "memberName")}'s role to ${text(metadata, "to")}`;
    default:
      return "made a change";
  }
}
