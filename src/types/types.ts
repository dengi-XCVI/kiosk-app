/**
 * Type Definitions
 * 
 * This file contains TypeScript interfaces used throughout the application.
 * Keep types here that are shared across multiple components/pages.
 */

/**
 * User type for search results and basic user display.
 */
export interface User {
    name: string | null;
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Minimal author info included with articles.
 * Used when displaying article cards.
 */
export interface ArticleAuthor {
    id: string;
    name: string | null;
    image: string | null;
}

/**
 * Article type for listing/card display.
 * Does not include full content - just metadata for previews.
 */
export interface Article {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    /** Price in USD (1-5), null means free */
    price: number | null;
    createdAt: Date;
    updatedAt: Date;
    user: ArticleAuthor;
}

/**
 * Full article type for the reading view.
 * Includes the TipTap JSON content for rendering.
 */
export interface FullArticle extends Article {
    /** TipTap JSON content tree */
    content: TipTapNode;
}

// ─── TipTap JSON Content Types ───────────────────────────────────────────────

/**
 * A mark applied to inline text (bold, italic, link, etc.).
 */
export interface TipTapMark {
    type: string;
    attrs?: Record<string, any>;
}

/**
 * Recursive node structure produced by TipTap's `editor.getJSON()`.
 * Every block (paragraph, heading, image, list, etc.) is a TipTapNode.
 */
export interface TipTapNode {
    type: string;
    attrs?: Record<string, any>;
    content?: TipTapNode[];
    text?: string;
    marks?: TipTapMark[];
}