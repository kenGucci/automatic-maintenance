module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.js', '!src/index.js'],
  coverageThreshold: { global: { lines: 70 } },
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true
};
