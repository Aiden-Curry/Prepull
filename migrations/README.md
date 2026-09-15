# Guild persistence migrations

The production adapter uses PostgreSQL through `DATABASE_URL`. Apply the SQL files in filename order with `npm run db:migrate`. Migrations are intentionally append-only and do not reset or delete data. For local development, run `npm run db:dev:up`, set `GUILD_REPOSITORY_DRIVER=postgres` and `DATABASE_URL`, then run migrations and `npm run db:seed`. Integration tests use `TEST_DATABASE_URL` only. Resetting a development database is an explicit operator action outside the application; there is no automatic destructive reset command.

Migration 016 adds raid-linked Guild Prep Runs and member-based voluntary signups. It keeps activity identity immutable, allows at most one open run per guild/raid/activity, and retains completed or cancelled history.

Migration 017 adds expendable shared infrastructure for public character lookup caching and fixed-window abuse protection. Neither table references player, guild, or sync records; expiry and cleanup cannot alter trusted product state.
