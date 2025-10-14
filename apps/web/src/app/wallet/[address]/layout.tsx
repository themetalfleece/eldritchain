import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { address: string };
}): Promise<Metadata> {
  return {
    title: `Wallet ${params.address.slice(0, 6)}...${params.address.slice(-4)} - Eldritchain`,
    description: `View the Eldritchain creature collection for wallet ${params.address}`,
  };
}

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  return children;
}
