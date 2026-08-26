"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as workspaceService from "@/services/workspace-service";
import {
  createWorkspaceSchema,
  removeMemberSchema,
  updateMemberRoleSchema,
  updateWorkspaceSchema,
} from "@/schemas/workspace";
import type { ApiResponse } from "@/types/api";
import type { WorkspaceDTO, WorkspaceMemberDTO } from "@/types/dto";

export async function createWorkspaceAction(
  input: unknown
): Promise<ApiResponse<WorkspaceDTO>> {
  return handleAction("createWorkspaceAction", async () => {
    const data = parseInput(createWorkspaceSchema, input);
    const workspace = await workspaceService.createWorkspace(data);

    revalidatePath("/", "layout");
    return workspace;
  });
}

export async function updateWorkspaceAction(
  input: unknown
): Promise<ApiResponse<WorkspaceDTO>> {
  return handleAction("updateWorkspaceAction", async () => {
    const data = parseInput(updateWorkspaceSchema, input);
    const workspace = await workspaceService.updateWorkspace(data);

    revalidatePath("/", "layout");
    return workspace;
  });
}

export async function updateMemberRoleAction(
  input: unknown
): Promise<ApiResponse<WorkspaceMemberDTO>> {
  return handleAction("updateMemberRoleAction", async () => {
    const data = parseInput(updateMemberRoleSchema, input);
    const member = await workspaceService.updateMemberRole(data);

    revalidatePath(`/workspaces/${data.workspaceId}/members`);
    return member;
  });
}

export async function removeMemberAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("removeMemberAction", async () => {
    const data = parseInput(removeMemberSchema, input);
    await workspaceService.removeMember(data);

    revalidatePath(`/workspaces/${data.workspaceId}/members`);
    return null;
  });
}
