import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;

  return {
    title: `Wallet ${address.slice(0, 6)}...${address.slice(-4)} - Eldritchain`,
    description: `View the Eldritchain creature collection for wallet ${address}`,
  };
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
