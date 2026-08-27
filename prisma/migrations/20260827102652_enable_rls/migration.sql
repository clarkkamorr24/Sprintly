CREATE OR REPLACE FUNCTION public.is_workspace_member(ws_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "WorkspaceMember" m
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
    SELECT 1 FROM "WorkspaceMember" m
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
  SELECT "workspaceId" FROM "Project" WHERE id = p_id;
$$;

CREATE OR REPLACE FUNCTION public.workspace_of_task(t_id UUID)
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT p."workspaceId" FROM "Task" t
  JOIN "Project" p ON p.id = t."projectId"
  WHERE t.id = t_id;
$$;

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WorkspaceInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProjectMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BoardColumn" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sprint" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Task" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskAssignee" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TaskLabel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subtask" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Comment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Label" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_select" ON "Workspace" FOR SELECT
  USING (public.is_workspace_member(id));
CREATE POLICY "workspace_update" ON "Workspace" FOR UPDATE
  USING (public.has_workspace_role(id, ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]));
CREATE POLICY "workspace_delete" ON "Workspace" FOR DELETE
  USING (public.has_workspace_role(id, ARRAY['OWNER']::"WorkspaceRole"[]));

CREATE POLICY "member_select" ON "WorkspaceMember" FOR SELECT
  USING (public.is_workspace_member("workspaceId"));
CREATE POLICY "member_write" ON "WorkspaceMember" FOR ALL
  USING (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]))
  WITH CHECK (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]));

CREATE POLICY "invitation_select" ON "WorkspaceInvitation" FOR SELECT
  USING (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]));
CREATE POLICY "invitation_write" ON "WorkspaceInvitation" FOR ALL
  USING (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]))
  WITH CHECK (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]));

CREATE POLICY "project_select" ON "Project" FOR SELECT
  USING (public.is_workspace_member("workspaceId"));
CREATE POLICY "project_write" ON "Project" FOR ALL
  USING (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]))
  WITH CHECK (public.has_workspace_role("workspaceId", ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]));

CREATE POLICY "label_access" ON "Label" FOR ALL
  USING (public.is_workspace_member("workspaceId"))
  WITH CHECK (public.is_workspace_member("workspaceId"));

CREATE POLICY "activity_select" ON "ActivityLog" FOR SELECT
  USING (public.is_workspace_member("workspaceId"));

CREATE POLICY "project_member_access" ON "ProjectMember" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_project("projectId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_project("projectId")));

CREATE POLICY "column_access" ON "BoardColumn" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_project("projectId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_project("projectId")));

CREATE POLICY "sprint_access" ON "Sprint" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_project("projectId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_project("projectId")));

CREATE POLICY "task_access" ON "Task" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_project("projectId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_project("projectId")));

CREATE POLICY "task_assignee_access" ON "TaskAssignee" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_task("taskId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_task("taskId")));

CREATE POLICY "task_label_access" ON "TaskLabel" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_task("taskId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_task("taskId")));

CREATE POLICY "subtask_access" ON "Subtask" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_task("taskId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_task("taskId")));

CREATE POLICY "comment_select" ON "Comment" FOR SELECT
  USING (public.is_workspace_member(public.workspace_of_task("taskId")));
CREATE POLICY "comment_insert" ON "Comment" FOR INSERT
  WITH CHECK ("authorId" = auth.uid()
    AND public.is_workspace_member(public.workspace_of_task("taskId")));
CREATE POLICY "comment_modify" ON "Comment" FOR UPDATE
  USING ("authorId" = auth.uid());
CREATE POLICY "comment_delete" ON "Comment" FOR DELETE
  USING ("authorId" = auth.uid()
    OR public.has_workspace_role(public.workspace_of_task("taskId"),
         ARRAY['OWNER','ADMIN']::"WorkspaceRole"[]));

CREATE POLICY "attachment_access" ON "Attachment" FOR ALL
  USING (public.is_workspace_member(public.workspace_of_task("taskId")))
  WITH CHECK (public.is_workspace_member(public.workspace_of_task("taskId")));

CREATE POLICY "notification_own" ON "Notification" FOR ALL
  USING ("recipientId" = auth.uid())
  WITH CHECK ("recipientId" = auth.uid());

CREATE POLICY "user_self" ON "User" FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "WorkspaceMember" me
      JOIN "WorkspaceMember" them ON them."workspaceId" = me."workspaceId"
      WHERE me."userId" = auth.uid() AND them."userId" = "User".id
    )
  );
CREATE POLICY "user_update_self" ON "User" FOR UPDATE
  USING (id = auth.uid());
