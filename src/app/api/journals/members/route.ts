/**
 * Journal Members API Routes
 *
 * POST   /api/journals/members — Add a writer to a journal (ADMIN only)
 * DELETE /api/journals/members — Remove a member from a journal (ADMIN only)
 * PATCH  /api/journals/members — Change a member's role (ADMIN only)
 *
 * All routes require authentication and ADMIN role in the target journal.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { headers } from "next/headers";

/**
 * Checks whether the given user is an ADMIN of the given journal.
 * Returns the membership record if true, null otherwise.
 */
async function requireAdmin(userId: string, journalId: string) {
    return prisma.journalMember.findFirst({
        where: { userId, journalId, role: "ADMIN" },
    });
}

/**
 * POST /api/journals/members
 *
 * Adds a user to a journal as a WRITER.
 * Only an ADMIN of the journal can perform this action.
 *
 * Request body:
 *   - journalId: string — The journal to add the member to
 *   - userEmail: string — Email of the user to add
 */
export async function POST(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { journalId, userEmail } = await req.json();

        if (!journalId || !userEmail) {
            return NextResponse.json(
                { error: "journalId and userEmail are required" },
                { status: 400 }
            );
        }

        // Verify caller is an ADMIN of this journal
        const adminMembership = await requireAdmin(session.user.id, journalId);
        if (!adminMembership) {
            return NextResponse.json(
                { error: "Only journal admins can add members" },
                { status: 403 }
            );
        }

        // Find the target user by email
        const targetUser = await prisma.user.findUnique({
            where: { email: userEmail },
            select: { id: true, name: true, email: true },
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: "User not found with that email" },
                { status: 404 }
            );
        }

        // Check if already a member
        const existingMember = await prisma.journalMember.findUnique({
            where: { userId_journalId: { userId: targetUser.id, journalId } },
        });

        if (existingMember) {
            return NextResponse.json(
                { error: "User is already a member of this journal" },
                { status: 409 }
            );
        }

        // Create the membership
        const member = await prisma.journalMember.create({
            data: {
                userId: targetUser.id,
                journalId,
                role: "WRITER",
            },
            select: {
                id: true,
                role: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json({ member }, { status: 201 });
    } catch (error) {
        console.error("Error adding journal member:", error);
        return NextResponse.json(
            { error: "Failed to add member" },
            { status: 500 }
        );
    }
}

/**
 * GET /api/journals/members?journalId=xxx
 *
 * Returns all members of a journal.
 * Only ADMIN members can view the member list.
 */
export async function GET(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const journalId = req.nextUrl.searchParams.get("journalId");
        if (!journalId) {
            return NextResponse.json(
                { error: "journalId query parameter is required" },
                { status: 400 }
            );
        }

        // Verify caller is an ADMIN
        const adminMembership = await requireAdmin(session.user.id, journalId);
        if (!adminMembership) {
            return NextResponse.json(
                { error: "Only journal admins can view members" },
                { status: 403 }
            );
        }

        const members = await prisma.journalMember.findMany({
            where: { journalId },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                role: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json({ members });
    } catch (error) {
        console.error("Error fetching journal members:", error);
        return NextResponse.json(
            { error: "Failed to fetch members" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/journals/members
 *
 * Removes a member from a journal.
 * Only an ADMIN of the journal can perform this action.
 * An admin cannot remove themselves (prevents orphaned journals).
 *
 * Request body:
 *   - journalId: string
 *   - memberId: string — The JournalMember record ID to remove
 */
export async function DELETE(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { journalId, memberId } = await req.json();

        if (!journalId || !memberId) {
            return NextResponse.json(
                { error: "journalId and memberId are required" },
                { status: 400 }
            );
        }

        // Verify caller is an ADMIN
        const adminMembership = await requireAdmin(session.user.id, journalId);
        if (!adminMembership) {
            return NextResponse.json(
                { error: "Only journal admins can remove members" },
                { status: 403 }
            );
        }

        // Prevent self-removal
        if (memberId === adminMembership.id) {
            return NextResponse.json(
                { error: "Admins cannot remove themselves" },
                { status: 400 }
            );
        }

        await prisma.journalMember.delete({
            where: { id: memberId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error removing journal member:", error);
        return NextResponse.json(
            { error: "Failed to remove member" },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/journals/members
 *
 * Changes a member's role (ADMIN ↔ WRITER).
 * Only an ADMIN of the journal can perform this action.
 *
 * Request body:
 *   - journalId: string
 *   - memberId: string — The JournalMember record ID to update
 *   - role: "ADMIN" | "WRITER"
 */
export async function PATCH(req: NextRequest) {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { journalId, memberId, role } = await req.json();

        if (!journalId || !memberId || !role) {
            return NextResponse.json(
                { error: "journalId, memberId, and role are required" },
                { status: 400 }
            );
        }

        if (role !== "ADMIN" && role !== "WRITER") {
            return NextResponse.json(
                { error: "Role must be ADMIN or WRITER" },
                { status: 400 }
            );
        }

        // Verify caller is an ADMIN
        const adminMembership = await requireAdmin(session.user.id, journalId);
        if (!adminMembership) {
            return NextResponse.json(
                { error: "Only journal admins can change roles" },
                { status: 403 }
            );
        }

        const updated = await prisma.journalMember.update({
            where: { id: memberId },
            data: { role },
            select: {
                id: true,
                role: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                    },
                },
            },
        });

        // If no admins remain after this change, delete the journal entirely
        const adminCount = await prisma.journalMember.count({
            where: { journalId, role: "ADMIN" },
        });

        if (adminCount === 0) {
            // Remove all members, unlink articles, then delete the journal
            await prisma.$transaction([
                prisma.journalMember.deleteMany({ where: { journalId } }),
                prisma.article.updateMany({ where: { journalId }, data: { journalId: null } }),
                prisma.journal.delete({ where: { id: journalId } }),
            ]);

            return NextResponse.json({ member: updated, deleted: true });
        }

        return NextResponse.json({ member: updated, deleted: false });
    } catch (error) {
        console.error("Error updating journal member role:", error);
        return NextResponse.json(
            { error: "Failed to update member role" },
            { status: 500 }
        );
    }
}
