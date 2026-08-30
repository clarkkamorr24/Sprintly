-- The previous migration renamed "User" to "users"; the schema now maps it to
-- the singular "user" for consistency with every other table. "user" is a
-- reserved word in Postgres, so it must always be quoted.
ALTER TABLE "users" RENAME TO "user";

-- No RLS helper function references this table, and policies follow the rename
-- automatically, so nothing else needs rebuilding here.
