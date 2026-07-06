# AIMediaOS

AIMediaOS is an AI media operating system for generating, editing, animating, routing, storing, and monetizing AI-powered images and videos.

The goal is not to clone one AI effects website. The goal is to build a reusable media engine that can power many products: image generation, image-to-video, avatars, brand content, character consistency, workflow automation, and model routing.

## Vision

AIMediaOS should become the shared media spine for EmpireOS-style products.

It should support:

- Text-to-image
- Image-to-image
- Image-to-video
- Video effects
- Face-safe identity workflows
- Brand and character profiles
- Prompt templates
- Model routing
- GPU job queues
- Credit billing
- Media storage
- Human review and safety controls
- API-first access for other apps

## Core Architecture

```txt
User / App
  -> Web Dashboard
  -> API Gateway
  -> Auth + Credits
  -> Job Queue
  -> AI Router
  -> Model Provider / GPU Worker
  -> Storage + CDN
  -> Result Viewer
```

## Monorepo Layout

```txt
apps/
  web/        Next.js dashboard + job API routes (apps/web/src/app/api)
packages/
  shared/     Shared types and utilities
  workflows/  AI workflow definitions
  providers/  Model provider adapters
docs/         Product, architecture, roadmap, safety
```

## First MVP

The first build should do one thing well:

> Upload an image, select a safe creative effect, generate a new image or short video, track the job, charge credits, and store the result.

## Development Rules

- `main` should stay stable.
- `develop` is the working branch.
- No mock-only features should be called complete.
- Every workflow needs a real provider adapter or a clear stub label.
- Safety, consent, and audit logs are first-class requirements.

## Suggested Stack

- Next.js / React / TypeScript
- Node.js API or FastAPI worker layer
- PostgreSQL / Supabase
- Redis / BullMQ
- S3-compatible object storage
- Stripe credits and subscriptions
- Provider adapters for Replicate, fal.ai, RunPod, OpenAI, Kling, Runway, Luma, or local ComfyUI

## Getting Started

Requires Node.js 20+ and pnpm (Corepack will activate it automatically). There is only
one app to run — the web dashboard also serves the job API.

**Windows:** double-click `START_AIMEDIAOS.bat`. It checks for Node/pnpm, installs
dependencies, and starts everything at http://localhost:3000. No API keys required —
without provider credentials, effects run against local, in-browser processing.

**macOS/Linux:**

```sh
pnpm install
pnpm --filter @aimediaos/web dev
```

Then open http://localhost:3000.

To enable real image/video generation instead of the local preview effects, copy
`.env.example` to `apps/web/.env.local` and fill in `SEEDREAM_*`/`RUNPOD_*` credentials.

Other useful commands from the repo root: `pnpm build`, `pnpm lint`, `pnpm typecheck`.

## Status

Runnable end-to-end. `apps/web` is a mobile-first Next.js dashboard implementing the
upload → choose effect → generate → track job flow, with its own `/api/jobs` route
handlers backing it (in-memory job store, no separate API service to run).
`packages/providers` ships real Seedream and RunPod adapters that activate automatically
once their env vars are set; `packages/workflows` defines the effect/workflow catalog.
Persistent storage (Postgres/Supabase) and cloud file storage are not wired up yet —
see the Suggested Stack above for what's next.
