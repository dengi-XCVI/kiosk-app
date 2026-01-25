/**
 * Authentication Configuration (Server-Side)
 * 
 * This file configures better-auth for the application.
 * It sets up:
 * - Database connection via Prisma adapter
 * - Email/password authentication
 * - Social OAuth providers (Google, GitHub)
 * - Account linking (same email = same account across providers)
 * 
 * @see https://better-auth.com for documentation
 */

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

/**
 * The main auth instance used throughout the application.
 * Use `auth.api.getSession()` on the server to get the current session.
 */
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        },
    },
    // Enable account linking so if someone signs in with 
    // the same email on Google AND GitHub, they share one account.
    account: {
        accountLinking: {
            enabled: true,
        }
    }
});