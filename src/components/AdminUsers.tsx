"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";
import { formatDate } from "@/lib/format";

interface Row {
  id: string;
  name: string;
  email: string;
  role: string;
  suspended: boolean;
  createdAt: string;
}

export function AdminUsers() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ users: Row[]; total: number; pageSize: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(p = page) {
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (role) params.set("role", role);
      params.set("page", String(p));
      const res = await api<{ users: Row[]; total: number; page: number; pageSize: number }>(
        `/api/admin/users?${params.toString()}`
      );
      setData(res);
      setPage(res.page);
    } catch (e: any) {
      setError(e?.message ?? "불러오기 실패 (ADMIN 필요)");
    }
  }
  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleSuspend(u: Row) {
    const suspend = !u.suspended;
    const reason = suspend ? window.prompt("정지 사유 (선택)") ?? undefined : undefined;
    setBusy(u.id);
    try {
      await api(`/api/admin/users/${u.id}/suspend`, {
        method: "POST",
        body: JSON.stringify({ suspend, reason }),
      });
      await load();
    } catch (e: any) {
      setError(e?.message ?? "처리 실패");
    } finally {
      setBusy(null);
    }
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void load(1);
        }}
        className="ws-card mb-4 flex flex-wrap items-end gap-3 p-4"
      >
        <label className="text-sm text-slate-600">
          검색
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름 또는 이메일"
            className="mt-1 block w-56 rounded-lg border border-sky-200 px-3 py-2"
          />
        </label>
        <label className="text-sm text-slate-600">
          역할
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 block w-32 rounded-lg border border-sky-200 px-3 py-2"
          >
            <option value="">전체</option>
            <option value="PARENT">부모</option>
            <option value="SITTER">시터</option>
            <option value="ADMIN">관리자</option>
          </select>
        </label>
        <button type="submit" className="ws-btn-primary text-sm">검색</button>
      </form>

      {error && <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>}
      {!data ? (
        <div className="h-40 animate-pulse rounded-xl2 bg-sky-50" />
      ) : data.users.length === 0 ? (
        <p className="ws-card p-8 text-center text-slate-500">사용자가 없습니다.</p>
      ) : (
        <div className="ws-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sky-100 text-left text-slate-400">
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">역할</th>
                <th className="px-4 py-3 font-medium">가입</th>
                <th className="px-4 py-3 text-right font-medium">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-50">
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="ws-badge bg-sky-100 text-sky-700">{u.role}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.role === "ADMIN" ? (
                      <span className="text-xs text-slate-400">—</span>
                    ) : (
                      <button
                        onClick={() => toggleSuspend(u)}
                        disabled={busy === u.id}
                        className={u.suspended ? "ws-btn-primary text-sm" : "ws-btn-ghost text-sm"}
                      >
                        {u.suspended ? "정지 해제" : "정지"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <button onClick={() => load(page - 1)} disabled={page <= 1} className="ws-btn-ghost text-sm disabled:opacity-50">← 이전</button>
          <span className="text-sm text-slate-500">{page} / {totalPages}</span>
          <button onClick={() => load(page + 1)} disabled={page >= totalPages} className="ws-btn-ghost text-sm disabled:opacity-50">다음 →</button>
        </div>
      )}
    </div>
  );
}
