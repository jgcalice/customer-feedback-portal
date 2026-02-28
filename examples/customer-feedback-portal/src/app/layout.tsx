import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { ToastProvider } from "@/components/ToastProvider";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { getI18nServer } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18nServer();
  return {
    title: t("common.appTitle"),
    description: t("common.appDescription"),
  };
}

async function getUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { email: true, role: true },
  });
  return user;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();
  const { locale, messages } = await getI18nServer();
  return (
    <html lang={locale}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <LocaleProvider locale={locale} messages={messages}>
          <ToastProvider>
            <Nav user={user} />
            <main className="mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-6">{children}</main>
          </ToastProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
