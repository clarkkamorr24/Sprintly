-- Track when a user finished onboarding. NULL means onboarding is incomplete.
ALTER TABLE "User" ADD COLUMN "onboardedAt" TIMESTAMP(3);

-- Everyone who already has an account has effectively completed onboarding;
-- backfill them so the new gate never traps an existing user.
UPDATE "User" SET "onboardedAt" = "createdAt" WHERE "onboardedAt" IS NULL;
