/**
 * Article Reading Page
 *
 * Dynamic route: /article/[articleId]
 *
 * Server Component that fetches a single article by its ID and renders
 * it using the FullArticle component. Shows a 404-style message when
 * the article doesn't exist.
 *
 * Linked from ArticleCard components throughout the app.
 */

import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/getters";
import { auth } from "@/lib/auth";
import FullArticle from "@/components/ui/FullArticle";
import type { TipTapNode } from "@/types/types";
import { headers } from "next/headers";

export default async function ArticlePage({
    params,
}: {
    params: Promise<{ articleId: string }>;
}) {
    const { articleId } = await params;
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    const viewerUserId = session?.user?.id;
    const article = await getArticleById(articleId, viewerUserId);

    /* Article not found → Next.js 404 page */
    if (!article) {
        notFound();
    }

    const isAuthor = viewerUserId === article.user.id;
    const hasPrice = article.price !== null && article.price > 0;
    const shouldShowPurchaseBanner = hasPrice && !isAuthor && !article.hasPurchased;

    return (
        <FullArticle
            title={article.title}
            content={article.content as unknown as TipTapNode}
            thumbnailUrl={article.thumbnailUrl}
            price={article.price}
            createdAt={article.createdAt}
            author={article.user}
            journal={article.journal}
            shouldShowPurchaseBanner={shouldShowPurchaseBanner}
        />
    );
}
