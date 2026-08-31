-- Only one PENDING invitation per (workspace, email) should exist. The previous
-- composite unique on (workspaceId, email, status) also limited the workspace
-- to a single REVOKED and a single ACCEPTED row per address, so revoking a
-- re-issued invitation collided with the earlier revoked one.

DROP INDEX IF EXISTS "WorkspaceInvitation_workspaceId_email_status_key";

-- Keep only the newest row per (workspace, email, status) so the partial index
-- below can be created; historical duplicates carry no information.
DELETE FROM "workspace_invitation" a
USING "workspace_invitation" b
WHERE a."workspaceId" = b."workspaceId"
  AND a."email" = b."email"
  AND a."status" = b."status"
  AND a."status" = 'PENDING'
  AND a."createdAt" < b."createdAt";

CREATE UNIQUE INDEX "workspace_invitation_pending_key"
  ON "workspace_invitation" ("workspaceId", "email")
  WHERE "status" = 'PENDING';

CREATE INDEX IF NOT EXISTS "workspace_invitation_workspaceId_email_status_idx"
  ON "workspace_invitation" ("workspaceId", "email", "status");
