# Contributing to StockSense

Follow the [local setup in the README](README.md) with a disposable PostgreSQL database for verification. Start from the example environment file and use local credentials. Run Prisma generation after a schema change.

Run `npm run lint` and `npm run typecheck` before submitting a change. For changes to authentication or inventory, run the corresponding `verify:auth` and `verify:inventory` scripts and `npm run verify:integration` against the disposable database. Use the README's local mail fixture for browser workflows.

For changes to stock movement, explain how validation, ledger entries and stock quantities stay consistent across retries and concurrent operations. Include the commands you ran and their outcomes in the pull request.
