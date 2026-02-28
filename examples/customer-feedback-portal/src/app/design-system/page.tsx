"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/StatusBadge";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-lg font-semibold text-foreground border-b border-border pb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  const [inputVal, setInputVal] = useState("");
  const [selectVal, setSelectVal] = useState("");

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Design System
      </h1>
      <p className="text-muted-foreground text-sm mb-8">
        Single source of truth for typography, spacing, colors, and components.
        Use this page as reference when building or updating UI.
      </p>

      <Section title="Typography">
        <Block label="Page title (text-2xl font-bold)">
          <p className="text-2xl font-bold text-foreground">
            Customer Feedback Portal
          </p>
        </Block>
        <Block label="Section title (text-lg font-semibold)">
          <p className="text-lg font-semibold text-foreground">
            Problems
          </p>
        </Block>
        <Block label="Body (text-base)">
          <p className="text-base text-foreground">
            Centralize product problems, validate impact with customer interest.
          </p>
        </Block>
        <Block label="Body small (text-sm)">
          <p className="text-sm text-muted-foreground">
            Matching problems · Sorted by most recent
          </p>
        </Block>
        <Block label="Caption / label (text-xs)">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            Problems · Roadmap items
          </p>
        </Block>
      </Section>

      <Section title="Spacing scale">
        <div className="flex flex-wrap items-end gap-4">
          {[4, 8, 12, 16, 24, 32].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1">
              <div
                className="bg-primary rounded-sm"
                style={{ width: n, height: n }}
              />
              <span className="text-xs text-muted-foreground">{n}px</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Color palette">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { name: "Background", bg: "bg-background", text: "text-foreground", border: true },
            { name: "Card", bg: "bg-card", text: "text-card-foreground", border: true },
            { name: "Muted", bg: "bg-muted", text: "text-muted-foreground", border: true },
            { name: "Primary Gold", bg: "bg-primary", text: "text-primary-foreground" },
            { name: "Light Gold", bg: "bg-light-gold", text: "text-black" },
            { name: "Dark Gold", bg: "bg-dark-gold", text: "text-black" },
            { name: "Black", bg: "bg-black", text: "text-white" },
            { name: "Secondary", bg: "bg-secondary", text: "text-secondary-foreground", border: true },
            { name: "Destructive", bg: "bg-destructive", text: "text-destructive-foreground" },
          ].map(({ name, bg, text, border }) => (
            <div
              key={name}
              className={`rounded-md p-3 ${bg} ${text} ${border ? "border border-border" : ""}`}
            >
              <span className="text-sm font-medium">{name}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 rounded-md border border-border bg-card p-4">
          <p className="text-sm font-semibold text-card-foreground">Brand text/background compliance checks</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Gold gradient or primary gold backgrounds: black text only.</li>
            <li>Black backgrounds: white, light-gold, or dark-gold text only.</li>
            <li>LightGrey, DarkGrey, White, LightGold, DarkGold backgrounds: black text only.</li>
          </ul>
        </div>
      </Section>

      <Section title="Buttons">
        <Block label="Primary">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-opacity"
            >
              Submit
            </button>
            <button
              type="button"
              disabled
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm disabled:opacity-50"
            >
              Disabled
            </button>
          </div>
        </Block>
        <Block label="Secondary">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md border border-destructive/50 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors"
            >
              Delete
            </button>
          </div>
        </Block>
      </Section>

      <Section title="Form controls">
        <Block label="Input">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Placeholder"
            className="w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </Block>
        <Block label="Select">
          <select
            value={selectVal}
            onChange={(e) => setSelectVal(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Choose...</option>
            <option value="a">Option A</option>
            <option value="b">Option B</option>
          </select>
        </Block>
        <Block label="Textarea">
          <textarea
            rows={3}
            placeholder="Add context..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
          />
        </Block>
      </Section>

      <Section title="Cards">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Metric
            </p>
            <p className="mt-1 text-2xl font-semibold text-card-foreground">42</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground">
              Section with larger padding
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use p-6 for section-style cards.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status="new" />
          <StatusBadge status="evaluating" />
          <StatusBadge status="planned" />
          <StatusBadge status="in_progress" />
          <StatusBadge status="delivered" />
        </div>
      </Section>

      <Section title="Empty state">
        <div className="rounded-lg border border-border bg-card p-8 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            No items yet.{" "}
            <Link href="/problems/new" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </Section>

      <Section title="Error state">
        <p className="text-sm text-destructive">
          This is an inline error message.
        </p>
        <div className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Block error: Something went wrong. Please try again.
        </div>
      </Section>

      <Section title="Loading state">
        <p className="text-muted-foreground">Loading...</p>
        <div className="mt-2 flex items-center gap-2">
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary"
            aria-hidden
          />
          <span className="text-sm text-muted-foreground">Fetching data...</span>
        </div>
      </Section>

      <Section title="Toasts (reference)">
        <p className="text-sm text-muted-foreground mb-2">
          Toast variants — actual toasts are rendered by ToastProvider.
        </p>
        <div className="flex flex-col gap-2 w-full max-w-sm">
          <div className="rounded-lg border border-border bg-card p-3 shadow text-card-foreground">
            <p className="text-sm font-semibold">Success</p>
            <p className="mt-1 text-xs opacity-90">Action completed.</p>
          </div>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 shadow text-destructive">
            <p className="text-sm font-semibold">Error</p>
            <p className="mt-1 text-xs opacity-90">Something went wrong.</p>
          </div>
          <div className="rounded-lg border border-border bg-muted p-3 shadow text-muted-foreground">
            <p className="text-sm font-semibold">Info</p>
            <p className="mt-1 text-xs opacity-90">Here is some information.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}
