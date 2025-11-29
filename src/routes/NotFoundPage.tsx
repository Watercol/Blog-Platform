import { Link } from 'react-router-dom';

export const NotFoundPage = () => {
  return (
    <main>
      <h1>页面不存在</h1>
      <p>很抱歉，您访问的页面不存在或已被移除。</p>
      <Link className="button" to="/">
        返回首页
      </Link>
    </main>
  );
};
