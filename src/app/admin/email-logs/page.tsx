"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";

type EmailLogRow = {
  id: string;
  to: string;
  subject: string;
  template: string;
  status: "sent" | "failed" | "skipped";
  error: string | null;
  messageId: string | null;
  createdAt: string;
};

export default function AdminEmailLogsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<EmailLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};
  const isAuthenticated =
    typeof window !== "undefined"
      ? localStorage.getItem("isAuthenticated") === "true"
      : false;

  useEffect(() => {
    if (!isAuthenticated || user.role !== "admin") {
      router.push("/login");
      return;
    }

    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/admin/email-logs");
        const payload = (await response.json().catch(() => [])) as
          | EmailLogRow[]
          | { error?: string };

        if (!response.ok) {
          throw new Error(
            !Array.isArray(payload) ? payload.error || "Failed to load logs." : "Failed to load logs.",
          );
        }

        if (!active) return;
        setRows(Array.isArray(payload) ? payload : []);
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Failed to load logs.");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [isAuthenticated, router, user.role]);

  const summary = useMemo(() => {
    return {
      total: rows.length,
      sent: rows.filter((row) => row.status === "sent").length,
      failed: rows.filter((row) => row.status === "failed").length,
      skipped: rows.filter((row) => row.status === "skipped").length,
    };
  }, [rows]);
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pageStartIndex = (currentPage - 1) * rowsPerPage;
  const pageEndIndex = pageStartIndex + rowsPerPage;
  const paginatedRows = rows.slice(pageStartIndex, pageEndIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [rowsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!isAuthenticated || user.role !== "admin") return null;

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl">
          <div className="mb-8">
            <h1 className="mb-2 font-display text-4xl font-bold text-gray-900">
              Email Logs
            </h1>
            <p className="text-gray-600">
              Track all transactional emails sent from this site.
            </p>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">Total</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">Sent</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.sent}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">Failed</p>
              <p className="mt-1 text-2xl font-bold text-red-700">{summary.failed}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase text-gray-500">Skipped</p>
              <p className="mt-1 text-2xl font-bold text-amber-700">{summary.skipped}</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-md">
            {loading ? (
              <div className="p-6 text-sm text-gray-600">Loading email logs...</div>
            ) : error ? (
              <div className="p-6 text-sm text-red-700">{error}</div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No email logs yet.</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Time</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">To</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Template</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Subject</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Message ID / Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={(pageStartIndex + idx) % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {new Date(row.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">{row.to}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{row.template}</td>
                        <td className="px-4 py-3 text-xs text-gray-700">{row.subject}</td>
                        <td className="px-4 py-3 text-xs">
                          <span
                            className={`rounded-full px-2 py-1 font-semibold ${
                              row.status === "sent"
                                ? "bg-emerald-100 text-emerald-700"
                                : row.status === "failed"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {row.messageId || row.error || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                </div>
                <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 md:flex-row md:items-center md:justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {pageStartIndex + 1}-{Math.min(pageEndIndex, totalRows)} of {totalRows}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600" htmlFor="email-logs-rows-per-page">
                      Rows:
                    </label>
                    <select
                      id="email-logs-rows-per-page"
                      value={rowsPerPage}
                      onChange={(e) => setRowsPerPage(Number(e.target.value))}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-2 text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage >= totalPages}
                      className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
