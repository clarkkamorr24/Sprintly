"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as projectService from "@/services/project-service";
import { projectCookieName } from "@/lib/auth/active-project";
import { requireProjectAccess } from "@/lib/auth/guards";
import {
  createProjectSchema,
  deleteProjectSchema,
  selectProjectSchema,
  updateProjectSchema,
} from "@/schemas/project";
import type { ApiResponse } from "@/types/api";
import type { ProjectDTO } from "@/types/dto";

export async function createProjectAction(
  input: unknown
): Promise<ApiResponse<ProjectDTO>> {
  return handleAction("createProjectAction", async () => {
    const data = parseInput(createProjectSchema, input);
    const project = await projectService.createProject(data);

    revalidatePath("/workspaces/[workspaceSlug]", "page");
    return project;
  });
}

export async function updateProjectAction(
  input: unknown
): Promise<ApiResponse<ProjectDTO>> {
  return handleAction("updateProjectAction", async () => {
    const data = parseInput(updateProjectSchema, input);
    const project = await projectService.updateProject(data);

    revalidatePath("/workspaces/[workspaceSlug]", "page");
    revalidatePath("/workspaces/[workspaceSlug]", "layout");
    return project;
  });
}

export async function deleteProjectAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteProjectAction", async () => {
    const data = parseInput(deleteProjectSchema, input);

    await projectService.deleteProject(data);

    revalidatePath("/workspaces/[workspaceSlug]", "page");
    return null;
  });
}

export async function selectProjectAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("selectProjectAction", async () => {
    const data = parseInput(selectProjectSchema, input);
    const context = await requireProjectAccess(data.projectId);

    const cookieStore = await cookies();
    cookieStore.set(projectCookieName(context.workspaceId), data.projectId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return null;
  });
}
