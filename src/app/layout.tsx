import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://electeds.manapool.nyc"),
  title: {
    default: "NY Electeds: Constituent Services Tracker",
    template: "%s · NY Electeds",
  },
  description:
    "How well do New York's elected officials serve their constituents? Offices, contact channels, response rates, schedules and scorecards.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              NY Electeds <span className="font-normal text-slate-500">· Constituent Services Tracker</span>
            </Link>
            <nav className="flex gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Officials
              </Link>
              <Link href="/methodology" className="hover:text-slate-900">
                Methodology
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500">
            Independent project. Data is compiled from official websites and public datasets; see{" "}
            <Link href="/methodology" className="underline">
              methodology
            </Link>{" "}
            for sources and caveats.
          </div>
        </footer>
      </body>
    </html>
  );
}
