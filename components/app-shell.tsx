"use client";

import { AI_PROVIDERS } from "@/lib/ai-providers";
import type { AiPublicState } from "@/lib/ai-settings";
import { formatTokenCount } from "@/lib/format";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/", label: "Reports", icon: ReportsIcon },
  { href: "/generate", label: "Generate", icon: GenerateIcon },
  { href: "/journals", label: "Journals", icon: JournalsIcon },
  { href: "/prompt", label: "Prompt", icon: PromptIcon },
  { href: "/setup", label: "Model", icon: ModelIcon },
];

export function AppShell({
  children,
  ai,
}: {
  children: React.ReactNode;
  ai: AiPublicState;
}) {
  const pathname = usePathname();
  const [status, setStatus] = useState(ai);

  useEffect(() => {
    let ignore = false;
    fetch("/api/ai")
      .then((response) => response.json())
      .then((data: AiPublicState) => {
        if (!ignore) setStatus(data);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-[220px] shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-text)]">
        <div className="px-5 pb-6 pt-5">
          <Link href="/" className="text-[15px] font-semibold tracking-tight text-white">
            Tracker
          </Link>
          <p className="mt-1 text-[11px] text-[var(--sidebar-muted)]">Monthly digest</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 px-3">
          {nav.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/reports")
                : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] ${
                  active
                    ? "bg-white/10 text-[var(--sidebar-active)]"
                    : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/setup" className="mx-3 mb-4 rounded-lg bg-white/5 px-3 py-3">
          <p className="text-[11px] text-[var(--sidebar-muted)]">Model</p>
          {status.configured ? (
            <>
              <p className="mt-1 truncate text-[13px] text-white">
                {AI_PROVIDERS[status.provider].label}
              </p>
              <p className="truncate text-[11px] text-[var(--sidebar-muted)]">{status.model}</p>
              <p className="mt-2 text-[11px] text-[var(--sidebar-muted)]">
                {formatTokenCount(status.usage.promptTokens + status.usage.completionTokens)} tokens
                {status.usage.requests ? ` · ${status.usage.requests} calls` : ""}
              </p>
            </>
          ) : (
            <p className="mt-1 text-[13px] text-white">Connect a provider</p>
          )}
        </Link>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="mx-auto w-full max-w-5xl px-8 py-8">{children}</div>
      </div>
    </div>
  );
}

function ReportsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 4.5h10M3 8h10M3 11.5h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function GenerateIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 2.5v11M4 8.5l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function JournalsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 2.5h8.5v11H4A1.5 1.5 0 0 1 2.5 12V4A1.5 1.5 0 0 1 4 2.5Z" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6 5h5M6 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PromptIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 3.5h9v9l-2.2-1.6H3.5v-7.4Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

function ModelIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 5.5v5M5.5 8h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
