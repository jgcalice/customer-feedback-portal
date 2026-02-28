"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/LocaleProvider";
import { LanguageToggle } from "@/components/LanguageToggle";

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}) {
  const base =
    "font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md transition-colors";
  const activeClass = active
    ? "text-primary font-semibold"
    : "text-foreground hover:text-primary";
  return (
    <Link href={href} className={`${base} ${activeClass}`} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function Nav({ user }: { user: { email: string; role: string } | null }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { addToast } = useToast();
  const { t } = useI18n();

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      addToast({
        tone: "info",
        title: t("toast.sessionClosedTitle"),
        description: t("toast.sessionClosedDesc"),
      });
    } finally {
      setLoggingOut(false);
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <nav className="border-b border-border bg-card shadow-sm px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <NavLink href="/" active={pathname === "/"}>
            {t("nav.dashboard")}
          </NavLink>
          <NavLink href="/problems" active={pathname?.startsWith("/problems") && pathname !== "/problems/new"}>
            {t("nav.problems")}
          </NavLink>
          <NavLink href="/roadmap" active={pathname === "/roadmap"}>
            {t("nav.roadmap")}
          </NavLink>
          <NavLink href="/positioning" active={pathname === "/positioning"}>
            {t("nav.positioning")}
          </NavLink>
          {user?.role === "internal" && (
            <NavLink href="/admin" active={pathname === "/admin"}>
              {t("nav.admin")}
            </NavLink>
          )}
        </div>
        <div>
          {user ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <LanguageToggle />
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-md border border-border px-2 py-1 text-xs font-medium text-secondary-foreground bg-secondary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {loggingOut ? "..." : t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link href="/login" className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md">
                {t("nav.login")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
