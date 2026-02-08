/**
 * ArticleCard Component
 * 
 * A reusable card component for displaying article previews.
 * Shows thumbnail image, title, publication date, and optionally the author.
 * 
 * Used in:
 * - User profile pages (without author, since it's implied)
 * - Home page article feed (with author)
 * - Search results
 */

import Link from "next/link";
import { Article as ArticleType } from "@/types/types";

interface ArticleCardProps {
    /** The article data to display */
    article: ArticleType;
    /** Whether to show the author section (default: true) */
    showAuthor?: boolean;
}

/**
 * Formats a Date object to a human-readable string.
 * Example: "Jan 25, 2026"
 * 
 * @param date - The date to format
 * @returns Formatted date string
 */
function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function ArticleCard({ article, showAuthor = true }: ArticleCardProps) {
    return (
        <Link href={`/article/${article.id}`} className="group block">
            <article className="overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md">
                {/* Thumbnail */}
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                    {article.thumbnailUrl ? (
                        <img
                            src={article.thumbnailUrl}
                            alt={article.title}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200">
                            <span className="text-4xl text-gray-400">📄</span>
                        </div>
                    )}

                    {/* Price Badge */}
                    {article.price ? (
                        <span className="absolute top-2 right-2 bg-black/80 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            ${article.price}
                        </span>
                    ) : (
                        <span className="absolute top-2 right-2 bg-green-600/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
                            Free
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <h2 className="text-lg font-semibold text-gray-900 line-clamp-2 group-hover:text-gray-600">
                        {article.title}
                    </h2>

                    {/* Date */}
                    <p className="mt-1 text-sm text-gray-500">
                        {formatDate(article.createdAt)}
                    </p>

                    {/* Author */}
                    {showAuthor && article.user && (
                        <div className="mt-3 flex items-center gap-2">
                            {article.user.image ? (
                                <img
                                    src={article.user.image}
                                    alt={article.user.name || "Author"}
                                    className="h-6 w-6 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-300 text-xs text-gray-600">
                                    {article.user.name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                            )}
                            <span className="text-sm text-gray-600">
                                {article.user.name || "Anonymous"}
                            </span>
                        </div>
                    )}

                    {/* Journal badge */}
                    {article.journal && (
                        <Link
                            href={`/journals/${article.journal.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-2 inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                            {article.journal.logoUrl ? (
                                <img
                                    src={article.journal.logoUrl}
                                    alt={article.journal.name}
                                    className="h-4 w-4 rounded-full object-cover"
                                />
                            ) : (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                                    {article.journal.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                            {article.journal.name}
                        </Link>
                    )}
                </div>
            </article>
        </Link>
    );
}