const COLORS: Record<string, string> = {
  youtube: "bg-red-50 text-red-700 border-red-200",
  instagram: "bg-pink-50 text-pink-700 border-pink-200",
  facebook: "bg-blue-50 text-blue-700 border-blue-200",
  tiktok: "bg-slate-900 text-white border-slate-900",
};

export default function PlatformBadge({ platform }: { platform: string }) {
  const key = platform.toLowerCase();
  const color = COLORS[key] ?? "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${color}`}
    >
      {platform}
    </span>
  );
}
