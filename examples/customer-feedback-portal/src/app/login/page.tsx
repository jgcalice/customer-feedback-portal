"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/LocaleProvider";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [magicLink, setMagicLink] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const { t } = useI18n();
  const notifiedErrorRef = useRef("");
  const callbackError = useMemo(() => {
    const value = searchParams.get("error");
    if (value === "invalid_link") {
      return t("login.invalidLink");
    }
    if (value === "missing_link") {
      return t("login.missingLink");
    }
    return "";
  }, [searchParams]);

  useEffect(() => {
    if (callbackError && notifiedErrorRef.current !== callbackError) {
      addToast({
        tone: "error",
        title: t("toast.loginFailedTitle"),
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
        const message = data.error ?? t("toast.loginFailedTitle");
        setError(message);
        addToast({ tone: "error", title: t("toast.sendLinkFailedTitle"), description: message });
        return;
      }
      const successMessage = data.sentByEmail
        ? t("api.magicLinkGenerated")
        : t("api.magicLinkGenerated");
      setSuccess(
        successMessage
      );
      addToast({ tone: "success", title: t("toast.linkSentTitle"), description: successMessage });
      if (typeof data.magicLink === "string") {
        setMagicLink(data.magicLink);
      }
    } catch {
      const message = t("login.genericError");
      setError(message);
      addToast({ tone: "error", title: t("toast.unexpectedErrorTitle"), description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm sm:max-w-md">
      <h1 className="mb-2 text-2xl font-bold text-foreground">{t("login.title")}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {t("login.subtitle")}
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t("login.email")}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="Email for magic link login"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        {callbackError && <p className="text-sm text-destructive">{callbackError}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground" role="status">
            <p className="font-medium text-primary">{success}</p>
          </div>
        )}
        {magicLink && (
          <div className="rounded-lg border-2 border-primary bg-primary/10 p-4" role="region" aria-label={t("login.openMagicLink")}>
            <p className="mb-2 text-sm font-medium text-foreground">{t("login.openMagicLink")}</p>
            <a
              href={magicLink}
              className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
            >
              {t("login.openMagicLink")}
            </a>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-opacity shadow-sm"
        >
          {loading ? t("login.sending") : t("login.sendMagicLink")}
        </button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href="/problems" className="text-primary hover:underline">
          {t("login.continueAsGuest")}
        </Link>
      </p>
    </div>
  );
}
