module.exports = {
  preset: '@northone/jest-preset',
  setupFiles: ['./jest.setup.ts'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverage: false,
}
