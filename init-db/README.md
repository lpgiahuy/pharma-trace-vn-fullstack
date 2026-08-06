# Database Initialization for PostgreSQL (init-db)

Any SQL files (`.sql`) or compressed SQL files (`.sql.gz`) placed in this directory will be automatically executed in alphabetical order when the PostgreSQL container is initialized for the first time.

## Usage:
1. Place your SQL database dump or schema definition files here (e.g., `schema.sql` or `backup.sql`).
2. When launching the system via Docker Compose:
   ```bash
   docker compose up --build
   ```
   PostgreSQL will automatically create the database and run these SQL files.

*Note: If the PostgreSQL container has already been initialized in the past and you want to re-run scripts from this folder, you must clear the existing volume using:*
```bash
docker compose down -v
```
*and then start it again.*
