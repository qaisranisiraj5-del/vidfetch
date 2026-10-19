import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin Activity" };

export default async function AdminActivityPage() {
  const { service } = await requireAdmin({ redirect: true });
  const [activityRes, jobsRes] = await Promise.all([
    service
      .from("activity_log")
      .select("id, actor, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    service
      .from("download_jobs")
      .select("id, platform, url_hash, status, quality, format, error, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Activity</h1>
      <p className="mt-1 text-sm text-slate-600">
        Audit trail and processing jobs. Raw URLs are never stored — only
        one-way hashes.
      </p>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="act-log">
        <h2 id="act-log" className="text-base font-semibold">Activity log</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">When</th>
                <th className="pb-2 pr-4">Actor</th>
                <th className="pb-2 pr-4">Action</th>
                <th className="pb-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {(activityRes.data ?? []).map((a) => (
                <tr key={a.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-500">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 font-medium">{a.actor}</td>
                  <td className="py-2 pr-4">{a.action}</td>
                  <td className="py-2 font-mono text-xs text-slate-500">
                    {a.details ? JSON.stringify(a.details).slice(0, 120) : "—"}
                  </td>
                </tr>
              ))}
              {(activityRes.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-500">No activity yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="jobs">
        <h2 id="jobs" className="text-base font-semibold">Download jobs</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">When</th>
                <th className="pb-2 pr-4">Platform</th>
                <th className="pb-2 pr-4">URL hash</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Error</th>
              </tr>
            </thead>
            <tbody>
              {(jobsRes.data ?? []).map((j) => (
                <tr key={j.id} className="border-b border-slate-100 align-top last:border-0">
                  <td className="whitespace-nowrap py-2 pr-4 text-slate-500">
                    {new Date(j.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 capitalize">{j.platform}</td>
                  <td className="py-2 pr-4 font-mono text-xs text-slate-500">
                    {String(j.url_hash).slice(0, 16)}…
                  </td>
                  <td className="py-2 pr-4">{j.status}</td>
                  <td className="py-2 text-xs text-slate-500">
                    {j.error ? String(j.error).slice(0, 80) : "—"}
                  </td>
                </tr>
              ))}
              {(jobsRes.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-slate-500">No jobs yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
