# AIMediaOS Runbook

## Local Development

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

## Common Commands

```powershell
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm --filter @aimediaos/web dev
pnpm --filter @aimediaos/web build
```

## Environment

The MVP runs without external keys. Without a provider configured, it returns a local SVG fallback.

Optional live provider variables:

```txt
AIMEDIA_IMAGE_ENDPOINT=
AIMEDIA_IMAGE_TOKEN=
AIMEDIA_PROVIDER_TIMEOUT_MS=18000
```

## How To Test The MVP

1. Start the web app.
2. Open the dashboard.
3. Pick a workflow.
4. Enter a safe prompt.
5. Click generate.
6. Confirm credits decrease.
7. Confirm a job appears in recent history.
8. Confirm the generated asset previews.
9. Download the SVG output.

## Troubleshooting

### pnpm is not recognized

Run:

```powershell
corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm -v
```

If permission is denied, open PowerShell as Administrator.

### App runs but generation is slow

If a live provider is configured, lower the timeout:

```txt
AIMEDIA_PROVIDER_TIMEOUT_MS=8000
```

The app will fall back locally when the provider is slow or fails.

### Prompt is blocked

The safety guard blocks risky prompt terms. Use safe commercial, creative, brand, character, product, or video-planning prompts.

### Browser shows old history

Click Reset demo, or clear browser local storage for the site.
