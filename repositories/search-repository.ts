import "server-only";

import { db } from "@/lib/db";
import { userSelect } from "@/repositories/workspace-repository";

const LIMIT = 5;

export function searchTasks(workspaceId: string, query: string) {
  return db.task.findMany({
    where: {
      project: { workspaceId },
      title: { contains: query, mode: "insensitive" },
    },
    select: {
      id: true,
      number: true,
      title: true,
      type: true,
      project: {
        select: { key: true, name: true, slug: true, workspace: { select: { slug: true } } },
      },
      column: { select: { name: true, isDone: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: LIMIT,
  });
}

export function searchProjects(workspaceId: string, query: string) {
  return db.project.findMany({
    where: {
      workspaceId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { key: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      name: true,
      key: true,
      slug: true,
      color: true,
      workspace: { select: { slug: true } },
    },
    orderBy: { name: "asc" },
    take: LIMIT,
  });
}

export function searchMembers(workspaceId: string, query: string) {
  return db.workspaceMember.findMany({
    where: {
      workspaceId,
      user: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
    },
    select: { role: true, user: { select: userSelect } },
    orderBy: { user: { name: "asc" } },
    take: LIMIT,
  });
}
