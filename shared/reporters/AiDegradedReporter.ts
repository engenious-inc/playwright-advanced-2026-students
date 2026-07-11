import type { Reporter } from '@playwright/test/reporter';
import { breaker } from '../tiered-ai/circuit-breaker.js';

/**
 * Warns when tier-2/tier-3 circuit breakers tripped during a run.
 * Referenced in M11 lecture 11.E.
 */
export default class AiDegradedReporter implements Reporter {
  onEnd(): void {
    if (breaker.isOpen('tier2') || breaker.isOpen('tier3')) {
      console.warn('\n[AI DEGRADED] Circuit breaker open during this run.');
      console.warn(
        'Tests that depended on tier-2 or tier-3 locators may have used tier-1 fallbacks.',
      );
      console.warn('Review carefully before merging.');
    }
  }
}
