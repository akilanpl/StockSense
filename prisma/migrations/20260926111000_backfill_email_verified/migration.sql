-- Accounts created before email verification existed are already trusted.
UPDATE "users"
SET "email_verified_at" = "created_at"
WHERE "email_verified_at" IS NULL;
