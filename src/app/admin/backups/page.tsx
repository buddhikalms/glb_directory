"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type BackupItem = {
  id: string;
  createdAt: string;
  absolutePath: string;
  sizeBytes: number;
};

function formatSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(value >= 100 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AdminBackupsPage() {
  const router = useRouter();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const isAuthenticated =
    typeof window !== "undefined"
      ? localStorage.getItem("isAuthenticated") === "true"
      : false;

  const totalSize = useMemo(
    () => backups.reduce((sum, item) => sum + item.sizeBytes, 0),
    [backups],
  );

  const loadBackups = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/admin/backups", { cache: "no-store" });
      const payload = (await response.json().catch(() => ({}))) as {
        backups?: BackupItem[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load backups.");
      }
      setBackups(Array.isArray(payload.backups) ? payload.backups : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || user.role !== "admin") {
      router.push("/login");
      return;
    }
    void loadBackups();
  }, [isAuthenticated, router, user.role]);

  const handleRunBackup = async () => {
    try {
      setRunning(true);
      setError(null);
      const response = await fetch("/api/admin/backups", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to run backup.");
      }
      await loadBackups();
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Unexpected error.");
    } finally {
      setRunning(false);
    }
  };

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
                Backups
              </h1>
              <p className="text-gray-600">
                Manual admin backups for database and full site files (including uploads).
              </p>
            </div>
            <button
              type="button"
              onClick={handleRunBackup}
              disabled={running}
              className="btn-primary disabled:opacity-60"
            >
              {running ? "Running Backup..." : "Run Backup Now"}
            </button>
          </div>

          {error ? (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Total Backups</p>
              <p className="text-3xl font-bold text-gray-900">{backups.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Total Backup Size</p>
              <p className="text-3xl font-bold text-gray-900">{formatSize(totalSize)}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-600">Retention Count</p>
              <p className="text-3xl font-bold text-gray-900">
                {process.env.NEXT_PUBLIC_BACKUP_RETENTION_COUNT || "7"}
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            {loading ? (
              <div className="p-8 text-center text-gray-600">Loading backups...</div>
            ) : backups.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No backups yet. Run your first backup.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Backup ID
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Size
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                        Path
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {formatSize(item.sizeBytes)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600">
                          {item.absolutePath}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
