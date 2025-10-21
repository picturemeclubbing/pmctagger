/**
 * TokenBucket.test.js - Unit tests for TokenBucket rate limiter
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { TokenBucket } from '../src/utils/TokenBucket.js';

describe('TokenBucket', () => {
  let bucket;

  beforeEach(() => {
    bucket = new TokenBucket(10, 1); // 10 tokens, 1 token per second refill rate
  });

  it('should initialize with correct capacity', () => {
    expect(bucket.capacity).toBe(10);
    expect(bucket.tokens).toBe(10);
  });

  it('should acquire tokens when available', () => {
    expect(bucket.acquire()).toBe(true);
    expect(bucket.tokens).toBe(9);
  });

  it('should reject token acquisition when empty', () => {
    // Acquire all tokens
    for (let i = 0; i < 10; i++) {
      bucket.acquire();
    }

    expect(bucket.acquire()).toBe(false);
    expect(bucket.tokens).toBe(0);
  });

  it('should refill tokens over time', () => {
    // Acquire all tokens
    for (let i = 0; i < 10; i++) {
      bucket.acquire();
    }
    expect(bucket.tokens).toBe(0);

    // Simulate time passing (2 seconds)
    const originalTime = bucket.lastRefill;
    bucket.lastRefill = originalTime - 2000;

    expect(bucket.acquire()).toBe(true); // Should have refilled some tokens
    expect(bucket.tokens).toBe(0); // One token acquired, leaving 0
  });

  it('should get current token count', () => {
    expect(bucket.getTokens()).toBe(10);
    bucket.acquire();
    expect(bucket.getTokens()).toBe(9);
  });

  it('should reset bucket to full capacity', () => {
    bucket.acquire();
    bucket.acquire();
    expect(bucket.tokens).toBe(8);

    bucket.reset();
    expect(bucket.tokens).toBe(10);
  });

  // Integration test: burst behavior
  it('should handle burst requests correctly', () => {
    // Can acquire up to capacity immediately
    for (let i = 0; i < 10; i++) {
      expect(bucket.acquire()).toBe(true);
    }

    // Next acquisition should fail
    expect(bucket.acquire()).toBe(false);
  });
});
