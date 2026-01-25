/**
 * Authentication Client (Client-Side)
 * 
 * This file exports the better-auth client for use in React components.
 * Provides hooks like useSession() for checking auth state.
 * 
 * Usage:
 *   import { authClient } from "@/lib/auth-client";
 *   const { data: session } = authClient.useSession();
 *   await authClient.signIn.email({ email, password });
 *   await authClient.signIn.social({ provider: "google" });
 *   await authClient.signOut();
 */

import { createAuthClient } from "better-auth/react"

/**
 * Auth client instance for client-side authentication operations.
 * Automatically handles session cookies and token refresh.
 */
export const authClient = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: "http://localhost:3000"
})