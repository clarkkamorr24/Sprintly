-- Sprints are addressed by a per-project number in the URL (?sprint=1) so the
-- UUID is never exposed. Backfill existing rows in creation order per project.
ALTER TABLE "sprint" ADD COLUMN "number" INTEGER;

UPDATE "sprint" AS s
SET "number" = ranked.rn
FROM (
  SELECT id,
         row_number() OVER (
           PARTITION BY "projectId"
           ORDER BY "startDate" ASC, "createdAt" ASC, id ASC
         ) AS rn
  FROM "sprint"
) AS ranked
WHERE ranked.id = s.id;

ALTER TABLE "sprint" ALTER COLUMN "number" SET NOT NULL;

CREATE UNIQUE INDEX "sprint_projectId_number_key"
  ON "sprint" ("projectId", "number");
