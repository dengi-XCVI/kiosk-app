/**
 * Web3/Wallet Configuration
 * 
 * This file configures wagmi and RainbowKit for Web3 wallet connections.
 * Currently supports: Ethereum Mainnet, Polygon, Optimism, Arbitrum, and Base.
 * 
 * The WalletConnect project ID is read from NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
 * environment variable. Get one at https://cloud.walletconnect.com
 * 
 * This configuration is used by the Web3Provider component.
 */

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, polygon, optimism, arbitrum, base } from "wagmi/chains";

/**
 * Wagmi configuration for wallet connections.
 * Includes RainbowKit defaults with SSR support enabled.
 */
export const config = getDefaultConfig({
  appName: "Kiosk",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "YOUR_PROJECT_ID",
  chains: [mainnet, polygon, optimism, arbitrum, base],
  ssr: true,
});
