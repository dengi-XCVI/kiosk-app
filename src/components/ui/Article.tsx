interface ArticleProps {
    article: {
        id: string;
        title: string;
    };
}

export default function Article({ article }: ArticleProps) {
    return (
        <>
        <li key={article.id}>
            <h2>{article.title}</h2>
        </li>
        </>
    );
}