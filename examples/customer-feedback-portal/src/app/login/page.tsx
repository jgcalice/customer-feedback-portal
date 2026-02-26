"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackError = useMemo(() => {
    const value = searchParams.get("error");
    if (value === "invalid_link") {
      return "Magic link invalido ou expirado. Solicite um novo.";
    }
    if (value === "missing_link") {
      return "Link de login incompleto. Solicite um novo.";
    }
    return "";
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setMagicLink("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }
      setSuccess(
        data.sentByEmail
          ? "Enviamos o link magico para seu e-mail."
          : "Link magico gerado. Use o link abaixo (ambiente de desenvolvimento)."
      );
      if (typeof data.magicLink === "string") {
        setMagicLink(data.magicLink);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-2 text-2xl font-bold">Login</h1>
      <p className="mb-6 text-sm text-zinc-600">
        Digite seu e-mail para receber um link magico de acesso.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        {callbackError && <p className="text-sm text-red-600">{callbackError}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-700">{success}</p>}
        {magicLink && (
          <p className="rounded border border-emerald-200 bg-emerald-50 p-2 text-xs text-emerald-800">
            <a href={magicLink} className="underline">
              Abrir link magico
            </a>
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send magic link"}
        </button>
      </form>
      <p className="mt-4 text-sm text-zinc-600">
        <Link href="/problems" className="hover:underline">
          Continue as guest (view only)
        </Link>
      </p>
    </div>
  );
}
