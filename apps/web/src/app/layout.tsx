import { Providers } from "@/components/Providers.component";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eldrichain - Daily Creature Summoning",
  description: "Summon eldritch creatures once per day on the blockchain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
