-- Issues are now only Task or Bug. Postgres cannot drop a value from an enum,
-- so the type is rebuilt and the column migrated across. STORY and EPIC fold
-- into TASK, which is the closest equivalent and the new default.
ALTER TABLE "task" ALTER COLUMN "type" DROP DEFAULT;

CREATE TYPE "IssueType_new" AS ENUM ('TASK', 'BUG');

ALTER TABLE "task"
  ALTER COLUMN "type" TYPE "IssueType_new"
  USING (
    CASE "type"::text
      WHEN 'BUG' THEN 'BUG'
      ELSE 'TASK'
    END
  )::"IssueType_new";

DROP TYPE "IssueType";

ALTER TYPE "IssueType_new" RENAME TO "IssueType";

ALTER TABLE "task" ALTER COLUMN "type" SET DEFAULT 'TASK';
