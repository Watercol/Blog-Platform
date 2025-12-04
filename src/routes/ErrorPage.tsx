import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';

interface ErrorPageProps {
  message?: string;
}

export const ErrorPage = ({ message }: ErrorPageProps) => {
  return (
    <Result
      status="error"
      title="发生错误"
      subTitle={message ?? '请求处理失败，请稍后再试。'}
      extra={
        <Link to="/">
          <Button type="primary">返回首页</Button>
        </Link>
      }
    />
  );
};
