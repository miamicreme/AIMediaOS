# Performance Notes

## Current Speed Improvements

The MVP is designed to stay responsive even before production infrastructure is added.

Implemented now:

- Provider calls have a timeout.
- Slow or failed provider calls fall back to the local renderer.
- The UI does not block on a database for recent job history.
- Recent jobs are stored in browser local storage for the MVP.
- The API accepts multiple common provider response shapes.
- TypeScript path aliases are configured for cleaner imports and safer builds.
- CI runs typecheck and build on pushes and pull requests.

## Provider Timeout

Default timeout:

```txt
18000 ms
```

Override locally or in deployment:

```txt
AIMEDIA_PROVIDER_TIMEOUT_MS=8000
```

Lower values make the app feel faster but may fall back before slower providers finish.

## Current Bottlenecks

- Generation is synchronous inside `/api/generate`.
- Generated media is not yet stored in object storage.
- Credits and job history are client-side only.
- No queue exists yet for long-running video jobs.
- No CDN is configured yet.

## Next Speed Upgrades

### Phase 1

- Add provider health checks.
- Cache workflow metadata.
- Add optimistic UI job state.
- Add request timing to job payload.
- Add structured error codes.

### Phase 2

- Move long-running jobs to BullMQ or a managed queue.
- Add Redis for job status polling.
- Store media in S3-compatible object storage.
- Return CDN URLs instead of vendor URLs.
- Add provider routing by cost, quality, and latency.

### Phase 3

- Add provider benchmark jobs.
- Add automatic failover by workflow type.
- Add batch generation.
- Add account-level rate limits.
- Add admin provider dashboard.

## Production Target

For a consumer AI media app, the target user experience should be:

- Image generation request accepted in under 500 ms.
- Job status visible immediately.
- Preview image delivered as soon as provider completes.
- Slow providers should never freeze the UI.
- Video jobs should always run asynchronously.
