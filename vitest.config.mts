// .mts extension is intentional. Vitest + Vite 8 bundle Rolldown for worker
// threads which require ESM loading. Renaming to .ts breaks the runner since
// package.json has no "type": "module" (Next.js requires CJS for its configs).
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, '.') } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
  },
});
