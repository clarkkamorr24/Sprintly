"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as taskService from "@/services/task-service";
import {
  createTaskSchema,
  deleteTaskSchema,
  updateTaskSchema,
} from "@/schemas/task";
import type { ApiResponse } from "@/types/api";
import type { TaskDetailDTO } from "@/types/dto";

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
