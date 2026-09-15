import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import NavBar from "@/components/NavBar";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "מעקב נוכחות והכנסות",
  description: "מעקב נוכחות והכנסות למרפאה",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${rubik.variable} h-full antialiased`}
    >
      <body
        className="relative flex min-h-full flex-col overflow-x-hidden bg-[#FBF6EF] pb-16 tracking-tight md:pb-0 dark:bg-black"
        style={{ fontFamily: "var(--font-rubik)" }}
      >
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-24 -end-24 h-96 w-96 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute -bottom-24 -start-24 h-96 w-96 rounded-full bg-purple-200/30 blur-3xl" />
        </div>
        <NavBar />
        <main className="relative flex-1">{children}</main>
      </body>
    </html>
  );
}
