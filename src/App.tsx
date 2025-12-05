import { Routes, Route, Link } from 'react-router-dom';
import { Layout, Alert } from 'antd';
import { ArticleListPage } from './routes/ArticleListPage';
import { ArticleDetailPage } from './routes/ArticleDetailPage';
import { ArticleCreatePage } from './routes/ArticleCreatePage';
import { NotFoundPage } from './routes/NotFoundPage'; 
import { useInitialData } from './state/InitialDataContext';

const { Header, Content } = Layout;

export const App = () => {
  const { state } = useInitialData();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#001529',
          height: 64,
          padding: '0 24px'
        }}
      >
        <Link
          to="/"
          style={{
            color: '#fff',
            textDecoration: 'none',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
          }}
        >
          <h3
            style={{
              color: '#fff',
              margin: 0,
              fontSize: '24px',
              fontWeight: 600,
              lineHeight: 1.35,
            }}
          >
            SSR 博客平台
          </h3>
        </Link>
      </Header>
      <Content style={{ background: '#f5f5f5', padding: '24px 16px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          {state.view === 'error' ? (
            <div style={{ marginBottom: 16 }}>
              <Alert type="error" title={state.error?.message ?? '服务器渲染出错，请刷新重试。'} />
            </div>
          ) : null}
          <Routes>
            <Route path="/" element={<ArticleListPage />} />
            <Route path="/articles/new" element={<ArticleCreatePage />} />
            <Route path="/articles/:slug" element={<ArticleDetailPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </Content>
    </Layout>
  );
};
