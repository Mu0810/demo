// Import from 'vitest/config', not 'vite'. Vite's own defineConfig types
// reject the `test` key (TS2769), and the error is invisible while tsconfig
// uses include: ["src"] — it surfaces the moment the root is type-checked.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    // A `spy.mockRestore()` at the end of a test body is skipped when an
    // assertion throws, leaving the stub installed for later tests in the file.
    // This makes restoration structural rather than positional — it matters most
    // for the component suites, which stub far more than Math.random.
    restoreMocks: true,
  },
});
