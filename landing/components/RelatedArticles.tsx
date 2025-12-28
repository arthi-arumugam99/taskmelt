import Link from "next/link";

interface RelatedArticle {
  href: string;
  title: string;
  description: string;
}

interface RelatedArticlesProps {
  articles: RelatedArticle[];
}

export default function RelatedArticles({ articles }: RelatedArticlesProps) {
  return (
    <div className="mt-16 pt-8 border-t-4 border-taskmelt-black">
      <h2 className="text-3xl font-black mb-6">Related Articles</h2>
      <div className="grid gap-6 md:grid-cols-2 mb-12">
        {articles.map((article) => (
          <Link
            key={article.href}
            href={article.href}
            className="taskmelt-border p-6 hover:bg-taskmelt-peach transition-colors"
          >
            <h3 className="text-xl font-bold mb-2">{article.title}</h3>
            <p className="text-taskmelt-gray">{article.description}</p>
          </Link>
        ))}
      </div>
      <Link href="/blog" className="text-taskmelt-black font-bold text-lg hover:underline">
        ← Back to all articles
      </Link>
    </div>
  );
}
