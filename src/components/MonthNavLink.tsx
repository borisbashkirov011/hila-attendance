"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function MonthNavLink({
  href,
  className,
  children,
}: {
  href: string;
  className: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.push(href))}
      className={`${className} ${isPending ? "opacity-60" : ""}`}
    >
      {children}
    </button>
  );
}
