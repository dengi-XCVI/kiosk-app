/**
 * Journal Public Page
 *
 * Route: /journals/[slug]
 *
 * Server component that displays a journal's public page:
 * - Journal header (name, description, logo)
 * - Grid of articles published under this journal
 *
 * Uses getJournalBySlug and getArticlesByJournalId server-side getters.
 */

import { notFound } from "next/navigation";
import { getJournalBySlug, getArticlesByJournalId } from "@/lib/getters";
import ArticleCard from "@/components/ui/Article";
import type { Article } from "@/types/types";

export default async function JournalPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const journal = await getJournalBySlug(slug);

    /* Journal not found → Next.js 404 page */
    if (!journal) {
        notFound();
    }

    /* Fetch articles belonging to this journal */
    const articles = await getArticlesByJournalId(journal.id);

    return (
        <div className="mx-auto max-w-4xl px-4 py-12">
            {/* ── Journal header ──────────────────────────────────────── */}
            <div className="mb-10 text-center">
                {/* Logo */}
                {journal.logoUrl ? (
                    <img
                        src={journal.logoUrl}
                        alt={journal.name}
                        className="mx-auto mb-4 h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    />
                ) : (
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-600">
                        {journal.name.charAt(0).toUpperCase()}
                    </div>
                )}

                <h1 className="text-3xl font-bold text-gray-900">{journal.name}</h1>

                {journal.description && (
                    <p className="mt-2 text-gray-500 max-w-lg mx-auto">
                        {journal.description}
                    </p>
                )}

                <p className="mt-3 text-sm text-gray-400">
                    {articles.length} {articles.length === 1 ? "article" : "articles"} published
                </p>
            </div>

            {/* ── Articles grid ───────────────────────────────────────── */}
            {articles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <p>No articles published yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => (
                        <ArticleCard
                            key={article.id}
                            article={article as Article}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
