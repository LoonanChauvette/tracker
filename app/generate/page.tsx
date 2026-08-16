import { GenerateForm } from "@/components/generate-form";

export default function GeneratePage() {
  return (
    <main>
      <h1 className="font-[var(--font-display)] text-4xl">Generate</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">
        Fetches the selected month from Crossref, scores new papers against your prompt, and writes a structured digest. Already-scored DOIs are skipped.
      </p>
      <div className="mt-10">
        <GenerateForm />
      </div>
    </main>
  );
}
