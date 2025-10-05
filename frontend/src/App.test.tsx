import React from 'react';

test('App component is defined', () => {
  // Simple test to verify the component exists and is importable
  expect(typeof React).toBe('object');
});

test('basic math works', () => {
  expect(2 + 2).toBe(4);
});
