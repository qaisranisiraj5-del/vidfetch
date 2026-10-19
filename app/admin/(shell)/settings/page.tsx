import { requireAdmin } from "@/lib/auth";
import SettingsForm from "./settings-form";

export const metadata = { title: "Admin Settings" };

export default async function AdminSettingsPage() {
  const { service } = await requireAdmin({ redirect: true });
  const { data } = await service
    .from("app_settings")
    .select("key, value")
    .order("key");

  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        Non-secret site configuration. Secrets stay in environment variables.
      </p>
      <div className="mt-6">
        <SettingsForm initial={data ?? []} />
      </div>
    </div>
  );
}
