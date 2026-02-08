import { prisma } from "@/lib/db";

/**
 * Fetches all articles by a specific user, ordered by creation date (newest first).
 * Includes author information for display in article cards.
 * 
 * @param userId - The ID of the user whose articles to fetch
 * @returns Array of articles with id, title, thumbnailUrl, dates, and author info
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
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
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

/**
 * Fetches a single article by its ID, including full content for rendering.
 * Includes author info and all metadata needed for the article reading page.
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
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });
        return article;
    } catch (error) {
        console.error("Error fetching article by ID:", error);
        return null;
    }
}