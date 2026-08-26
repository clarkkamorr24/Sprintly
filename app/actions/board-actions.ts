"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as boardService from "@/services/board-service";
import {
  createColumnSchema,
  deleteColumnSchema,
  moveTaskSchema,
  renameColumnSchema,
  reorderColumnsSchema,
} from "@/schemas/board";
import type { ApiResponse } from "@/types/api";

export async function createColumnAction(
  input: unknown
): Promise<ApiResponse<{ id: string; name: string }>> {
  return handleAction("createColumnAction", async () => {
    const data = parseInput(createColumnSchema, input);
    const column = await boardService.createColumn(data);

    revalidatePath(`/projects/${data.projectId}`);
    return { id: column.id, name: column.name };
  });
}

export async function renameColumnAction(
  input: unknown
): Promise<ApiResponse<{ id: string; name: string }>> {
  return handleAction("renameColumnAction", async () => {
    const data = parseInput(renameColumnSchema, input);
    const column = await boardService.renameColumn(data);

    revalidatePath("/projects", "layout");
    return { id: column.id, name: column.name };
  });
}

export async function deleteColumnAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteColumnAction", async () => {
    const data = parseInput(deleteColumnSchema, input);
    await boardService.deleteColumn(data);

    revalidatePath("/projects", "layout");
    return null;
  });
}

export async function reorderColumnsAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("reorderColumnsAction", async () => {
    const data = parseInput(reorderColumnsSchema, input);
    await boardService.reorderColumns(data);

    revalidatePath(`/projects/${data.projectId}`);
    return null;
  });
}

export async function moveTaskAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("moveTaskAction", async () => {
    const data = parseInput(moveTaskSchema, input);
    await boardService.moveTask(data);

    return null;
  });
}
