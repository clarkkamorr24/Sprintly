-- Projects gain a URL slug and become uniquely named within their workspace.

-- 1. Resolve existing duplicate names before the constraint can apply. The
--    oldest project keeps its name; later ones get a numeric suffix. Nothing
--    is deleted.
WITH ranked AS (
  SELECT id,
         name,
         row_number() OVER (
           PARTITION BY "workspaceId", lower(name) ORDER BY "createdAt", id
         ) AS position
  FROM "project"
)
UPDATE "project" p
SET name = ranked.name || ' (' || ranked.position || ')'
FROM ranked
WHERE p.id = ranked.id AND ranked.position > 1;

-- 2. Add the slug column, nullable for the backfill.
ALTER TABLE "project" ADD COLUMN "slug" TEXT;

-- 3. Derive a slug from the name: lowercase, non-alphanumerics to hyphens,
--    trimmed. Fall back to the lowercased key when that leaves nothing.
UPDATE "project"
SET "slug" = COALESCE(
  NULLIF(trim(BOTH '-' FROM regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')), ''),
  lower(key)
);

-- 4. Break any slug collisions the derivation created, keeping the oldest.
WITH ranked AS (
  SELECT id,
         slug,
         row_number() OVER (
           PARTITION BY "workspaceId", slug ORDER BY "createdAt", id
         ) AS position
  FROM "project"
)
UPDATE "project" p
SET slug = ranked.slug || '-' || ranked.position
FROM ranked
WHERE p.id = ranked.id AND ranked.position > 1;

ALTER TABLE "project" ALTER COLUMN "slug" SET NOT NULL;

CREATE UNIQUE INDEX "project_workspaceId_slug_key" ON "project" ("workspaceId", "slug");
CREATE UNIQUE INDEX "project_workspaceId_name_key" ON "project" ("workspaceId", "name");
