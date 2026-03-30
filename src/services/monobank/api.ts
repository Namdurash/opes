import type {
  MonobankRawClientInfo,
  MonobankRawStatementItem,
  MonobankClientInfo,
  MonobankStatement,
} from './types';
import { MonobankError } from './types';
import { RateLimiter } from './rateLimiter';
import { transformClientInfo, transformStatements } from './transformers';

const BASE_URL = 'https://api.monobank.ua';

// Maximum allowed range per statement request (31 days in seconds)
const MAX_STATEMENT_RANGE_SEC = 31 * 24 * 60 * 60;

const RATE_KEY_CLIENT_INFO = '/personal/client-info';
const statementRateKey = (accountId: string) => `/personal/statement/${accountId}`;

export class MonobankService {
  private readonly rateLimiter = new RateLimiter();

  constructor(private readonly token: string) {}

  async getClientInfo(): Promise<MonobankClientInfo> {
    const key = RATE_KEY_CLIENT_INFO;

    if (!this.rateLimiter.isAllowed(key)) {
      throw new MonobankError(
        'RATE_LIMITED',
        'Client info was fetched recently. Please wait before retrying.',
        this.rateLimiter.retryAfterMs(key),
      );
    }

    const raw = await this.request<MonobankRawClientInfo>(RATE_KEY_CLIENT_INFO);
    this.rateLimiter.record(key);

    return transformClientInfo(raw);
  }

  async getStatements(
    accountId: string,
    from: Date,
    to: Date,
  ): Promise<MonobankStatement[]> {
    const fromSec = Math.floor(from.getTime() / 1000);
    const toSec = Math.floor(to.getTime() / 1000);

    if (toSec - fromSec > MAX_STATEMENT_RANGE_SEC) {
      throw new MonobankError(
        'UNKNOWN',
        'Statement range exceeds the maximum allowed 31 days.',
      );
    }

    const key = statementRateKey(accountId);

    if (!this.rateLimiter.isAllowed(key)) {
      throw new MonobankError(
        'RATE_LIMITED',
        `Statements for account ${accountId} were fetched recently. Please wait before retrying.`,
        this.rateLimiter.retryAfterMs(key),
      );
    }

    const path = `/personal/statement/${accountId}/${fromSec}/${toSec}`;
    const raw = await this.request<MonobankRawStatementItem[]>(path);
    this.rateLimiter.record(key);

    return transformStatements(raw);
  }

  private async request<T>(path: string): Promise<T> {
    let response: Response;

    try {
      response = await fetch(`${BASE_URL}${path}`, {
        headers: { 'X-Token': this.token },
      });
    } catch (cause) {
      throw new MonobankError(
        'NETWORK_ERROR',
        'Network request failed. Check your internet connection.',
      );
    }

    if (response.ok) {
      return (await response.json()) as T;
    }

    switch (response.status) {
      case 401:
        throw new MonobankError('UNAUTHORIZED', 'Invalid or missing Monobank token.');
      case 403:
        throw new MonobankError('FORBIDDEN', 'Access denied by Monobank API.');
      case 429: {
        // Honour Retry-After header when present
        const retryAfter = response.headers.get('Retry-After');
        const retryAfterMs = retryAfter ? Number(retryAfter) * 1000 : 60_000;
        throw new MonobankError(
          'RATE_LIMITED',
          'Too many requests. Please slow down.',
          retryAfterMs,
        );
      }
      default: {
        let message = `Monobank API error (HTTP ${response.status}).`;
        try {
          const body = (await response.json()) as { errorDescription?: string };
          if (body.errorDescription) message = body.errorDescription;
        } catch {
          // ignore parse errors
        }
        throw new MonobankError('UNKNOWN', message);
      }
    }
  }
}
