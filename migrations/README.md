# Guild persistence migrations

The production adapter uses PostgreSQL through `DATABASE_URL`. Apply the SQL files in filename order with `npm run db:migrate`. Migrations are intentionally append-only and do not reset or delete data. For local development, run `npm run db:dev:up`, set `GUILD_REPOSITORY_DRIVER=postgres` and `DATABASE_URL`, then run migrations and `npm run db:seed`. Integration tests use `TEST_DATABASE_URL` only. Resetting a development database is an explicit operator action outside the application; there is no automatic destructive reset command.
