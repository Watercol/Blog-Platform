import { Routes, Route } from 'react-router-dom';
import { ArticleListPage } from './routes/ArticleListPage';
import { ArticleDetailPage } from './routes/ArticleDetailPage';
import { NotFoundPage } from './routes/NotFoundPage';
import { ErrorPage } from './routes/ErrorPage';
import { useInitialData } from './state/InitialDataContext';

export const App = () => {
  const { state } = useInitialData();

  return (
    <div>
      <header>
        <a href="/">SSR 博客平台</a>
      </header>
      {state.view === 'error' ? <ErrorPage message={state.error?.message} /> : null}
      {state.view === 'not-found' ? <NotFoundPage /> : null}
      <Routes>
        <Route path="/" element={<ArticleListPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
};
