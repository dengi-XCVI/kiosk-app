import { prisma } from "@/lib/db";

export async function getArticlesByUserId(userId: string) {
    try {
        const articles = await prisma.article.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });
        return articles;
    } 
    catch (error) {
        console.error("Error fetching articles by user ID:", error);
        return [];
    }
}