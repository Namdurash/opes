const RATE_LIMIT_MS = 60_000;

export class RateLimiter {
  private readonly lastRequestAt = new Map<string, number>();

  isAllowed(key: string): boolean {
    const last = this.lastRequestAt.get(key);
    return last === undefined || Date.now() - last >= RATE_LIMIT_MS;
  }

  record(key: string): void {
    this.lastRequestAt.set(key, Date.now());
  }

  retryAfterMs(key: string): number {
    const last = this.lastRequestAt.get(key);
    if (last === undefined) return 0;
    return Math.max(0, RATE_LIMIT_MS - (Date.now() - last));
  }
}
