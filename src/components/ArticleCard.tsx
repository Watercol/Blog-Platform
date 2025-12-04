import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Card, Space, Tag, Typography } from 'antd';
import type { ArticleSummary } from '@shared/types';

interface ArticleCardProps {
  article: ArticleSummary;
}

export const ArticleCard = ({ article }: ArticleCardProps) => {
  return (
    <Card
      title={
        <Typography.Title level={3} style={{ margin: 0 }}>
          <Link to={`/articles/${article.slug}`}>{article.title}</Link>
        </Typography.Title>
      }
      style={
        {
          width: "100%",
          minHeight: 170,
        }
      }
    >
      <Space size="middle" style={{ width: '100%' }} orientation="vertical">
        <Typography.Text type="secondary">
          作者：{article.author}
          {article.publishedAt
            ? ` · 发布于 ${dayjs(article.publishedAt).format('YYYY年MM月DD日')}`
            : ''}
          · 预计阅读 {article.readingMinutes} 分钟
        </Typography.Text>
        <Typography.Paragraph ellipsis={{ rows: 3 }}>{article.excerpt}</Typography.Paragraph>
        <Space size={[8, 8]} wrap>
          {article.tags.map((tag) => (
            <Tag key={tag.id}>
              <Link to={`/?tag=${tag.slug}`}>#{tag.name}</Link>
            </Tag>
          ))}
        </Space>
      </Space>
    </Card>
  );
};
