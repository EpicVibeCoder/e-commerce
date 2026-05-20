/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
      preset: "ts-jest",
      testEnvironment: "node",
      roots: ["<rootDir>/src", "<rootDir>/test"],
      testMatch: ["**/*.spec.ts", "**/*.test.ts", "**/test/**/*.ts"],
      moduleFileExtensions: ["ts", "tsx", "js", "json"],
      collectCoverageFrom: ["src/**/*.ts", "!src/**/*.d.ts"],
      coverageDirectory: "coverage",
      coverageReporters: ["text", "lcov"],
};
