/**
 * Journal API Routes
 *
 * POST /api/journals          — Create a new journal (caller becomes ADMIN)
 * GET  /api/journals          — List the authenticated user's journal memberships
 *
 * All routes require authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Converts a journal name into a URL-safe slug.
 * e.g. "My Cool Journal!" → "my-cool-journal"
 */
function slugify(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")  // remove non-word chars
        .replace(/\s+/g, "-")      // spaces → dashes
        .replace(/-+/g, "-");      // collapse multiple dashes
}

/**
 * POST /api/journals
 *
 * Creates a new journal and makes the current user its ADMIN.
 *
 * Request body:
 *   - name: string (required) — Display name for the journal
 *   - description: string (optional) — Short description
 *
 * @returns The created journal object
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { name, description } = await req.json();

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Journal name is required" },
                { status: 400 }
            );
        }

        // Generate a unique slug from the name
        let slug = slugify(name);
        const existing = await prisma.journal.findUnique({ where: { slug } });
        if (existing) {
            // Append a short random suffix to make it unique
            slug = `${slug}-${Date.now().toString(36)}`;
        }

        // Create journal + ADMIN membership in a single transaction
        const journal = await prisma.journal.create({
            data: {
                name: name.trim(),
                slug,
                description: description?.trim() || null,
                members: {
                    create: {
                        userId: session.user.id,
                        role: "ADMIN",
                    },
                },
            },
        });

        return NextResponse.json({ journal }, { status: 201 });
    } catch (error) {
        console.error("Error creating journal:", error);
        return NextResponse.json(
            { error: "Failed to create journal" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/journals
 *
 * Returns all journal memberships for the authenticated user.
 * Each entry contains the role and the full journal object.
 * Used by the PublishModal to populate the journal selector.
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const memberships = await prisma.journalMember.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                role: true,
                journal: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        description: true,
                        logoUrl: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
            },
        });

        return NextResponse.json({ memberships });
    } catch (error) {
        console.error("Error fetching journal memberships:", error);
        return NextResponse.json(
            { error: "Failed to fetch journals" },
            { status: 500 }
        );
    }
}
