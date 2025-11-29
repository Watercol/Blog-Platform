import http from 'node:http';
import { appConfig } from './config/env';
import { createDependencies, destroyDependencies } from './config/context';
import { createApp } from './app';

const bootstrap = async () => {
  const deps = await createDependencies(appConfig);
  const app = await createApp(appConfig, deps);

  const server = http.createServer(app);

  server.listen(appConfig.http.port, () => {
    // eslint-disable-next-line no-console
    console.log(`SSR Blog listening on http://localhost:${appConfig.http.port}`);
  });

  const gracefulShutdown = async () => {
    // eslint-disable-next-line no-console
    console.log('Shutting down gracefully...');
    server.close(() => {
      destroyDependencies(deps)
        .then(() => process.exit(0))
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error('Error during shutdown', error);
          process.exit(1);
        });
    });
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application', error);
  process.exit(1);
});
