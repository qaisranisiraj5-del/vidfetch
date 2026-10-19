import { requireAdmin } from "@/lib/auth";
import { getAllStatuses } from "@/lib/integrations";

export const metadata = { title: "Admin Dashboard" };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

export default async function AdminDashboard() {
  const { service } = await requireAdmin({ redirect: true });

  const [
    totalRes,
    successRes,
    failedRes,
    todayRes,
    activityRes,
    jobsRes,
  ] = await Promise.all([
    service.from("download_jobs").select("id", { count: "exact", head: true }),
    service.from("download_jobs").select("id", { count: "exact", head: true }).eq("status", "success"),
    service.from("download_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    service
      .from("download_jobs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),
    service.from("activity_log").select("id, actor, action, created_at").order("created_at", { ascending: false }).limit(8),
    service.from("download_jobs").select("platform, status, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const statuses = await getAllStatuses();
  const configuredCount = statuses.filter((s) => s.configured).length;

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Overview of download requests, integrations, and recent activity.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total requests" value={totalRes.count ?? 0} />
        <StatCard label="Successful" value={successRes.count ?? 0} />
        <StatCard label="Failed" value={failedRes.count ?? 0} />
        <StatCard label="Requests today" value={todayRes.count ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="int-status">
          <h2 id="int-status" className="text-base font-semibold">
            Platform integrations ({configuredCount}/{statuses.length} configured)
          </h2>
          <ul className="mt-4 space-y-3">
            {statuses.map((s) => (
              <li key={s.platform} className="flex items-start justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{s.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{s.message}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    s.configured
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {s.configured ? "Configured" : "Not configured"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="recent-activity">
          <h2 id="recent-activity" className="text-base font-semibold">Recent activity</h2>
          {activityRes.data && activityRes.data.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm">
              {activityRes.data.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4">
                  <span className="text-slate-700">
                    <span className="font-medium">{a.actor}</span> · {a.action}
                  </span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {new Date(a.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-500">No activity recorded yet.</p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm" aria-labelledby="recent-jobs">
        <h2 id="recent-jobs" className="text-base font-semibold">Latest download jobs</h2>
        {jobsRes.data && jobsRes.data.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="pb-2 pr-4">Platform</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">When</th>
                </tr>
              </thead>
              <tbody>
                {jobsRes.data.map((j, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 capitalize">{j.platform}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          j.status === "success"
                            ? "bg-green-100 text-green-800"
                            : j.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-2 text-slate-500">
                      {new Date(j.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No download jobs yet.</p>
        )}
      </section>
    </div>
  );
}
