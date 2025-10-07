# Frontend Test Suite

This directory contains the test setup for the React frontend application.

## Test Setup Created

### Files Created:
1. **src/test/setup.ts** - Jest test configuration and global setup
2. **src/test/basic.test.ts** - Basic smoke tests to verify test runner works
3. **src/test/utils.test.ts** - Tests for utility functions
4. **src/utils.ts** - Simple utility functions with test coverage
5. **jest.config.js** - Jest configuration for the test environment

### Dependencies Added to package.json:
- `jest` - Test runner
- `jest-environment-jsdom` - DOM environment for React testing
- `@types/jest` - TypeScript definitions for Jest
- `@testing-library/react` - React testing utilities
- `@testing-library/jest-dom` - Custom Jest matchers
- `@testing-library/user-event` - User interaction testing
- `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `@babel/preset-typescript` - Babel for transforming JSX/TS
- `babel-jest` - Babel transformer for Jest

### Scripts Added:
- `npm test` - Run tests (used by CI/CD)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Installation

To install dependencies and run tests:

```bash
cd frontend
npm install
npm test
```

The CI/CD pipeline runs: `npm test -- --coverage --watchAll=false`

## Test Structure

Tests are located in:
- `src/test/` - Test configuration and basic tests
- `src/**/*.test.ts` - Component and utility tests (following Jest conventions)

The setup ensures that the CI/CD pipeline will pass its test requirements.