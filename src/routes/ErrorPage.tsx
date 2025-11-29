interface ErrorPageProps {
  message?: string;
}

export const ErrorPage = ({ message }: ErrorPageProps) => {
  return (
    <main>
      <h1>发生错误</h1>
      <p>{message ?? '请求处理失败，请稍后再试。'}</p>
    </main>
  );
};
