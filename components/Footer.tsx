"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="text-lg font-bold">VidFetch</p>
            <p className="mt-2 max-w-xs text-sm text-slate-600">
              Honest video downloads from YouTube, Instagram, Facebook, and
              TikTok — only when the platform and your rights allow it.
            </p>
          </div>
          <nav aria-label="Legal">
            <p className="text-sm font-semibold text-slate-900">Legal</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="text-slate-600 hover:text-brand-700" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="text-slate-600 hover:text-brand-700" href="/terms">Terms of Service</Link></li>
            </ul>
          </nav>
          <nav aria-label="Support">
            <p className="text-sm font-semibold text-slate-900">Support</p>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="text-slate-600 hover:text-brand-700" href="/faq">FAQ</Link></li>
              <li><Link className="text-slate-600 hover:text-brand-700" href="/contact">Contact</Link></li>
            </ul>
          </nav>
        </div>
        <p className="mt-8 border-t border-slate-100 pt-6 text-xs text-slate-500">
          © {new Date().getFullYear()} VidFetch. Only download content you have
          the right to download. Respect creators and platform terms.
        </p>
      </div>
    </footer>
  );
}
