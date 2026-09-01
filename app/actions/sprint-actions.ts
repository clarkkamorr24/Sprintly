"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { handleAction } from "@/lib/api-response";
import { requireUser } from "@/lib/auth/session";
import { broadcastBoardChanged } from "@/lib/realtime/server";
import { parseInput } from "@/lib/validation";
import * as sprintService from "@/services/sprint-service";
import * as taskService from "@/services/task-service";
import {
  assignTaskToSprintSchema,
  changeSprintStatusSchema,
  createSprintSchema,
  deleteSprintSchema,
  updateSprintSchema,
} from "@/schemas/sprint";
import type { ApiResponse } from "@/types/api";
import type { SprintDTO } from "@/types/dto";

export async function createSprintAction(
  input: unknown
): Promise<ApiResponse<SprintDTO>> {
  return handleAction("createSprintAction", async () => {
    const data = parseInput(createSprintSchema, input);
    const sprint = await sprintService.createSprint(data);

    revalidatePath("/[workspaceSlug]", "layout");
    return sprint;
  });
}

export async function updateSprintAction(
  input: unknown
): Promise<ApiResponse<SprintDTO>> {
  return handleAction("updateSprintAction", async () => {
    const data = parseInput(updateSprintSchema, input);
    const sprint = await sprintService.updateSprint(data);

    revalidatePath("/[workspaceSlug]", "layout");
    return sprint;
  });
}

export async function changeSprintStatusAction(
  input: unknown
): Promise<ApiResponse<SprintDTO>> {
  return handleAction("changeSprintStatusAction", async () => {
    const data = parseInput(changeSprintStatusSchema, input);
    const actor = await requireUser();
    const sprint = await sprintService.changeSprintStatus(data);

    revalidatePath("/[workspaceSlug]", "layout");
    after(() =>
      broadcastBoardChanged({ projectId: sprint.projectId, actorId: actor.id })
    );
    return sprint;
  });
}

export async function deleteSprintAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteSprintAction", async () => {
    const data = parseInput(deleteSprintSchema, input);
    await sprintService.deleteSprint(data);

    revalidatePath("/[workspaceSlug]", "layout");
    return null;
  });
}

export async function assignTaskToSprintAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("assignTaskToSprintAction", async () => {
    const data = parseInput(assignTaskToSprintSchema, input);
    const actor = await requireUser();
    const task = await taskService.getTask(data.taskId);

    await sprintService.assignTaskToSprint(data);

    revalidatePath("/[workspaceSlug]", "layout");
    after(() =>
      broadcastBoardChanged({ projectId: task.projectId, actorId: actor.id })
    );
    return null;
  });
}
