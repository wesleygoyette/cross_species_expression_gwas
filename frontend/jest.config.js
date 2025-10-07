module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    moduleNameMapping: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.(js|jsx|ts|tsx)',
        '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
    ],
    collectCoverageFrom: [
        'src/**/*.(js|jsx|ts|tsx)',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/test/**',
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
            ],
        }],
    },
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
};