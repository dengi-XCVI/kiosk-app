import { getArticlesByUserId, getUserById } from '@/lib/getters';
import ArticleCard from '@/components/ui/Article';
import { Article } from '@/types/types';

export default async function UserProfilePage({
    params,
}: {
    params: Promise<{ userId: string }>
}) {
    const { userId } = await params;
    const [articles, user] = await Promise.all([
        getArticlesByUserId(userId),
        getUserById(userId),
    ]);

    if (!user) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <p className="text-center text-gray-500">User not found.</p>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            {/* User Header */}
            <div className="mb-8 flex items-center gap-4">
                {user.image ? (
                    <img
                        src={user.image}
                        alt={user.name || "User"}
                        className="h-16 w-16 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-300 text-2xl text-gray-600">
                        {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user.name || "Anonymous"}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {articles.length} {articles.length === 1 ? "article" : "articles"}
                    </p>
                </div>
            </div>

            {/* Articles Grid */}
            {articles && articles.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article: Article) => (
                        <ArticleCard 
                            key={article.id} 
                            article={article} 
                            showAuthor={false} 
                        />
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">No articles published yet.</p>
            )}
        </div>
    );
}