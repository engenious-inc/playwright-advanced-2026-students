/**
 * Per-tier circuit breaker.
 * Referenced in M11 lecture 11.E.
 *
 * Closed → allows calls.
 * Open → rejects calls for RECOVERY_WINDOW_MS.
 * Half-open → allows one trial call; success closes, failure re-opens.
 */

type TierName = 'tier2' | 'tier3';
type BreakerState = 'closed' | 'open' | 'half-open';

const FAILURE_THRESHOLD = 3;
const RECOVERY_WINDOW_MS = 60_000;

type Slot = { state: BreakerState; failures: number; openedAt: number };

const state: Record<TierName, Slot> = {
  tier2: { state: 'closed', failures: 0, openedAt: 0 },
  tier3: { state: 'closed', failures: 0, openedAt: 0 },
};

const halfOpenTrialPending: Record<TierName, boolean> = {
  tier2: false,
  tier3: false,
};

export const breaker = {
  allows(tier: TierName): boolean {
    const s = state[tier];
    if (s.state === 'closed') return true;
    if (s.state === 'open' && Date.now() - s.openedAt > RECOVERY_WINDOW_MS) {
      s.state = 'half-open';
      halfOpenTrialPending[tier] = true;
      return true;
    }
    if (s.state === 'half-open' && halfOpenTrialPending[tier]) {
      halfOpenTrialPending[tier] = false;
      return true;
    }
    return false;
  },

  recordSuccess(tier: TierName): void {
    state[tier] = { state: 'closed', failures: 0, openedAt: 0 };
    halfOpenTrialPending[tier] = false;
  },

  recordFailure(tier: TierName, _err: unknown): void {
    const s = state[tier];
    s.failures += 1;
    halfOpenTrialPending[tier] = false;
    if (s.failures >= FAILURE_THRESHOLD || s.state === 'half-open') {
      s.state = 'open';
      s.openedAt = Date.now();
    }
  },

  isOpen(tier: TierName): boolean {
    return state[tier].state === 'open';
  },

  reset(): void {
    state.tier2 = { state: 'closed', failures: 0, openedAt: 0 };
    state.tier3 = { state: 'closed', failures: 0, openedAt: 0 };
    halfOpenTrialPending.tier2 = false;
    halfOpenTrialPending.tier3 = false;
  },
};
