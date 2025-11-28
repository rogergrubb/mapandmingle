import { describe, it, expect } from '@jest/globals';
import { checkRateLimit } from '../middleware/auth';

describe('Middleware', () => {
  describe('Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const key = 'test-key-1';
      const maxRequests = 5;
      const windowMs = 60000;
      
      for (let i = 0; i < maxRequests; i++) {
        const allowed = checkRateLimit(key, maxRequests, windowMs);
        expect(allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const key = 'test-key-2';
      const maxRequests = 3;
      const windowMs = 60000;
      
      // Make requests up to the limit
      for (let i = 0; i < maxRequests; i++) {
        checkRateLimit(key, maxRequests, windowMs);
      }
      
      // Next request should be blocked
      const blocked = checkRateLimit(key, maxRequests, windowMs);
      expect(blocked).toBe(false);
    });

    it('should reset after time window', () => {
      const key = 'test-key-3';
      const maxRequests = 2;
      const windowMs = 100; // 100ms window for testing
      
      // Use up the limit
      checkRateLimit(key, maxRequests, windowMs);
      checkRateLimit(key, maxRequests, windowMs);
      
      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const allowed = checkRateLimit(key, maxRequests, windowMs);
          expect(allowed).toBe(true);
          resolve();
        }, 150);
      });
    });
  });
});
