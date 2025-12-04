import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared')
    }
  },
  build: {
    outDir: isSsrBuild ? 'dist/ssr' : 'dist/client',
    emptyOutDir: false,
    manifest: !isSsrBuild,
    rollupOptions: {
      input: isSsrBuild ? 'src/entries/server.tsx' : 'src/entries/client.tsx'
    }
  },
  ssr: {
    noExternal: ['react-router-dom', 'antd', '@ant-design/icons', '@ant-design/cssinjs']
  }
}));
