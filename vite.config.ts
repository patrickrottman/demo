import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: {
    port: 5180,
    open: false,
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
