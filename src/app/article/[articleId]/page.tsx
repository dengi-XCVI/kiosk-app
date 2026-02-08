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
import FullArticle from "@/components/ui/FullArticle";
import type { TipTapNode } from "@/types/types";

export default async function ArticlePage({
    params,
}: {
    params: Promise<{ articleId: string }>;
}) {
    const { articleId } = await params;
    const article = await getArticleById(articleId);

    /* Article not found → Next.js 404 page */
    if (!article) {
        notFound();
    }

    return (
        <FullArticle
            title={article.title}
            content={article.content as unknown as TipTapNode}
            thumbnailUrl={article.thumbnailUrl}
            price={article.price}
            createdAt={article.createdAt}
            author={article.user}
        />
    );
}
