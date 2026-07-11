/**
 * Accumulates token spend across judge calls so a suite can assert a budget.
 * Referenced in 20.F (cost discipline). Pure accumulator; no I/O.
 */
export class CostMeter {
  private tokensIn = 0;
  private tokensOut = 0;

  record(tokensIn: number, tokensOut: number): void {
    this.tokensIn += tokensIn;
    this.tokensOut += tokensOut;
  }

  total(): { tokensIn: number; tokensOut: number } {
    return { tokensIn: this.tokensIn, tokensOut: this.tokensOut };
  }
}
