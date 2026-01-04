"use client";

import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const customTheme = lightTheme({
  accentColor: "white",
  accentColorForeground: "black",
  borderRadius: "medium",
});

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={{
          ...customTheme,
          colors: {
            ...customTheme.colors,
            connectButtonBackground: "white",
            connectButtonText: "black",
            connectButtonInnerBackground: "white",
          },
          shadows: {
            ...customTheme.shadows,
            connectButton: "0 0 0 1px black",
          },
        }}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
