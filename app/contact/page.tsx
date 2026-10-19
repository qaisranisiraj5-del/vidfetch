"use client";

import { useState, type FormEvent } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "sending" }
    | { status: "sent" }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState({ status: "error", message: data?.message ?? "Could not send your message." });
        return;
      }
      setState({ status: "sent" });
      setName("");
      setEmail("");
      setMessage("");
    } catch {
      setState({ status: "error", message: "Network error. Please try again later." });
    }
  }

  const inputCls =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand-600 focus:ring-2 focus:ring-brand-100";

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Contact us</h1>
      <p className="mt-2 text-slate-600">
        Questions, feedback, or a takedown request? Send us a message — it goes
        straight to the site administrator.
      </p>

      {state.status === "sent" ? (
        <div role="status" className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-sm text-green-800">
          <p className="font-semibold">Message sent</p>
          <p className="mt-1">Thanks for reaching out — we&apos;ll get back to you soon.</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-8 space-y-4" aria-label="Contact form">
          <div>
            <label htmlFor="contact-name" className="mb-1 block text-sm font-medium text-slate-700">
              Name
            </label>
            <input
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
              autoComplete="name"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={254}
              required
              autoComplete="email"
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-slate-700">
              Message
            </label>
            <textarea
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={5000}
              required
              rows={6}
              className={inputCls}
            />
          </div>
          {state.status === "error" && (
            <p role="alert" className="text-sm text-red-700">{state.message}</p>
          )}
          <button
            type="submit"
            disabled={state.status === "sending"}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {state.status === "sending" ? "Sending…" : "Send message"}
          </button>
        </form>
      )}
    </div>
  );
}
