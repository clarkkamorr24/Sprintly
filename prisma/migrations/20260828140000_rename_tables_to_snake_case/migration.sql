-- Rename tables to match the @@map names in the Prisma schema.
-- ALTER TABLE ... RENAME carries indexes, constraints, sequences and RLS
-- policies with the table, so only the SECURITY DEFINER helper functions below
-- need rebuilding: they embed table names in their bodies.

ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Workspace" RENAME TO "workspace";
ALTER TABLE "WorkspaceMember" RENAME TO "workspace_member";
ALTER TABLE "Project" RENAME TO "project";
ALTER TABLE "ProjectMember" RENAME TO "project_member";
ALTER TABLE "BoardColumn" RENAME TO "board_column";
ALTER TABLE "Task" RENAME TO "task";
ALTER TABLE "Sprint" RENAME TO "sprint";
ALTER TABLE "TaskAssignee" RENAME TO "task_assignee";
ALTER TABLE "Subtask" RENAME TO "subtask";
ALTER TABLE "Label" RENAME TO "label";
ALTER TABLE "TaskLabel" RENAME TO "task_label";
ALTER TABLE "Comment" RENAME TO "comment";
ALTER TABLE "Attachment" RENAME TO "attachment";
ALTER TABLE "ActivityLog" RENAME TO "activity_log";
ALTER TABLE "Notification" RENAME TO "notification";
ALTER TABLE "WorkspaceInvitation" RENAME TO "workspace_invitation";

-- Rebuild the RLS helper functions against the new table names.

CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "workspace_member" m
    WHERE m."workspaceId" = ws_id AND m."userId" = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_role(ws_id UUID, roles "WorkspaceRole"[])
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "workspace_member" m
    WHERE m."workspaceId" = ws_id
      AND m."userId" = auth.uid()
      AND m.role = ANY(roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_of_project(p_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT "workspaceId" FROM "project" WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.workspace_of_task(t_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p."workspaceId" FROM "task" t
  JOIN "project" p ON p.id = t."projectId"
  WHERE t.id = t_id;
$$;
