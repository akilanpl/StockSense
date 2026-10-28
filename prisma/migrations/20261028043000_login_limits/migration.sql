CREATE TABLE "login_limits" (
  "key" TEXT PRIMARY KEY,
  "attempts" INTEGER NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "login_limits_expires_at_idx" ON "login_limits"("expires_at");
