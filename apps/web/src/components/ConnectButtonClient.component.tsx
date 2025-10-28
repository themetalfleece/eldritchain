"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectButtonClient() {
  return (
    <ConnectButton
      showBalance={{
        smallScreen: true,
        largeScreen: true,
      }}
      accountStatus={{
        smallScreen: "avatar",
        largeScreen: "full",
      }}
    />
  );
}
