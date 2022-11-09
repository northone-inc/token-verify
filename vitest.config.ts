import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    clearMocks: true,
    setupFiles: ['dotenv/config'],
    coverage: {
      reporter: ['json', 'html', 'lcov'],
    },
  },
})
