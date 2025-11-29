import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ArticleSummary } from '@shared/types';

interface ArticleCardProps {
  article: ArticleSummary;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <div className="article-card">
      <h2>
        <Link to={`/articles/${article.slug}`}>{article.title}</Link>
      </h2>
      <div className="article-meta">
        <span>作者：{article.author}</span>
        {article.publishedAt ? <span> · 发布于 {dayjs(article.publishedAt).format('YYYY年MM月DD日')}</span> : null}
        <span> · 预计阅读 {article.readingMinutes} 分钟</span>
      </div>
      <p>{article.excerpt}</p>
      <div>
        {article.tags.map((tag) => (
          <Link className="tag-pill" key={tag.id} to={`/?tag=${tag.slug}`}>
            #{tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
};
