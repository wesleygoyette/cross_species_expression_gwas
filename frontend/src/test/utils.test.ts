import { formatGeneId, validateEmail, calculatePercentage } from '../utils';

describe('Utility Functions', () => {
  describe('formatGeneId', () => {
    test('should convert gene ID to uppercase', () => {
      expect(formatGeneId('brca1')).toBe('BRCA1');
    });

    test('should trim whitespace', () => {
      expect(formatGeneId(' tp53 ')).toBe('TP53');
    });

    test('should handle empty string', () => {
      expect(formatGeneId('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email', () => {
      expect(validateEmail('test@example.com')).toBe(true);
    });

    test('should reject invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });

    test('should reject email without domain', () => {
      expect(validateEmail('test@')).toBe(false);
    });
  });

  describe('calculatePercentage', () => {
    test('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
    });

    test('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    test('should round to nearest integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33);
    });
  });
});