import UrlForm from "@/components/UrlForm";

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Download social videos —{" "}
            <span className="text-brand-600">honestly.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Paste a link from YouTube, Instagram, Facebook, or TikTok. We&apos;ll
            show you the download options that are actually available — and
            tell you plainly when they aren&apos;t.
          </p>
          <div className="mt-8 text-left">
            <UrlForm />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-2xl font-bold tracking-tight">
          How it works
        </h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-3">
          {[
            {
              title: "1. Paste a link",
              text: "Copy a video URL from any supported platform and paste it above.",
            },
            {
              title: "2. We check honestly",
              text: "We validate the link and ask the platform's authorized integration what is actually available.",
            },
            {
              title: "3. Get real options",
              text: "Choose from genuine quality and format options — or get a clear explanation when none exist.",
            },
          ].map((s) => (
            <li key={s.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Trust */}
      <section className="border-t border-slate-200 bg-white" aria-labelledby="why-honest">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="why-honest" className="text-2xl font-bold tracking-tight">
            Why honest matters
          </h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-semibold">No fake download buttons</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Many downloader sites show download options that don&apos;t
                work. We only show options backed by a real, authorized
                integration — and we say so clearly when one isn&apos;t
                configured.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-6">
              <h3 className="font-semibold">Respect for rights</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                We only process media you have the right to download. We never
                bypass DRM, private-account restrictions, or login requirements.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
