import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
    max: 1,
  }),
});

const ISSUES = [
  { title: "Implement authentication", type: "STORY", pri: "URGENT", pts: 8, col: "In Progress" },
  { title: "Team invitations by email", type: "STORY", pri: "HIGH", pts: 5, col: "In Progress" },
  { title: "Board drag-and-drop persistence", type: "BUG", pri: "URGENT", pts: 3, col: "Review" },
  { title: "Sprint planning two-pane view", type: "STORY", pri: "HIGH", pts: 8, col: "To Do" },
  { title: "Project permissions matrix", type: "TASK", pri: "MEDIUM", pts: 5, col: "To Do" },
  { title: "Notification badge live updates", type: "TASK", pri: "MEDIUM", pts: 2, col: "Backlog" },
  { title: "Audit keyboard navigation", type: "TASK", pri: "LOW", pts: 3, col: "Backlog" },
  { title: "Set up design tokens", type: "TASK", pri: "MEDIUM", pts: 2, col: "Done" },
  { title: "Workspace switcher", type: "STORY", pri: "LOW", pts: 3, col: "Done" },
] as const;

async function main() {
  const user = await db.user.findFirstOrThrow({ select: { id: true } });
  const project = await db.project.findFirstOrThrow({
    where: { name: "Website Redesign" },
    select: { id: true, workspaceId: true },
  });

  const columns = await db.boardColumn.findMany({
    where: { projectId: project.id },
    select: { id: true, name: true },
  });
  const columnByName = new Map(columns.map((c) => [c.name, c.id]));

  await db.sprint.deleteMany({ where: { projectId: project.id } });
  const start = new Date();
  start.setDate(start.getDate() - 8);
  const end = new Date();
  end.setDate(end.getDate() + 6);

  const sprint = await db.sprint.create({
    data: {
      projectId: project.id,
      number: 12,
      name: "Sprint 12",
      goal: "Complete authentication, team invitations, and project permissions.",
      status: "ACTIVE",
      startDate: start,
      endDate: end,
    },
    select: { id: true },
  });

  for (const name of ["backend", "feature", "design", "a11y"]) {
    await db.label.upsert({
      where: { workspaceId_name: { workspaceId: project.workspaceId, name } },
      update: {},
      create: { workspaceId: project.workspaceId, name },
    });
  }
  const labels = await db.label.findMany({
    where: { workspaceId: project.workspaceId },
    select: { id: true },
  });

  await db.task.deleteMany({
    where: { projectId: project.id, title: { in: ISSUES.map((i) => i.title) } },
  });

  let counter = (
    await db.project.findUniqueOrThrow({
      where: { id: project.id },
      select: { issueCounter: true },
    })
  ).issueCounter;

  for (const [index, issue] of ISSUES.entries()) {
    counter += 1;
    const columnId = columnByName.get(issue.col);
    if (!columnId) continue;

    await db.task.create({
      data: {
        projectId: project.id,
        columnId,
        number: counter,
        title: issue.title,
        type: issue.type,
        priority: issue.pri,
        storyPoints: issue.pts,
        position: (index + 1) * 1000,
        createdById: user.id,
        sprintId: issue.col === "Backlog" ? null : sprint.id,
        assignees: index % 3 === 0 ? { create: { userId: user.id } } : undefined,
        labels:
          index % 2 === 0 && labels[0]
            ? { create: [{ labelId: labels[index % labels.length].id }] }
            : undefined,
      },
    });
  }

  await db.project.update({
    where: { id: project.id },
    data: { issueCounter: counter },
  });

  console.log(`seeded ${ISSUES.length} issues into Sprint 12`);
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect().catch(() => {});
  process.exit(1);
});
