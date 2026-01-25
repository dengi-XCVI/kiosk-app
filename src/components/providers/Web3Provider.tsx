/**
 * Web3Provider Component
 * 
 * Wraps the application with all necessary providers for Web3 functionality:
 * - WagmiProvider: Core Web3 state management
 * - QueryClientProvider: TanStack Query for data fetching
 * - RainbowKitProvider: Wallet connection UI
 * 
 * This component should wrap the entire app in the root layout.
 * Configured with a custom light theme matching the app's design.
 */

"use client";

import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

/** TanStack Query client for caching Web3 data */
const queryClient = new QueryClient();

/** Custom RainbowKit theme with white/black color scheme */
const customTheme = lightTheme({
  accentColor: "white",
  accentColorForeground: "black",
  borderRadius: "medium",
});

/**
 * Provider component that enables Web3 wallet connections throughout the app.
 * 
 * @param children - Child components that need Web3 access
 */
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
