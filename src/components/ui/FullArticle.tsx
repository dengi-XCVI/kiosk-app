/**
 * FullArticle Component
 *
 * Renders a complete article for the reading view at /article/[articleId].
 * Converts the TipTap JSON content tree into React elements so the article
 * looks the same as it did in the editor (headings, bold, italic, images,
 * lists, blockquotes, code blocks, horizontal rules, etc.).
 *
 * Layout (top → bottom):
 *  1. Thumbnail hero image (full-width, if present)
 *  2. Title
 *  3. Author row (avatar + name + date + price badge)
 *  4. Rendered article body
 */

import React from "react";
import Link from "next/link";
import type { TipTapNode, TipTapMark } from "@/types/types";

// ─── Public props ────────────────────────────────────────────────────────────

interface FullArticleProps {
    /** Article title */
    title: string;
    /** TipTap JSON root node */
    content: TipTapNode;
    /** Optional hero thumbnail URL */
    thumbnailUrl: string | null;
    /** Price in USD (1-5) or null for free */
    price: number | null;
    /** Publication date */
    createdAt: Date;
    /** Author info */
    author: {
        id: string;
        name: string | null;
        image: string | null;
    };
    /** Journal info, if published under a journal */
    journal: {
        id: string;
        name: string;
        slug: string;
        logoUrl: string | null;
    } | null;
    /** Whether to show the paid-access banner to the current viewer */
    shouldShowPurchaseBanner?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Formats a Date to a human-readable string, e.g. "Feb 8, 2026".
 */
function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * Returns a Tailwind text-align class based on a TipTap textAlign attr value.
 */
function alignmentClass(align?: string): string {
    switch (align) {
        case "center":
            return "text-center";
        case "right":
            return "text-right";
        case "justify":
            return "text-justify";
        default:
            return "text-left";
    }
}

// ─── Mark renderer ───────────────────────────────────────────────────────────

/**
 * Wraps `children` in the appropriate inline element for each TipTap mark.
 * Marks are applied inside-out (first mark = outermost wrapper).
 */
function applyMarks(
    children: React.ReactNode,
    marks?: TipTapMark[]
): React.ReactNode {
    if (!marks || marks.length === 0) return children;

    return marks.reduceRight<React.ReactNode>((wrapped, mark) => {
        switch (mark.type) {
            case "bold":
                return <strong>{wrapped}</strong>;
            case "italic":
                return <em>{wrapped}</em>;
            case "strike":
                return <s>{wrapped}</s>;
            case "underline":
                return <u>{wrapped}</u>;
            case "code":
                return (
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-pink-600">
                        {wrapped}
                    </code>
                );
            case "link":
                return (
                    <a
                        href={mark.attrs?.href}
                        target={mark.attrs?.target ?? "_blank"}
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                    >
                        {wrapped}
                    </a>
                );
            case "highlight":
                return (
                    <mark className="bg-yellow-200 px-0.5 rounded">
                        {wrapped}
                    </mark>
                );
            case "subscript":
                return <sub>{wrapped}</sub>;
            case "superscript":
                return <sup>{wrapped}</sup>;
            default:
                return wrapped;
        }
    }, children);
}

// ─── Node renderer ───────────────────────────────────────────────────────────

/**
 * Recursively converts a single TipTap JSON node into a React element.
 * Handles all node types produced by the extensions listed in spec.md.
 *
 * @param node  - The TipTap JSON node to render
 * @param index - Sibling index (used as React key)
 */
function renderNode(node: TipTapNode, index: number): React.ReactNode {
    const key = index;

    // --- Inline text node ------------------------------------------------
    if (node.type === "text") {
        return (
            <React.Fragment key={key}>
                {applyMarks(node.text ?? "", node.marks)}
            </React.Fragment>
        );
    }

    // --- Children helper (renders node.content recursively) ---------------
    const children = node.content?.map((child, i) => renderNode(child, i));

    switch (node.type) {
        // ── Document root ────────────────────────────────────────────────
        case "doc":
            return <React.Fragment key={key}>{children}</React.Fragment>;

        // ── Paragraph ────────────────────────────────────────────────────
        case "paragraph":
            return (
                <p
                    key={key}
                    className={`mb-4 leading-relaxed ${alignmentClass(node.attrs?.textAlign)}`}
                >
                    {children}
                </p>
            );

        // ── Headings ─────────────────────────────────────────────────────
        case "heading": {
            const level = node.attrs?.level ?? 2;
            const align = alignmentClass(node.attrs?.textAlign);
            const headingStyles: Record<number, string> = {
                1: `text-3xl font-bold mt-10 mb-4 ${align}`,
                2: `text-2xl font-bold mt-8 mb-3 ${align}`,
                3: `text-xl font-semibold mt-6 mb-2 ${align}`,
                4: `text-lg font-semibold mt-5 mb-2 ${align}`,
                5: `text-base font-semibold mt-4 mb-1 ${align}`,
                6: `text-sm font-semibold mt-4 mb-1 uppercase tracking-wide ${align}`,
            };
            const cls = headingStyles[level] ?? headingStyles[2];
            switch (level) {
                case 1: return <h1 key={key} className={cls}>{children}</h1>;
                case 3: return <h3 key={key} className={cls}>{children}</h3>;
                case 4: return <h4 key={key} className={cls}>{children}</h4>;
                case 5: return <h5 key={key} className={cls}>{children}</h5>;
                case 6: return <h6 key={key} className={cls}>{children}</h6>;
                default: return <h2 key={key} className={cls}>{children}</h2>;
            }
        }

        // ── Image ────────────────────────────────────────────────────────
        case "image":
            return (
                <figure key={key} className="my-6">
                    <img
                        src={node.attrs?.src}
                        alt={node.attrs?.alt ?? ""}
                        title={node.attrs?.title ?? undefined}
                        className="mx-auto max-w-full rounded-lg"
                    />
                    {node.attrs?.alt && (
                        <figcaption className="mt-2 text-center text-sm text-gray-500">
                            {node.attrs.alt}
                        </figcaption>
                    )}
                </figure>
            );

        // ── Blockquote ───────────────────────────────────────────────────
        case "blockquote":
            return (
                <blockquote
                    key={key}
                    className="my-4 border-l-4 border-gray-300 pl-4 italic text-gray-700"
                >
                    {children}
                </blockquote>
            );

        // ── Code block ───────────────────────────────────────────────────
        case "codeBlock":
            return (
                <pre
                    key={key}
                    className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100 font-mono"
                >
                    <code>{children}</code>
                </pre>
            );

        // ── Bullet list ──────────────────────────────────────────────────
        case "bulletList":
            return (
                <ul key={key} className="mb-4 list-disc pl-6 space-y-1">
                    {children}
                </ul>
            );

        // ── Ordered list ─────────────────────────────────────────────────
        case "orderedList":
            return (
                <ol
                    key={key}
                    start={node.attrs?.start ?? 1}
                    className="mb-4 list-decimal pl-6 space-y-1"
                >
                    {children}
                </ol>
            );

        // ── List item ────────────────────────────────────────────────────
        case "listItem":
            return (
                <li key={key} className="leading-relaxed">
                    {children}
                </li>
            );

        // ── Task list ────────────────────────────────────────────────────
        case "taskList":
            return (
                <ul key={key} className="mb-4 space-y-1 list-none pl-0">
                    {children}
                </ul>
            );

        // ── Task item ────────────────────────────────────────────────────
        case "taskItem":
            return (
                <li key={key} className="flex items-start gap-2">
                    <input
                        type="checkbox"
                        checked={node.attrs?.checked ?? false}
                        readOnly
                        className="mt-1.5 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1">{children}</div>
                </li>
            );

        // ── Horizontal rule ──────────────────────────────────────────────
        case "horizontalRule":
            return <hr key={key} className="my-8 border-gray-200" />;

        // ── Hard break ───────────────────────────────────────────────────
        case "hardBreak":
            return <br key={key} />;

        // ── Fallback for unknown node types ──────────────────────────────
        default:
            if (children) {
                return (
                    <div key={key} className="mb-4">
                        {children}
                    </div>
                );
            }
            return null;
    }
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function FullArticle({
    title,
    content,
    thumbnailUrl,
    price,
    createdAt,
    author,
    journal,
    shouldShowPurchaseBanner = false,
}: FullArticleProps) {
    
    

    return (
        <article className="mx-auto max-w-3xl px-4 py-8">
            {/* ── Title ───────────────────────────────────────────────── */}
            <h1 className="text-4xl font-bold text-gray-900 leading-tight mb-4">
                {title}
            </h1>

            {/* ── Journal badge (above author row) ───────────────────── */}
            {journal && (
                <Link
                    href={`/journals/${journal.slug}`}
                    className="mb-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                    {journal.logoUrl ? (
                        <img
                            src={journal.logoUrl}
                            alt={journal.name}
                            className="h-5 w-5 rounded-full object-cover"
                        />
                    ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                            {journal.name.charAt(0).toUpperCase()}
                        </span>
                    )}
                    Published in {journal.name}
                </Link>
            )}

            {/* ── Author row ──────────────────────────────────────────── */}
            <div className="mb-6 flex items-center gap-3">
                {/* Avatar */}
                <Link href={`/profile/${author.id}`}>
                    {author.image ? (
                        <img
                            src={author.image}
                            alt={author.name || "Author"}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300 text-sm font-medium text-gray-600">
                            {author.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                    )}
                </Link>

                {/* Name & date */}
                <div className="flex-1">
                    <Link
                        href={`/profile/${author.id}`}
                        className="font-medium text-gray-900 hover:underline"
                    >
                        {author.name || "Anonymous"}
                    </Link>
                    <p className="text-sm text-gray-500">{formatDate(createdAt)}</p>
                </div>

                {/* Price badge */}
                {price ? (
                    <span className="rounded-full bg-black px-3 py-1 text-sm font-semibold text-white">
                        ${price}
                    </span>
                ) : (
                    <span className="rounded-full bg-green-600 px-3 py-1 text-sm font-semibold text-white">
                        Free
                    </span>
                )}
            </div>

            {/* ── Thumbnail (below title, constrained size) ───────────── */}
            {thumbnailUrl && (
                <div className="mb-8 border-b border-gray-200 pb-8">
                    <img
                        src={thumbnailUrl}
                        alt={title}
                        className="w-full max-h-[360px] object-cover rounded-lg"
                    />
                </div>
            )}

            {/* ── Paid-access banner (below thumbnail, hides only body) ─ */}
            {shouldShowPurchaseBanner && price && (
                <section className="mb-8 rounded-lg border border-amber-300 bg-amber-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold text-amber-800">
                                Premium article
                            </p>
                            <p className="text-sm text-amber-900">
                                Unlock this article for ${price}.
                            </p>
                        </div>
                        <button
                            
                            type="button"
                            className="inline-flex items-center justify-center rounded-md bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                            aria-label={`Pay $${price} to unlock article`}
                            title="Payment flow coming soon"
                        >
                            Pay ${price}
                        </button>
                    </div>
                </section>
            )}

            {/* ── Article body (rendered TipTap JSON) ─────────────────── */}
            {!shouldShowPurchaseBanner && (
                <div className="prose-custom text-gray-800 text-lg leading-relaxed">
                    {renderNode(content, 0)}
                </div>
            )}
        </article>
    );
}
