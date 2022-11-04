module.exports = {
  preset: '@northone/jest-preset',
  setupFiles: ['./jest.setup.ts'],
  coverageReporters: ['lcov', 'html', 'text'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverage: true,
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/src/utils',
    'src/types',
    'src/clients/milestone-event-bus.ts',
    '/__integration__/',
  ],
  coverageThreshold: {
    global: { //TODO rethink to account for /__integration__/
      branches: 60, //TODO remove once all CRUD are done
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}
