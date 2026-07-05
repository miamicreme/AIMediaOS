# AIMediaOS

AIMediaOS is an AI media operating system for generating, editing, animating, routing, storing, and monetizing AI-powered images and videos.

The goal is not to clone one AI effects website. The goal is to build a reusable media engine that can power many products: image generation, image-to-video, avatars, brand content, character consistency, workflow automation, and model routing.

## Current Status

Working MVP on the `develop` branch.

The MVP currently includes:

- Next.js dashboard
- Workflow selection
- Prompt-based generation
- Credit deduction
- Recent job history
- Downloadable generated output
- Prompt safety guard
- Provider abstraction
- Live-provider-ready image generation
- Local fallback renderer
- Provider timeout handling
- CI for typecheck and build

## Quick Start

```powershell
cd C:\__CODEDEPOT\AIMediaOS
git checkout develop
git pull origin develop
pnpm install
pnpm --filter @aimediaos/web dev
```

Open:

```txt
http://localhost:3000
```

## MVP Architecture

```txt
Browser Dashboard
  -> POST /api/generate
  -> Request validation
  -> Safety guard
  -> Workflow prompt builder
  -> Provider router
  -> Live provider or local fallback
  -> Job payload returned to UI
  -> Recent jobs saved locally
```

## Project Layout

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

docs/
  ARCHITECTURE.md             System design
  RUNBOOK.md                  Local setup and troubleshooting
  PERFORMANCE.md              Speed strategy and bottlenecks
```

## Development Rules

- `main` should stay stable.
- `develop` is the working branch.
- Do not merge unfinished work into `main`.
- Every workflow should have a real provider adapter or a clearly labeled fallback.
- Safety, consent, and auditability are first-class requirements.
- Long-running video generation should move to a queue before production.

## Recommended Next Build

1. Add database-backed users, jobs, credits, and media records.
2. Add object storage for generated files.
3. Add subscriptions and credit packs.
4. Add async job queue for video and long image jobs.
5. Add real provider adapters by workflow type.
6. Add admin dashboard for failed jobs, provider costs, and moderation.

## Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Runbook](docs/RUNBOOK.md)
- [Performance](docs/PERFORMANCE.md)
