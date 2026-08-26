import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../lib/generated/prisma/client";
import { DEFAULT_BOARD_COLUMNS, POSITION_STEP } from "../lib/constants";

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL!,
    max: 1,
  }),
});

const SEED_USERS = [
  { email: "owner@sprintly.dev", name: "Clark Owner", role: "OWNER" },
  { email: "admin@sprintly.dev", name: "Avery Admin", role: "ADMIN" },
  { email: "member@sprintly.dev", name: "Morgan Member", role: "MEMBER" },
] as const;

const SEED_LABELS = [
  { name: "bug", color: "#ef4444" },
  { name: "feature", color: "#22c55e" },
  { name: "design", color: "#ec4899" },
  { name: "backend", color: "#6366f1" },
] as const;

async function main() {
  const users = [];
  for (const { email, name } of SEED_USERS) {
    users.push(
      await db.user.upsert({
        where: { email },
        update: { name },
        create: { email, name },
        select: { id: true, email: true },
      })
    );
  }

  const [owner, admin, member] = users;

  const workspace = await db.workspace.upsert({
    where: { slug: "acme" },
    update: {},
    create: {
      name: "Acme Inc.",
      slug: "acme",
      description: "Demo workspace seeded for local development.",
      createdById: owner.id,
    },
    select: { id: true },
  });

  for (const [index, user] of users.entries()) {
    await db.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
      },
      update: { role: SEED_USERS[index].role },
      create: {
        workspaceId: workspace.id,
        userId: user.id,
        role: SEED_USERS[index].role,
      },
    });
  }

  for (const label of SEED_LABELS) {
    await db.label.upsert({
      where: { workspaceId_name: { workspaceId: workspace.id, name: label.name } },
      update: { color: label.color },
      create: { ...label, workspaceId: workspace.id },
    });
  }

  const existingProject = await db.project.findFirst({
    where: { workspaceId: workspace.id, name: "Website Redesign" },
    select: { id: true },
  });

  const project =
    existingProject ??
    (await db.project.create({
      data: {
        workspaceId: workspace.id,
        name: "Website Redesign",
        description: "Rebuild the marketing site with the new design system.",
        status: "ACTIVE",
        createdById: owner.id,
        members: {
          create: users.map((user) => ({ userId: user.id })),
        },
        columns: {
          create: DEFAULT_BOARD_COLUMNS.map((column, index) => ({
            name: column.name,
            isDone: column.isDone,
            position: (index + 1) * POSITION_STEP,
          })),
        },
      },
      select: { id: true },
    }));

  const columns = await db.boardColumn.findMany({
    where: { projectId: project.id },
    select: { id: true, name: true },
    orderBy: { position: "asc" },
  });

  const columnByName = new Map(columns.map((c) => [c.name, c.id]));

  const seedTasks = [
    { title: "Set up design tokens", column: "Done", priority: "MEDIUM", assignee: admin.id },
    { title: "Build component library", column: "In Progress", priority: "HIGH", assignee: admin.id },
    { title: "Implement authentication", column: "In Progress", priority: "URGENT", assignee: owner.id },
    { title: "Draft homepage copy", column: "To Do", priority: "LOW", assignee: member.id },
    { title: "Audit accessibility", column: "Review", priority: "HIGH", assignee: member.id },
    { title: "Plan analytics events", column: "Backlog", priority: "LOW", assignee: null },
  ] as const;

  let created = 0;
  for (const [index, task] of seedTasks.entries()) {
    const exists = await db.task.findFirst({
      where: { projectId: project.id, title: task.title },
      select: { id: true },
    });
    if (exists) continue;

    created += 1;
    await db.task.create({
      data: {
        projectId: project.id,
        columnId: columnByName.get(task.column)!,
        title: task.title,
        priority: task.priority,
        position: (index + 1) * POSITION_STEP,
        createdById: owner.id,
        completedAt: task.column === "Done" ? new Date() : null,
        assignees: task.assignee ? { create: { userId: task.assignee } } : undefined,
      },
    });
  }

  console.log(`Seeded workspace "acme" (${created} new tasks).`);
  console.log("Sign in as any of:", SEED_USERS.map((u) => u.email).join(", "));

  await db.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await db.$disconnect();
  process.exit(1);
});
