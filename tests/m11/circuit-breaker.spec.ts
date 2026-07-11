import { test, expect } from '@playwright/test';
import { breaker } from '../../shared/tiered-ai/circuit-breaker.js';

test.describe('M11 circuit breaker', () => {
  test.beforeEach(() => {
    breaker.reset();
  });

  test('opens after three failures', () => {
    breaker.recordFailure('tier2', new Error('fail 1'));
    breaker.recordFailure('tier2', new Error('fail 2'));
    expect(breaker.isOpen('tier2')).toBe(false);
    breaker.recordFailure('tier2', new Error('fail 3'));
    expect(breaker.isOpen('tier2')).toBe(true);
    expect(breaker.allows('tier2')).toBe(false);
  });

  test('success resets failure count', () => {
    breaker.recordFailure('tier3', new Error('fail'));
    breaker.recordFailure('tier3', new Error('fail'));
    breaker.recordSuccess('tier3');
    breaker.recordFailure('tier3', new Error('fail'));
    expect(breaker.isOpen('tier3')).toBe(false);
  });
});
