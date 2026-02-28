"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/LocaleProvider";

type Product = { id: string; name: string };

export default function NewProblemPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    productId: "",
    title: "",
    problemStatement: "",
    impact: "",
    frequency: "daily",
    workaround: "",
  });
  const router = useRouter();
  const { addToast } = useToast();
  const { t } = useI18n();

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(data);
        setForm((prev) => ({
          ...prev,
          productId: prev.productId || data[0]?.id || "",
        }));
      })
      .catch(() => setError(t("api.internalServerError")));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const message = data.error ?? t("api.internalServerError");
        setError(message);
        addToast({ tone: "error", title: t("toast.submitProblemErrorTitle"), description: message });
        return;
      }
      addToast({
        tone: "success",
        title: t("toast.submitProblemSuccessTitle"),
        description: t("toast.submitProblemSuccessDesc"),
      });
      router.push(`/problems/${data.id}?created=1`);
      router.refresh();
    } catch {
      const message = t("login.genericError");
      setError(message);
      addToast({ tone: "error", title: t("toast.unexpectedErrorTitle"), description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("problemNew.title")}</h1>
      <p className="mb-6 text-muted-foreground">
        {t("problemNew.subtitlePrefix")}{" "}
        <Link href="/login" className="text-primary hover:underline">
          {t("problemNew.login")}
        </Link>{" "}
        {t("problemNew.subtitleSuffix")}
      </p>

      {error && <p className="mb-4 text-destructive">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t("problemNew.product")}</label>
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            required
            aria-label="Product"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          >
            <option value="">{t("problemNew.select")}</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t("problemNew.titleLabel")}</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            aria-label="Problem title"
            placeholder={t("problemNew.titlePlaceholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("problemNew.statement")}
          </label>
          <textarea
            value={form.problemStatement}
            onChange={(e) =>
              setForm({ ...form, problemStatement: e.target.value })
            }
            required
            rows={3}
            aria-label="Problem statement"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("problemNew.impact")}
          </label>
          <input
            type="text"
            value={form.impact}
            onChange={(e) => setForm({ ...form, impact: e.target.value })}
            required
            aria-label="Impact"
            placeholder={t("problemNew.impactPlaceholder")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">{t("problemNew.frequency")}</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            aria-label="Frequency"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          >
            <option value="daily">{t("problemNew.daily")}</option>
            <option value="weekly">{t("problemNew.weekly")}</option>
            <option value="monthly">{t("problemNew.monthly")}</option>
            <option value="rarely">{t("problemNew.rarely")}</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            {t("problemNew.workaround")}
          </label>
          <input
            type="text"
            value={form.workaround}
            onChange={(e) => setForm({ ...form, workaround: e.target.value })}
            placeholder={t("problemNew.workaroundPlaceholder")}
            aria-label="Workaround"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-opacity shadow-sm"
        >
          {loading ? t("problemNew.submitting") : t("problemNew.submit")}
        </button>
      </form>
    </div>
  );
}
