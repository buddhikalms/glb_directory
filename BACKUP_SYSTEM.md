# Backup System

This project includes an admin backup system that creates a full backup bundle with:

- MySQL database dump (`database/database.sql`)
- Website snapshot (`site/` with project files, excluding `.git`, `.next`, `node_modules`, and `backups`)
  - includes uploaded files under `site/public/uploads`

## Admin UI

- Open `/admin/backups`
- Click **Run Backup Now**
- Backups are stored in timestamped folders (for example `20260225-173000`)

## API

- `GET /api/admin/backups` -> list backups
- `POST /api/admin/backups` -> create a backup

Admin role is required.

## Environment variables

- `BACKUP_DIR` (optional): backup output directory
  - default: `./backups`
- `BACKUP_RETENTION_COUNT` (optional): how many latest backups to keep
  - default: `7`
- `MYSQLDUMP_PATH` (optional): path to `mysqldump` executable
  - default: `mysqldump`

## Notes

- Database backup uses `mysqldump` and reads connection from `DATABASE_URL`.
- If `mysqldump` is not available in PATH, set `MYSQLDUMP_PATH` to full executable path.
- Restore is manual: import `database.sql`, then restore site files from `site/` as needed.
