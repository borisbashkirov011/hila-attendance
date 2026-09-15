"use client";

import { useState } from "react";

export default function CalendarSyncButton() {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    if (typeof window === "undefined") return;

    const httpUrl = `${window.location.origin}/api/calendar/feed`;
    const webcalUrl = httpUrl.replace(/^https?:\/\//, "webcal://");

    const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);

    if (isIOS) {
      window.location.href = webcalUrl;
      return;
    }

    navigator.clipboard
      ?.writeText(httpUrl)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch(() => {
        window.location.href = webcalUrl;
      });
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={handleClick}
        className="flex h-11 items-center gap-2 rounded-full bg-gradient-to-br from-rose-100 to-orange-50 px-4 text-sm font-medium text-rose-700 shadow-sm transition-colors hover:from-rose-200 hover:to-orange-100"
      >
        <span aria-hidden>📅</span>
        הוספת משמרות ליומן באייפון
      </button>

      {copied && (
        <span className="absolute top-full mt-2 w-max rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white shadow-sm">
          הקישור הועתק ללוח
        </span>
      )}
    </div>
  );
}
