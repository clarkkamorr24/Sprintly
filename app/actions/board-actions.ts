"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";

import { handleAction } from "@/lib/api-response";
import { broadcastBoardChanged } from "@/lib/realtime/server";
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

    revalidatePath("/workspaces/[workspaceSlug]", "layout");
    return { id: column.id, name: column.name };
  });
}

export async function renameColumnAction(
  input: unknown
): Promise<ApiResponse<{ id: string; name: string }>> {
  return handleAction("renameColumnAction", async () => {
    const data = parseInput(renameColumnSchema, input);
    const column = await boardService.renameColumn(data);

    revalidatePath("/workspaces/[workspaceSlug]", "layout");
    return { id: column.id, name: column.name };
  });
}

export async function deleteColumnAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteColumnAction", async () => {
    const data = parseInput(deleteColumnSchema, input);
    await boardService.deleteColumn(data);

    revalidatePath("/workspaces/[workspaceSlug]", "layout");
    return null;
  });
}

export async function reorderColumnsAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("reorderColumnsAction", async () => {
    const data = parseInput(reorderColumnsSchema, input);
    await boardService.reorderColumns(data);

    revalidatePath("/workspaces/[workspaceSlug]", "layout");
    return null;
  });
}

export async function moveTaskAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("moveTaskAction", async () => {
    const data = parseInput(moveTaskSchema, input);
    const { projectId, actorId } = await boardService.moveTask(data);

    after(() => broadcastBoardChanged({ projectId, actorId }));

    return null;
  });
}
