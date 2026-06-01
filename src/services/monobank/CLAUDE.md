# Monobank integration

Wraps the Monobank Personal API. Optional — the app must function without it.

## Service instance

- **Always obtain the service via `getMonobankService(token)`** from [serviceInstance.ts](serviceInstance.ts). It caches one `MonobankService` per token.
- **Never `new MonobankService(...)`** in a store, screen, or other service. The cache exists to share the rate-limiter state across callers.

## Rate limiting

Monobank enforces **1 request / 60s per endpoint**. The shared limiter is in [rateLimiter.ts](rateLimiter.ts).

- A rate-limit hit surfaces as a `MonobankError` with code `RATE_LIMITED`.
- Stores show errors via `showErrorBottomSheet` from `shared/ui/bottom-sheet` — never inline banners or `Alert`.

## Token storage

[MonobankTokenService.ts](MonobankTokenService.ts) persists `{ token, clientName }`:

- **Device:** MMKV.
- **Jest:** in-memory map.

Use the same Jest-vs-device branch when adding any new native-backed storage in this codebase.

## Public types

API response shapes and domain-facing types live in [types.ts](types.ts); use them through the barrel. Transformers ([transformers.ts](transformers.ts)) convert Monobank payloads into shapes the rest of the app can consume.
