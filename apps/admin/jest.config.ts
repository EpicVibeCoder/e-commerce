const nextJest = require('next/jest');
const createJestConfig = nextJest({ dir: __dirname });
export default createJestConfig({ testEnvironment: 'jsdom', setupFilesAfterEnv: ['<rootDir>/jest.setup.js'] });