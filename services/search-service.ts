import "server-only";

import { requireWorkspaceAccess } from "@/lib/auth/guards";
import { projectPath } from "@/lib/routes";
import * as repo from "@/repositories/search-repository";
import type { SearchWorkspaceInput } from "@/schemas/search";
import type { SearchResultsDTO } from "@/types/dto";

export async function searchWorkspace(
  input: SearchWorkspaceInput
): Promise<SearchResultsDTO> {
  await requireWorkspaceAccess(input.workspaceId);

  const [tasks, projects, members] = await Promise.all([
    repo.searchTasks(input.workspaceId, input.query),
    repo.searchProjects(input.workspaceId, input.query),
    repo.searchMembers(input.workspaceId, input.query),
  ]);

  return {
    issues: tasks.map((task) => ({
      id: task.id,
      key: `${task.project.key}-${task.number}`,
      title: task.title,
      projectName: task.project.name,
      columnName: task.column.name,
      isDone: task.column.isDone,
      href: `${projectPath(
        task.project.workspace.slug,
        task.project.slug,
        "board"
      )}?task=${task.id}`,
    })),
    projects: projects.map((project) => ({
      id: project.id,
      name: project.name,
      key: project.key,
      color: project.color,
      href: projectPath(project.workspace.slug, project.slug, "board"),
    })),
    members: members.map((member) => ({
      user: member.user,
      role: member.role,
    })),
  };
}
