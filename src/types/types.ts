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
    createdAt: Date;
    updatedAt: Date;
    user: ArticleAuthor;
}