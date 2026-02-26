export default function PositioningPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Product Positioning</h1>
      <div className="space-y-6 rounded-lg border bg-white p-6">
        <section>
          <h2 className="mb-2 font-semibold">Principles</h2>
          <ul className="list-inside list-disc space-y-1 text-zinc-600">
            <li>Focus on problems, not feature requests</li>
            <li>Evidence-based prioritization (impact, frequency)</li>
            <li>Transparency without over-promising</li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Current Focus</h2>
          <p className="text-zinc-600">
            We are evaluating submitted problems and consolidating feedback to
            inform our roadmap. Check the Roadmap page for planned and
            in-progress items.
          </p>
        </section>
      </div>
    </div>
  );
}
