"use server";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as subtaskService from "@/services/subtask-service";
import {
  createSubtaskSchema,
  deleteSubtaskSchema,
  reorderSubtasksSchema,
  toggleSubtaskSchema,
  updateSubtaskSchema,
} from "@/schemas/subtask";
import type { ApiResponse } from "@/types/api";
import type { SubtaskDTO } from "@/types/dto";

export async function createSubtaskAction(
  input: unknown
): Promise<ApiResponse<SubtaskDTO>> {
  return handleAction("createSubtaskAction", async () => {
    const data = parseInput(createSubtaskSchema, input);
    return subtaskService.createSubtask(data);
  });
}

export async function updateSubtaskAction(
  input: unknown
): Promise<ApiResponse<SubtaskDTO>> {
  return handleAction("updateSubtaskAction", async () => {
    const data = parseInput(updateSubtaskSchema, input);
    return subtaskService.updateSubtask(data);
  });
}

export async function toggleSubtaskAction(
  input: unknown
): Promise<ApiResponse<SubtaskDTO>> {
  return handleAction("toggleSubtaskAction", async () => {
    const data = parseInput(toggleSubtaskSchema, input);
    return subtaskService.toggleSubtask(data);
  });
}

export async function deleteSubtaskAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteSubtaskAction", async () => {
    const data = parseInput(deleteSubtaskSchema, input);
    await subtaskService.deleteSubtask(data);
    return null;
  });
}

export async function reorderSubtasksAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("reorderSubtasksAction", async () => {
    const data = parseInput(reorderSubtasksSchema, input);
    await subtaskService.reorderSubtasks(data);
    return null;
  });
}
