"use client";

import Link from "next/link";

export function Nav({ user }: { user: { email: string; role: string } | null }) {
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
            <span className="text-sm text-zinc-600">{user.email}</span>
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
