"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

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
      .catch(() => setError("Failed to load products"));
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
        const message = data.error ?? "Failed to create";
        setError(message);
        addToast({ tone: "error", title: "Nao foi possivel enviar", description: message });
        return;
      }
      addToast({
        tone: "success",
        title: "Problema enviado",
        description: "Seu problema foi registrado com sucesso.",
      });
      router.push(`/problems/${data.id}?created=1`);
      router.refresh();
    } catch {
      const message = "Something went wrong";
      setError(message);
      addToast({ tone: "error", title: "Erro inesperado", description: message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Submit a Problem</h1>
      <p className="mb-6 text-zinc-600">
        Describe the problem with context, impact, and frequency.{" "}
        <Link href="/login" className="hover:underline">
          Login
        </Link>{" "}
        to submit.
      </p>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border bg-white p-6"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">Product *</label>
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value })}
            required
            aria-label="Product"
            className="w-full rounded border border-zinc-300 px-3 py-2"
          >
            <option value="">Select...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Title *</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            aria-label="Problem title"
            placeholder="Short description"
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Problem statement * (what happens?)
          </label>
          <textarea
            value={form.problemStatement}
            onChange={(e) =>
              setForm({ ...form, problemStatement: e.target.value })
            }
            required
            rows={3}
            aria-label="Problem statement"
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Impact * (what does it cost?)
          </label>
          <input
            type="text"
            value={form.impact}
            onChange={(e) => setForm({ ...form, impact: e.target.value })}
            required
            aria-label="Impact"
            placeholder="e.g. Lost time, errors, manual work"
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Frequency *</label>
          <select
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            aria-label="Frequency"
            className="w-full rounded border border-zinc-300 px-3 py-2"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="rarely">Rarely</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Workaround (optional)
          </label>
          <input
            type="text"
            value={form.workaround}
            onChange={(e) => setForm({ ...form, workaround: e.target.value })}
            placeholder="How do you work around it today?"
            aria-label="Workaround"
            className="w-full rounded border border-zinc-300 px-3 py-2"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
