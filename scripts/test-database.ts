export function requireTestDatabase() {
  const database = new URL(process.env.DATABASE_URL ?? "").pathname;
  if (!/(?:^|[_-])(test|review)(?:[_-]|$)/i.test(database)) {
    throw new Error("Verification writes audit records. Use a dedicated database named with _test_ or _review_; never a production database.");
  }
}
