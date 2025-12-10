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
    <Layout style={{ minHeight: '100vh' }} className="hydration-guard">
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          background: '#001529',
          height: 64,
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 1000
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
              minHeight: '1.35em' // 预设高度防止文本重排
            }}
          >
            SSR 博客平台
          </h3>
        </Link>
      </Header>
      <Content 
        style={{ 
          background: '#f5f5f5', 
          padding: '24px 16px',
          flex: 1,
          minHeight: 'calc(100vh - 64px)' // 预设内容区域高度
        }}
        className="content-area"
      >
        <div style={{ 
          maxWidth: 960, 
          margin: '0 auto',
          minHeight: '400px' // 预设最小高度
        }}>
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