"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function Nav({ user }: { user: { email: string; role: string } | null }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <nav className="border-b bg-white px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between">
        <div className="flex gap-4">
          <Link href="/problems" className="font-medium hover:underline">
            Problems
          </Link>
          <Link href="/roadmap" className="font-medium hover:underline">
            Roadmap
          </Link>
          <Link href="/positioning" className="font-medium hover:underline">
            Positioning
          </Link>
          {user?.role === "internal" && (
            <Link href="/admin" className="font-medium text-amber-600 hover:underline">
              Admin
            </Link>
          )}
        </div>
        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-600">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
              >
                {loggingOut ? "..." : "Logout"}
              </button>
            </div>
          ) : (
            <Link href="/login" className="font-medium hover:underline">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
