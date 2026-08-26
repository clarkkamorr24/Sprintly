"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import { PAGE_SIZE } from "@/lib/constants";
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
    const task = await taskService.createTask(data);

    revalidatePath(`/projects/${data.projectId}`);
    return task;
  });
}

export async function updateTaskAction(
  input: unknown
): Promise<ApiResponse<TaskDetailDTO>> {
  return handleAction("updateTaskAction", async () => {
    const data = parseInput(updateTaskSchema, input);
    const task = await taskService.updateTask(data);

    revalidatePath(`/projects/${task.projectId}`);
    return task;
  });
}

export async function deleteTaskAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteTaskAction", async () => {
    const data = parseInput(deleteTaskSchema, input);
    await taskService.deleteTask(data);

    revalidatePath("/projects", "layout");
    return null;
  });
}

export async function getTaskDetailAction(
  taskId: unknown
): Promise<ApiResponse<TaskDetailBundle>> {
  return handleAction("getTaskDetailAction", async () => {
    const id = parseInput(uuidSchema, taskId);

    const [task, canEdit, subtasks, comments, activity] = await Promise.all([
      taskService.getTask(id),
      taskService.canViewerEditTask(id),
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

    return { task, canEdit, subtasks, comments, activity };
  });
}
