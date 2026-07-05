# AIMediaOS Architecture

AIMediaOS is built as a media workflow platform, not a single-purpose generator.

## Current MVP Flow

```txt
Browser Dashboard
  -> POST /api/generate
  -> Validate request
  -> Check safety rules
  -> Build final workflow prompt
  -> Media provider router
  -> Live provider if configured
  -> Local fallback if unavailable
  -> Return job payload
  -> Browser stores recent jobs locally
```

## Current App Structure

```txt
apps/web/
  app/
    api/generate/route.ts     Generation API endpoint
    page.tsx                  Dashboard and create flow
    globals.css               UI styling
  lib/
    workflows.ts              Workflow catalog
    safety.ts                 Prompt safety guard
    media-provider.ts         Provider abstraction and fallback renderer
```

## Provider Strategy

The MVP has a provider abstraction so the app is usable immediately and ready for real generation.

Current providers:

1. `live-image-api`
   - Calls a configurable server-side image endpoint.
   - Uses a timeout so slow providers do not freeze the app.
   - Accepts common response shapes: `outputUrl`, `imageUrl`, `url`, `output[0]`, or `images[0]`.

2. `local-svg-demo`
   - Always available.
   - Generates a downloadable SVG result.
   - Used when no live provider is configured, when a workflow is not supported by the provider, or when a live call fails.

## Why This Architecture Is Fast

- The browser does not call AI vendors directly.
- Provider keys stay server-side.
- The provider call has a hard timeout.
- The app returns a fallback instead of hanging.
- The UI stores recent jobs locally, avoiding a database dependency during MVP.
- Adding a database later will not change the dashboard contract much.

## Next Production Architecture

```txt
Next.js Web App
  -> API Gateway
  -> Auth
  -> Credit Ledger
  -> Job Queue
  -> Provider Router
  -> GPU / Vendor Providers
  -> Object Storage
  -> CDN
  -> Audit Logs
```

## Production Services To Add Next

- Supabase or Postgres for users, credits, jobs, and media records.
- Redis/BullMQ for queued generation.
- Object storage for uploaded and generated media.
- Stripe for subscriptions and credit packs.
- Provider adapters for image, video, upscaling, face-safe identity, and style transfer workflows.
- Admin dashboard for moderation, failed jobs, provider costs, and user support.
