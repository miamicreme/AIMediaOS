# AIMediaOS Local Readiness Checklist

Use this checklist before calling the local build ready.

## Start

```powershell
git checkout main
git pull origin main
.\START_AIMEDIAOS.bat
```

Open:

```txt
http://localhost:3000
```

## Required Quick Test

- [ ] Page loads without an error overlay.
- [ ] Header shows AIMediaOS branding.
- [ ] Hero says the build is test-ready.
- [ ] All 4 workflow cards are selectable and each shows a distinct badge (Local preview only / Live).
- [ ] Selecting an image workflow (Clothes Changer, Image to Image, Image to Video) shows the upload control.
- [ ] Selecting Text to Image shows a prompt box instead of an upload control.
- [ ] Uploaded image previews on screen.
- [ ] Generate button enables after upload (image workflows) or after typing a prompt (Text to Image).
- [ ] Generation status changes from queued to processing to complete.
- [ ] Local preview result is visibly different from the original and looks different per workflow.
- [ ] Download saves an output file.
- [ ] Recent results appear after generation.
- [ ] Reset clears the local job history.
- [ ] With no SEEDREAM_API_KEY set, Text to Image generation fails with a readable "not configured" message, not a crash.
- [ ] With SEEDREAM_API_KEY/SEEDREAM_ENDPOINT set, Text to Image generation returns a real image.

## Current Scope

This build is intentionally local-first, with one real workflow wired end to end.

Included:

- Text to Image calling a real Seedream job when configured (`/api/jobs` → `packages/providers`).
- Browser-based image upload for the other 3 workflows, with local canvas image processing as their preview (real generation for these needs hosted image storage, not included yet).
- PNG preview and download.
- Recent job history in browser storage.
- Branded MVP landing page.
- Windows startup script.

Not included yet:

- Real generation for the 3 image-upload workflows (needs hosted/public image storage so Seedream/RunPod can fetch the input).
- RunPod job submission (adapter exists, nothing calls it yet).
- User accounts.
- Billing.
- Database persistence (jobs live in an in-memory store; restarting the server clears them).
- Cloud file storage.
- Real video rendering.

## Pass Condition

The build is ready for Kohron to test when the upload, generate, preview, download, and recent-job loop works from a clean browser session.
