-- Tasks assigned to a sprint must not sit in the Backlog column: the board
-- hides that column, so those tasks were invisible on the board while still
-- counting towards the sprint. Move each one to its project's first non-done,
-- non-backlog column (normally "To Do"), leaving position and everything else
-- untouched. Tasks with no sprint are not affected.
UPDATE "task" AS t
SET "columnId" = (
  SELECT c.id
  FROM "board_column" AS c
  WHERE c."projectId" = t."projectId"
    AND c."isDone" = false
    AND lower(c.name) <> 'backlog'
  ORDER BY c.position ASC
  LIMIT 1
)
WHERE t."sprintId" IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM "board_column" AS backlog
    WHERE backlog.id = t."columnId"
      AND lower(backlog.name) = 'backlog'
  )
  AND EXISTS (
    SELECT 1
    FROM "board_column" AS c
    WHERE c."projectId" = t."projectId"
      AND c."isDone" = false
      AND lower(c.name) <> 'backlog'
  );
