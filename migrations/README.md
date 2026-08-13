# Guild persistence migrations

The production adapter uses PostgreSQL through `DATABASE_URL`. Apply the SQL files in filename order with `npm run db:migrate`. Migrations are intentionally append-only and do not reset or delete data. For a development database, create an empty PostgreSQL database, set `DATABASE_URL`, run migrations, then run `npm run db:seed`. Resetting a development database is an explicit operator action outside the application; there is no automatic destructive reset command.
