"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { handleAction } from "@/lib/api-response";
import { PAGE_SIZE } from "@/lib/constants";
import { requireUser } from "@/lib/auth/session";
import { broadcastBoardChanged } from "@/lib/realtime/server";
import { parseInput } from "@/lib/validation";
import * as activityService from "@/services/activity-service";
import * as commentService from "@/services/comment-service";
import * as subtaskService from "@/services/subtask-service";
import * as taskService from "@/services/task-service";
import { uuidSchema } from "@/schemas/common";
import {
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
} from "@/schemas/task";
import type { ApiResponse } from "@/types/api";
import type { TaskDetailBundle, TaskDetailDTO } from "@/types/dto";

export async function createTaskAction(
  input: unknown
): Promise<ApiResponse<TaskDetailDTO>> {
  return handleAction("createTaskAction", async () => {
    const data = parseInput(createTaskSchema, input);
    const actor = await requireUser();
    const task = await taskService.createTask(data);

    revalidatePath("/[workspaceSlug]", "layout");
    after(() =>
      broadcastBoardChanged({ projectId: data.projectId, actorId: actor.id })
    );
    return task;
  });
}

export async function updateTaskAction(
  input: unknown
): Promise<ApiResponse<TaskDetailDTO>> {
  return handleAction("updateTaskAction", async () => {
    const data = parseInput(updateTaskSchema, input);
    const actor = await requireUser();
    const task = await taskService.updateTask(data);

    revalidatePath("/[workspaceSlug]", "layout");
    after(() =>
      broadcastBoardChanged({ projectId: task.projectId, actorId: actor.id })
    );
    return task;
  });
}

export async function deleteTaskAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteTaskAction", async () => {
    const data = parseInput(deleteTaskSchema, input);
    const actor = await requireUser();
    const task = await taskService.getTask(data.taskId);
    await taskService.deleteTask(data);

    revalidatePath("/[workspaceSlug]", "layout");
    after(() =>
      broadcastBoardChanged({ projectId: task.projectId, actorId: actor.id })
    );
    return null;
  });
}

export async function getTaskDetailAction(
  taskId: unknown
): Promise<ApiResponse<TaskDetailBundle>> {
  return handleAction("getTaskDetailAction", async () => {
    const id = parseInput(uuidSchema, taskId);

    const [task, canEdit, members, subtasks, comments, activity] = await Promise.all([
      taskService.getTask(id),
      taskService.canViewerEditTask(id),
      taskService.listAssignableMembers(id),
      subtaskService.listSubtasks(id),
      commentService.listComments({
        taskId: id,
        page: 1,
        pageSize: PAGE_SIZE.COMMENTS,
      }),
      activityService.listTaskActivity({
        taskId: id,
        page: 1,
        pageSize: PAGE_SIZE.ACTIVITY,
      }),
    ]);

    return {
      task,
      canEdit,
      currentUserId: (await requireUser()).id,
      members,
      subtasks,
      comments,
      activity,
    };
  });
}
