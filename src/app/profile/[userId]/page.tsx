import { getArticlesByUserId } from '@/lib/getters';
import Article from '@/components/ui/Article';

export default async function UserProfilePage({
      params,
    }: {
    params: Promise<{ userId: string }>
    }) {
    const { userId } = await params;
    const articles = await getArticlesByUserId(userId);

    return (
        <>
        <div>
            {articles && articles.length > 0 ? (
                <ul>
                    {articles.map((article: any) => (
                        <Article article={article} key={article.id} />
                    ))}
                </ul>
            ) : (
                <p>No articles found for this user.</p>
            )}
        </div>
        </>
    );
    }