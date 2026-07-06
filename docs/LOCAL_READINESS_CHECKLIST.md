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
- [ ] Upload control accepts an image.
- [ ] Uploaded image previews on screen.
- [ ] At least one effect can be selected.
- [ ] Generate test asset button enables after upload.
- [ ] Generation status changes from queued to processing to complete.
- [ ] Generated result is visibly different from the original.
- [ ] Download PNG saves an output file.
- [ ] Recent local jobs appear after generation.
- [ ] Reset clears the local job history.

## Current Scope

This build is intentionally local-first.

Included:

- Browser-based image upload.
- Local canvas image processing.
- PNG preview and download.
- Recent job history in browser storage.
- Branded MVP landing page.
- Windows startup script.

Not included yet:

- Real external AI provider.
- RunPod job submission.
- User accounts.
- Billing.
- Database persistence.
- Cloud file storage.
- Real video rendering.

## Pass Condition

The build is ready for Kohron to test when the upload, generate, preview, download, and recent-job loop works from a clean browser session.
