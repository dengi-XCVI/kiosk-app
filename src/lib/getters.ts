import { prisma } from "@/lib/db";

// ─── Shared select fragments ────────────────────────────────────────────────

/** Reusable Prisma select for journal info on articles */
const journalSelect = {
    select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
    },
} as const;

/** Reusable Prisma select for author info on articles */
const authorSelect = {
    select: {
        id: true,
        name: true,
        image: true,
    },
} as const;

// ─── Article getters ────────────────────────────────────────────────────────

/**
 * Fetches all articles by a specific user, ordered by creation date (newest first).
 * Includes author information and journal info for display in article cards.
 * 
 * @param userId - The ID of the user whose articles to fetch
 * @returns Array of articles with id, title, thumbnailUrl, dates, author and journal info
 *          Returns empty array if user not found or on error
 */
export async function getArticlesByUserId(userId: string) {
    try {
        const articles = await prisma.article.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                price: true,
                createdAt: true,
                updatedAt: true,
                user: authorSelect,
                journal: journalSelect,
            },
        });
        return articles;
    } 
    catch (error) {
        console.error("Error fetching articles by user ID:", error);
        return [];
    }
}

/**
 * Fetches a single article by its ID, including full content for rendering.
 * Includes author info, journal info, and all metadata needed for the article reading page.
 *
 * @param articleId - The ID of the article to fetch
 * @returns Full article object with content, or null if not found
 */
export async function getArticleById(articleId: string) {
    try {
        const article = await prisma.article.findUnique({
            where: { id: articleId },
            select: {
                id: true,
                title: true,
                content: true,
                thumbnailUrl: true,
                price: true,
                createdAt: true,
                updatedAt: true,
                user: authorSelect,
                journal: journalSelect,
            },
        });
        return article;
    } catch (error) {
        console.error("Error fetching article by ID:", error);
        return null;
    }
}

// ─── User getters ───────────────────────────────────────────────────────────

/**
 * Fetches a user's public profile information by their ID.
 * 
 * @param userId - The ID of the user to fetch
 * @returns User object with id, name, image, and email, or null if not found
 */
export async function getUserById(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                image: true,
                email: true,
            },
        });
        return user;
    } catch (error) {
        console.error("Error fetching user by ID:", error);
        return null;
    }
}

// ─── Journal getters ────────────────────────────────────────────────────────

/**
 * Fetches a journal by its unique slug.
 * Includes full metadata for the journal page header.
 *
 * @param slug - The journal's URL slug
 * @returns Journal object or null if not found
 */
export async function getJournalBySlug(slug: string) {
    try {
        const journal = await prisma.journal.findUnique({
            where: { slug },
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                logoUrl: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        return journal;
    } catch (error) {
        console.error("Error fetching journal by slug:", error);
        return null;
    }
}

/**
 * Fetches all articles published under a specific journal, newest first.
 * Used on the /journals/[slug] page.
 *
 * @param journalId - The journal's ID
 * @returns Array of article card data
 */
export async function getArticlesByJournalId(journalId: string) {
    try {
        const articles = await prisma.article.findMany({
            where: { journalId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                price: true,
                createdAt: true,
                updatedAt: true,
                user: authorSelect,
                journal: journalSelect,
            },
        });
        return articles;
    } catch (error) {
        console.error("Error fetching articles by journal ID:", error);
        return [];
    }
}

/**
 * Fetches all journal memberships for a given user.
 * Returns each membership with the full journal attached, used on the
 * /journals/[userId] management page and the PublishModal journal picker.
 *
 * @param userId - The user's ID
 * @returns Array of memberships with journal and role
 */
export async function getJournalMembershipsByUserId(userId: string) {
    try {
        const memberships = await prisma.journalMember.findMany({
            where: { userId },
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
        return memberships;
    } catch (error) {
        console.error("Error fetching journal memberships:", error);
        return [];
    }
}

/**
 * Fetches all members of a specific journal.
 * Used on the journal management page to show/manage writers.
 *
 * @param journalId - The journal's ID
 * @returns Array of member entries with user info and role
 */
export async function getJournalMembers(journalId: string) {
    try {
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
        return members;
    } catch (error) {
        console.error("Error fetching journal members:", error);
        return [];
    }
}