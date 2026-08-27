CREATE TYPE "IssueType" AS ENUM ('STORY', 'TASK', 'BUG', 'EPIC');

ALTER TABLE "Project" ADD COLUMN "key" TEXT;
ALTER TABLE "Project" ADD COLUMN "issueCounter" INTEGER NOT NULL DEFAULT 0;

UPDATE "Project" p SET "key" = sub.derived
FROM (
  SELECT id,
         UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
           || CASE WHEN ROW_NUMBER() OVER (
                PARTITION BY "workspaceId",
                UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
                ORDER BY "createdAt") > 1
              THEN ROW_NUMBER() OVER (
                PARTITION BY "workspaceId",
                UPPER(LEFT(REGEXP_REPLACE(name, '[^A-Za-z]', '', 'g'), 3))
                ORDER BY "createdAt")::TEXT
              ELSE '' END AS derived
  FROM "Project"
) sub
WHERE p.id = sub.id;

UPDATE "Project" SET "key" = 'PRJ' WHERE "key" IS NULL OR "key" = '';
ALTER TABLE "Project" ALTER COLUMN "key" SET NOT NULL;

ALTER TABLE "Task" ADD COLUMN "number" INTEGER;
ALTER TABLE "Task" ADD COLUMN "type" "IssueType" NOT NULL DEFAULT 'TASK';
ALTER TABLE "Task" ADD COLUMN "storyPoints" INTEGER;

UPDATE "Task" t SET "number" = sub.seq
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY "projectId" ORDER BY "createdAt") AS seq
  FROM "Task"
) sub
WHERE t.id = sub.id;

ALTER TABLE "Task" ALTER COLUMN "number" SET NOT NULL;

UPDATE "Project" p SET "issueCounter" = COALESCE(
  (SELECT MAX(t."number") FROM "Task" t WHERE t."projectId" = p.id), 0);

CREATE UNIQUE INDEX "Project_workspaceId_key_key" ON "Project"("workspaceId", "key");
CREATE UNIQUE INDEX "Task_projectId_number_key" ON "Task"("projectId", "number");
