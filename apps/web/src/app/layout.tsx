import { Footer } from "@/components/Footer.component";
import { Providers } from "@/components/Providers.component";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eldritchain - Daily Creature Summoning",
  description: "Summon eldritch creatures once per day on the blockchain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex flex-col">
        <Providers>
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
