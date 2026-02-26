"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Problem = {
  id: string;
  title: string;
  status: string;
  product: { name: string };
  _count: { interests: number };
  hasInterest: boolean;
};

type Product = { id: string; name: string };

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then(setProducts)
      .catch(() => setError("Failed to load products"));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (productId) params.set("productId", productId);
    if (status) params.set("status", status);
    if (search) params.set("search", search);
    fetch(`/api/problems?${params}`)
      .then((r) => r.json())
      .then(setProblems)
      .catch(() => setError("Failed to load problems"))
      .finally(() => setLoading(false));
  }, [productId, status, search]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Problems</h1>
        <Link
          href="/problems/new"
          className="rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-800"
        >
          New Problem
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          <option value="">All products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="evaluating">Evaluating</option>
          <option value="planned">Planned</option>
          <option value="in_progress">In progress</option>
          <option value="delivered">Delivered</option>
        </select>
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-zinc-300 px-3 py-2"
        />
      </div>

      {error && <p className="mb-4 text-red-600">{error}</p>}

      {loading ? (
        <p className="text-zinc-600">Loading...</p>
      ) : problems.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center text-zinc-600">
          No problems found.{" "}
          <Link href="/problems/new" className="font-medium hover:underline">
            Submit one
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {problems.map((p) => (
            <li key={p.id}>
              <Link
                href={`/problems/${p.id}`}
                className="block rounded-lg border bg-white p-4 hover:border-zinc-400"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-semibold">{p.title}</h2>
                    <p className="text-sm text-zinc-600">
                      {p.product.name} · {p.status}
                    </p>
                  </div>
                  <span className="rounded bg-zinc-100 px-2 py-1 text-sm">
                    {p._count.interests} me afeta
                    {p.hasInterest && " ✓"}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
