"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  {
    href: "/",
    label: "ראשי",
    icon: (
      <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    ),
  },
  {
    href: "/schedule",
    label: "משמרות",
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="16" rx="3.5" />
        <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" />
      </>
    ),
  },
  {
    href: "/taxes",
    label: "מיסים",
    icon: (
      <>
        <path d="M12 2v20M17 5.5c0-1.5-2-2.5-5-2.5s-5 1.3-5 3 2 2.7 5 3 5 1.5 5 3-2 3-5 3-5-1-5-2.5" />
      </>
    ),
  },
  {
    href: "/settings",
    label: "הגדרות",
    icon: (
      <>
        <circle cx="12" cy="12" r="3.25" />
        <path d="M19.4 13.5a7.7 7.7 0 0 0 0-3l2-1.3-2-3.5-2.3.6a7.8 7.8 0 0 0-2.6-1.5L14 2h-4l-.5 2.3a7.8 7.8 0 0 0-2.6 1.5l-2.3-.6-2 3.5 2 1.3a7.7 7.7 0 0 0 0 3l-2 1.3 2 3.5 2.3-.6a7.8 7.8 0 0 0 2.6 1.5L10 22h4l.5-2.3a7.8 7.8 0 0 0 2.6-1.5l2.3.6 2-3.5-2-1.3Z" />
      </>
    ),
  },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <header className="fixed bottom-0 z-30 w-full border-t border-gray-200/50 bg-white/80 backdrop-blur-md md:sticky md:top-0 md:bottom-auto md:border-t-0 md:border-b md:border-gray-200/70">
      <nav className="mx-auto flex max-w-5xl items-center justify-around px-2 py-1.5 md:justify-between md:px-8 md:py-3">
        <span className="hidden items-center gap-2 text-base font-semibold tracking-tight text-slate-900 md:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-rose-300 to-purple-200" />
          המרפאה של הילה
        </span>
        <div className="flex w-full items-center justify-around gap-1 md:w-auto md:justify-end md:gap-2">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className={`flex h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 text-[11px] font-medium transition-colors md:h-11 md:flex-initial md:flex-row md:gap-1.5 md:px-4 md:text-sm ${
                  isActive
                    ? "bg-rose-50 text-rose-500"
                    : "text-[#8E8E93] hover:bg-rose-50/60 hover:text-slate-900"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={isActive ? 2.2 : 1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  {link.icon}
                </svg>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
