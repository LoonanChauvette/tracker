import Link from "next/link";

const links = [
  { href: "/", label: "Reports" },
  { href: "/journals", label: "Journals" },
  { href: "/prompt", label: "Prompt" },
  { href: "/setup", label: "AI setup" },
  { href: "/generate", label: "Generate" },
];

export function Nav() {
  return (
    <header className="mb-12 border-b border-[var(--rule)] pb-6">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-soft)]">
        Monthly literature digest
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
        <Link href="/" className="font-[var(--font-display)] text-4xl leading-none tracking-tight">
          Tracker
        </Link>
        <nav className="flex flex-wrap gap-5 text-sm">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border-b border-transparent pb-0.5 text-[var(--ink-soft)] hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
