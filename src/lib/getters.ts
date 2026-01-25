import { prisma } from "@/lib/db";

export async function getArticlesByUserId(userId: string) {
    try {
        const articles = await prisma.article.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                thumbnailUrl: true,
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