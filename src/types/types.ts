export interface User {
    name: string | null;
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ArticleAuthor {
    id: string;
    name: string | null;
    image: string | null;
}

export interface Article {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: ArticleAuthor;
}