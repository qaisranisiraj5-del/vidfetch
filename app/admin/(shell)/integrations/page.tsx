import { requireAdmin } from "@/lib/auth";
import { getAllStatuses } from "@/lib/integrations";
import IntegrationsTable from "./integrations-table";

export const metadata = { title: "Admin Integrations" };

export default async function AdminIntegrationsPage() {
  const { service } = await requireAdmin({ redirect: true });
  const [statuses, enabledRow] = await Promise.all([
    getAllStatuses(),
    service.from("app_settings").select("value").eq("key", "enabled_platforms").single(),
  ]);
  const enabled: string[] = Array.isArray(enabledRow.data?.value)
    ? enabledRow.data.value
    : [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Integrations</h1>
      <p className="mt-1 text-sm text-slate-600">
        Platform status is read from environment credentials — shown honestly,
        never fabricated. Enable/disable controls which platforms the site
        accepts links for.
      </p>
      <div className="mt-6">
        <IntegrationsTable
          initial={statuses.map((s) => ({
            platform: s.platform,
            name: s.name,
            configured: s.configured,
            healthy: s.healthy,
            message: s.message,
            enabled: enabled.includes(s.platform),
          }))}
        />
      </div>
    </div>
  );
}
