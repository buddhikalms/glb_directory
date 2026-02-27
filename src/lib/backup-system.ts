import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";

export interface BackupItem {
  id: string;
  createdAt: string;
  absolutePath: string;
  sizeBytes: number;
}

export interface RunBackupResult {
  backup: BackupItem;
}

function formatId(date = new Date()) {
  const p = (value: number) => value.toString().padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(
    date.getHours(),
  )}${p(date.getMinutes())}${p(date.getSeconds())}`;
}

function projectRoot() {
  return process.cwd();
}

function backupRoot() {
  return path.resolve(process.env.BACKUP_DIR || path.join(projectRoot(), "backups"));
}

async function ensureDir(dirPath: string) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function runProcess(command: string, args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: "pipe" });
    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(error));
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr || `${command} exited with code ${code}`));
    });
  });
}

async function commandExists(commandPath: string) {
  return fs
    .access(commandPath)
    .then(() => true)
    .catch(() => false);
}

async function canExecuteCommand(command: string) {
  return new Promise<boolean>((resolve) => {
    const child = spawn(command, ["--version"], { stdio: "ignore" });
    child.on("error", () => resolve(false));
    child.on("close", () => resolve(true));
  });
}

async function resolveMysqldumpCommand() {
  const explicit = process.env.MYSQLDUMP_PATH;
  if (explicit && explicit.trim()) {
    const value = explicit.trim();
    if (
      (value.includes("\\") || value.includes("/")) &&
      (await commandExists(value))
    ) {
      return value;
    }
    if (await canExecuteCommand(value)) {
      return value;
    }
    throw new Error(
      `MYSQLDUMP_PATH is set but invalid: ${value}. Point it to mysqldump executable.`,
    );
  }

  const candidates: string[] = ["mysqldump"];

  if (process.platform === "win32") {
    candidates.push(
      "mysqldump.exe",
      "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe",
      "C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin\\mysqldump.exe",
      "C:\\xampp\\mysql\\bin\\mysqldump.exe",
      "C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe",
      "C:\\wamp64\\bin\\mysql\\mysql8.0.36\\bin\\mysqldump.exe",
    );
  }

  for (const candidate of candidates) {
    if (!candidate.includes("\\") && !candidate.includes("/")) {
      if (await canExecuteCommand(candidate)) {
        return candidate;
      }
      continue;
    }
    if (await commandExists(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "mysqldump was not found. Set MYSQLDUMP_PATH in .env/.env.local to your mysqldump executable path.",
  );
}

function parseMysqlUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) {
    throw new Error("DATABASE_URL is missing.");
  }
  const url = new URL(raw);
  if (url.protocol !== "mysql:") {
    throw new Error("Only mysql:// DATABASE_URL is supported for backup.");
  }

  const database = url.pathname.replace(/^\//, "");
  if (!database) {
    throw new Error("Database name is missing in DATABASE_URL.");
  }

  return {
    host: url.hostname || "localhost",
    port: url.port || "3306",
    user: decodeURIComponent(url.username || ""),
    password: decodeURIComponent(url.password || ""),
    database,
  };
}

async function dumpDatabase(outputSqlPath: string) {
  const config = parseMysqlUrl();
  const mysqldumpPath = await resolveMysqldumpCommand();

  const args = [
    "-h",
    config.host,
    "-P",
    config.port,
    "-u",
    config.user,
    "--single-transaction",
    "--routines",
    "--events",
    "--triggers",
    "--databases",
    config.database,
    `--result-file=${outputSqlPath}`,
  ];

  if (config.password) {
    args.unshift(`--password=${config.password}`);
  }

  await runProcess(mysqldumpPath, args);
}

function shouldExcludeFromSiteCopy(srcPath: string, backupDir: string) {
  const normalizedSrc = path.resolve(srcPath);
  const root = projectRoot();
  const relative = path.relative(root, normalizedSrc);

  if (relative.startsWith("..")) return false;
  if (normalizedSrc.startsWith(backupDir)) return false;

  const firstSegment = relative ? relative.split(path.sep)[0] : "";
  if ([".git", ".next", "node_modules", "backups"].includes(firstSegment)) {
    return false;
  }

  return true;
}

async function copySiteSnapshot(targetDir: string, backupDir: string) {
  const root = projectRoot();
  const entries = await fs.readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(root, entry.name);
    if (!shouldExcludeFromSiteCopy(sourcePath, backupDir)) {
      continue;
    }
    const destPath = path.join(targetDir, entry.name);
    await fs.cp(sourcePath, destPath, {
      recursive: true,
      filter: (src) => shouldExcludeFromSiteCopy(src, backupDir),
    });
  }
}

async function dirSizeBytes(dirPath: string): Promise<number> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  let size = 0;
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      size += await dirSizeBytes(fullPath);
    } else if (entry.isFile()) {
      const stat = await fs.stat(fullPath);
      size += stat.size;
    }
  }
  return size;
}

function backupDateFromId(id: string) {
  const match = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})$/.exec(id);
  if (!match) return new Date(0);
  const [, y, m, d, hh, mm, ss] = match;
  return new Date(
    Number(y),
    Number(m) - 1,
    Number(d),
    Number(hh),
    Number(mm),
    Number(ss),
  );
}

export async function listBackups(): Promise<BackupItem[]> {
  const root = backupRoot();
  await ensureDir(root);
  const entries = await fs.readdir(root, { withFileTypes: true });

  const backups = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && /^\d{8}-\d{6}$/.test(entry.name))
      .map(async (entry) => {
        const absolutePath = path.join(root, entry.name);
        const createdAt = backupDateFromId(entry.name).toISOString();
        const sizeBytes = await dirSizeBytes(absolutePath);
        return {
          id: entry.name,
          createdAt,
          absolutePath,
          sizeBytes,
        };
      }),
  );

  return backups.sort((a, b) => b.id.localeCompare(a.id));
}

async function cleanupOldBackups() {
  const maxCount = Math.max(
    1,
    Number.parseInt(process.env.BACKUP_RETENTION_COUNT || "7", 10),
  );
  const backups = await listBackups();
  if (backups.length <= maxCount) return;

  for (const backup of backups.slice(maxCount)) {
    await fs.rm(backup.absolutePath, { recursive: true, force: true });
  }
}

export async function runBackup(): Promise<RunBackupResult> {
  const root = backupRoot();
  await ensureDir(root);

  const id = formatId();
  const target = path.join(root, id);
  await ensureDir(target);

  const dbDir = path.join(target, "database");
  const siteDir = path.join(target, "site");
  await Promise.all([ensureDir(dbDir), ensureDir(siteDir)]);

  await dumpDatabase(path.join(dbDir, "database.sql"));
  await copySiteSnapshot(siteDir, root);

  const summary = {
    createdAt: new Date().toISOString(),
    backupId: id,
    includes: ["database.sql", "site snapshot (includes public/uploads)"],
  };
  await fs.writeFile(
    path.join(target, "backup-manifest.json"),
    JSON.stringify(summary, null, 2),
    "utf8",
  );

  const sizeBytes = await dirSizeBytes(target);
  await cleanupOldBackups();

  return {
    backup: {
      id,
      createdAt: summary.createdAt,
      absolutePath: target,
      sizeBytes,
    },
  };
}
