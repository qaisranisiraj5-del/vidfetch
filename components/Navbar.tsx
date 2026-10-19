"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2" aria-label="VidFetch home">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white"
          >
            V
          </span>
          <span className="text-xl font-bold tracking-tight">VidFetch</span>
        </Link>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>

        <ul className="hidden items-center gap-1 sm:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === l.href
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <ul id="mobile-menu" className="border-t border-slate-200 bg-white px-4 py-2 sm:hidden">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === l.href ? "page" : undefined}
                className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                  pathname === l.href ? "bg-brand-50 text-brand-700" : "text-slate-600"
                }`}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
