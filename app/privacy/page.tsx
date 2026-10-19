import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: October 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What we collect</h2>
          <p className="mt-2">
            When you submit a video URL, we process it to validate the link and
            check the relevant platform integration. We store a one-way
            cryptographic hash of the URL (never the raw URL), the platform
            name, the outcome of the request, and a hashed network identifier
            for rate limiting and abuse prevention. We do not store the videos
            themselves.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What we don&apos;t collect</h2>
          <p className="mt-2">
            We don&apos;t require an account to use the downloader, we
            don&apos;t run advertising trackers, and we don&apos;t sell personal
            data. Submitted URLs are never kept longer than necessary to
            process your request.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Administrator accounts</h2>
          <p className="mt-2">
            Administrator sign-in uses email and password handled by our
            authentication provider. Passwords are stored as salted hashes and
            are never visible to us in plaintext.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Data retention</h2>
          <p className="mt-2">
            Request records (hashes and outcomes) are kept for operational and
            security purposes and are periodically pruned. Contact messages are
            kept only as long as needed to respond.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Your rights</h2>
          <p className="mt-2">
            Because we store hashes rather than raw URLs, most requests
            can&apos;t be linked back to you. If you believe we hold personal
            data about you, contact us and we&apos;ll respond within a
            reasonable time.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <p className="mt-2">
            Questions about this policy? Reach us via the{" "}
            <a href="/contact" className="text-brand-700 underline">contact page</a>.
          </p>
        </section>
      </div>
    </article>
  );
}
