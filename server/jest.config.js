export default {
  testEnvironment: 'node',
  transform: {},
  verbose: true,
  moduleNameMapper: {
    // Redirect any import of cloudinaryService.js to the ESM-compatible mock
    '^.*/services/cloudinaryService\\.js$': '<rootDir>/services/__mocks__/cloudinaryService.js',
  },
};
