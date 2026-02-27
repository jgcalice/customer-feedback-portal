"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const notifiedErrorRef = useRef("");
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

  useEffect(() => {
    if (callbackError && notifiedErrorRef.current !== callbackError) {
      addToast({
        tone: "error",
        title: "Falha no login",
        description: callbackError,
      });
      notifiedErrorRef.current = callbackError;
    }
  }, [addToast, callbackError]);

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
        const message = data.error ?? "Login failed";
        setError(message);
        addToast({ tone: "error", title: "Nao foi possivel enviar o link", description: message });
        return;
      }
      const successMessage = data.sentByEmail
        ? "Enviamos o link magico para seu e-mail."
        : "Link magico gerado. Use o link abaixo (ambiente de desenvolvimento).";
      setSuccess(
        successMessage
      );
      addToast({ tone: "success", title: "Link enviado", description: successMessage });
      if (typeof data.magicLink === "string") {
        setMagicLink(data.magicLink);
      }
    } catch {
      const message = "Something went wrong";
      setError(message);
      addToast({ tone: "error", title: "Erro inesperado", description: message });
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
            aria-label="Email for magic link login"
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
