import "server-only";

import { db } from "@/lib/db";
import { ActivityType, WorkspaceRole } from "@/lib/generated/prisma/enums";
import * as userRepo from "@/repositories/user-repository";

const DEFAULT_LABELS = [
  { name: "bug", color: "#ec3013" },
  { name: "feature", color: "#444141" },
  { name: "design", color: "#7d7979" },
] as const;

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace"
  );
}

async function uniqueSlug(base: string): Promise<string> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 7)}`;

    const taken = await db.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!taken) return candidate;
  }

  return `${base}-${Date.now().toString(36)}`;
}

function possessive(name: string): string {
  const first = name.trim().split(/\s+/)[0] || "My";
  return first.endsWith("s") ? `${first}' Workspace` : `${first}'s Workspace`;
}

async function acceptPendingInvitations(
  userId: string,
  email: string
): Promise<number> {
  const pending = await db.workspaceInvitation.findMany({
    where: { email, status: "PENDING", expiresAt: { gt: new Date() } },
    select: { id: true, workspaceId: true, role: true },
  });

  for (const invitation of pending) {
    await db.$transaction([
      db.workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId,
          },
        },
        update: {},
        create: {
          workspaceId: invitation.workspaceId,
          userId,
          role: invitation.role,
        },
        select: { id: true },
      }),
      db.workspaceInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
        select: { id: true },
      }),
      db.activityLog.create({
        data: {
          workspaceId: invitation.workspaceId,
          actorId: userId,
          type: ActivityType.MEMBER_ADDED,
          metadata: { memberEmail: email },
        },
        select: { id: true },
      }),
    ]);
  }

  return pending.length;
}

export async function provisionNewUser(input: {
  userId: string;
  name: string;
  email: string;
}): Promise<void> {
  const accepted = await acceptPendingInvitations(input.userId, input.email);

  const existing = await db.workspaceMember.count({
    where: { userId: input.userId },
  });

  if (existing > 0 || accepted > 0) {
    // Someone who joined through an invitation lands in a workspace that is
    // already set up, and the onboarding flow only makes sense for an owner
    // configuring their own, so skip it for them.
    await userRepo.markOnboarded(input.userId);

    return;
  }

  const name = possessive(input.name);

  await db.workspace.create({
    data: {
      name,
      slug: await uniqueSlug(slugify(name)),
      createdById: input.userId,
      members: {
        create: { userId: input.userId, role: WorkspaceRole.OWNER },
      },
      labels: { create: DEFAULT_LABELS.map((label) => ({ ...label })) },
    },
    select: { id: true },
  });
}

