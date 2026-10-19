import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: October 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Acceptable use</h2>
          <p className="mt-2">
            You may use this service only to download content you own or have
            explicit permission to download. You agree not to use the service
            to infringe copyrights, bypass digital rights management (DRM),
            circumvent private-account or login restrictions, or violate any
            platform&apos;s terms of service.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">No guarantees</h2>
          <p className="mt-2">
            Download availability depends on third-party platform integrations
            outside our control. We report integration status honestly; we do
            not guarantee that any particular link can be downloaded.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Abuse prevention</h2>
          <p className="mt-2">
            To protect the service we rate-limit requests, validate and
            normalize URLs, and block requests that target private or internal
            network addresses. Misuse may result in temporary or permanent
            restriction of access.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Liability</h2>
          <p className="mt-2">
            The service is provided &quot;as is&quot; without warranties of any
            kind. You are responsible for ensuring you have the rights to any
            content you download. We are not liable for content downloaded
            through the service or for actions taken by third-party platforms.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Changes</h2>
          <p className="mt-2">
            We may update these terms as the service evolves. Continued use of
            the service after changes take effect constitutes acceptance of the
            updated terms.
          </p>
        </section>
      </div>
    </article>
  );
}
