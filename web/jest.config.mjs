/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests/unit"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: [
    "src/lib/auth/messages.ts",
    "src/lib/stage-required-fields/lead-field-labels.ts",
    "src/lib/stage-required-fields/validate-lead-for-stage-requirements.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "html", "lcov"],
  coverageThreshold: {
    global: {
      branches: 91,
      functions: 91,
      lines: 91,
      statements: 91,
    },
  },
};

export default config;
