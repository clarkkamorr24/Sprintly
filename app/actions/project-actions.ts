"use server";

import { revalidatePath } from "next/cache";

import { handleAction } from "@/lib/api-response";
import { parseInput } from "@/lib/validation";
import * as projectService from "@/services/project-service";
import {
  createProjectSchema,
  deleteProjectSchema,
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

    revalidatePath(`/workspaces/${data.workspaceId}`);
    return project;
  });
}

export async function updateProjectAction(
  input: unknown
): Promise<ApiResponse<ProjectDTO>> {
  return handleAction("updateProjectAction", async () => {
    const data = parseInput(updateProjectSchema, input);
    const project = await projectService.updateProject(data);

    revalidatePath(`/workspaces/${project.workspaceId}`);
    revalidatePath(`/projects/${project.id}`);
    return project;
  });
}

export async function deleteProjectAction(
  input: unknown
): Promise<ApiResponse<null>> {
  return handleAction("deleteProjectAction", async () => {
    const data = parseInput(deleteProjectSchema, input);
    const project = await projectService.getProject(data.projectId);

    await projectService.deleteProject(data);

    revalidatePath(`/workspaces/${project.workspaceId}`);
    return null;
  });
}
