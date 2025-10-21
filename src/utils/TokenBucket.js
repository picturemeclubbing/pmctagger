/**
 * TokenBucket.js - Rate limiting utility using token bucket algorithm
 * Compatible with: Phase 7.0 - Automated Delivery & Customer Notifications
 */

export class TokenBucket {
  /**
   * @param {number} capacity - Maximum number of tokens in the bucket
   * @param {number} refillRate - Tokens added per second
   */
  constructor(capacity, refillRate) {
    this.capacity = capacity; // Max tokens
    this.refillRate = refillRate; // Tokens per second
    this.tokens = capacity; // Current tokens
    this.lastRefill = Date.now(); // Timestamp of last refill
  }

  /**
   * Refill tokens based on elapsed time since last refill
   */
  refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = elapsed * this.refillRate;

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  /**
   * Attempt to acquire a token
   * @returns {boolean} True if token was acquired, false if bucket empty
   */
  acquire() {
    this.refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Get current token count (without refilling)
   * @returns {number} Current token count
   */
  getTokens() {
    return this.tokens;
  }

  /**
   * Reset bucket to full capacity
   */
  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }
}

/**
 * Sleep utility - helper for rate limiting delays
 * @param {number} ms - Milliseconds to sleep
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default TokenBucket;
