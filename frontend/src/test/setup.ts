import '@testing-library/jest-dom';

// Mock CSS imports
const mockCss = {};
require.extensions['.css'] = () => mockCss;

// Mock any global setup here if needed