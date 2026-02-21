const fc = require('fast-check');
const { generateResetToken } = require('../utils/tokenGenerator');

describe('Token Generator - Property-Based Tests', () => {
  describe('Property 1: Token Format Validity', () => {
    // Feature: secure-password-reset, Property 1: For any generated reset token, the token SHALL be a valid hexadecimal string of exactly 64 characters (representing 32 bytes).
    // Validates: Requirements 1.1, 1.3
    it('should generate tokens that are 64-character hexadecimal strings', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 999 }), () => {
          const token = generateResetToken();
          
          // Verify token is exactly 64 characters
          expect(token).toHaveLength(64);
          
          // Verify token contains only hexadecimal characters (0-9, a-f)
          const hexRegex = /^[0-9a-f]{64}$/;
          expect(token).toMatch(hexRegex);
        }),
        { numRuns: 100 }
      );
    });
  });
});

describe('Token Generator - Unit Tests', () => {
  describe('Token Length', () => {
    it('should generate a token with exactly 64 characters', () => {
      const token = generateResetToken();
      expect(token).toHaveLength(64);
    });
  });

  describe('Token Format', () => {
    it('should generate a token containing only hexadecimal characters', () => {
      const token = generateResetToken();
      const hexRegex = /^[0-9a-f]{64}$/;
      expect(token).toMatch(hexRegex);
    });
  });

  describe('Token Uniqueness', () => {
    it('should generate unique tokens on multiple calls', () => {
      const tokens = new Set();
      const numTokens = 100;
      
      for (let i = 0; i < numTokens; i++) {
        tokens.add(generateResetToken());
      }
      
      // All tokens should be unique
      expect(tokens.size).toBe(numTokens);
    });
  });
});
