import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQ" };

const ITEMS = [
  {
    q: "Which platforms are supported?",
    a: "YouTube, Instagram, Facebook, and TikTok links are accepted. Whether download options are actually available depends on each platform's authorized integration being configured.",
  },
  {
    q: "Why does it say an integration is not configured?",
    a: "Each platform needs official API credentials before we can offer downloads. Until an administrator adds them, we show that state honestly instead of fake download buttons.",
  },
  {
    q: "Is it legal to download videos with this tool?",
    a: "Only download content you own or have permission to download. We never bypass DRM, private accounts, or login requirements, and using the tool for copyrighted material without permission may violate the law and the platform's terms.",
  },
  {
    q: "Do you store the links I paste?",
    a: "No. We store only a one-way hash of the URL plus the platform and outcome, for abuse prevention and statistics. Raw URLs are never kept longer than needed to process your request.",
  },
  {
    q: "Do I need an account?",
    a: "No. The downloader works without signing in. Accounts exist only for the site administrator.",
  },
  {
    q: "What video qualities and formats are offered?",
    a: "When an integration supports a link, you'll see the real quality (e.g. 720p, 1080p) and format (e.g. MP4) options it provides — commonly MP4 and WebM.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Frequently asked questions</h1>
      <dl className="mt-8 space-y-4">
        {ITEMS.map((item) => (
          <div key={item.q} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <dt className="font-semibold text-slate-900">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
