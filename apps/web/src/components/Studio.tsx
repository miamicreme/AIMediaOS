"use client";

import { useEffect, useRef, useState } from "react";
import { workflows, type WorkflowDefinition } from "@aimediaos/workflows";
import type { JobStatus, MediaJob, MediaKind, ProviderId } from "@aimediaos/shared";

type JobRecord = {
  id: string;
  label: string;
  source: "local" | ProviderId;
  kind: MediaKind;
  resultUrl: string;
  createdAt: string;
};

function loadImage(sourceUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load selected image"));
    image.src = sourceUrl;
  });
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, value));
}

function posterize(value: number, levels = 5) {
  const step = 255 / (levels - 1);
  return Math.round(value / step) * step;
}

function applyPixelEffect(ctx: CanvasRenderingContext2D, width: number, height: number, workflowId: string) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const average = (r + g + b) / 3;

    if (workflowId === "ai-clothes-changer") {
      data[index] = clamp(r * 1.18 + 18);
      data[index + 1] = clamp(g * 1.08 + 10);
      data[index + 2] = clamp(b * 0.95);
    } else {
      data[index] = clamp(posterize(r * 1.18, 5));
      data[index + 1] = clamp(posterize(g * 1.12, 5));
      data[index + 2] = clamp(posterize(b * 1.28 + 12, 5));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawStrongOverlay(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  workflow: WorkflowDefinition
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  if (workflow.id === "ai-clothes-changer") {
    gradient.addColorStop(0, "rgba(255, 196, 128, 0.52)");
    gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.18)");
    gradient.addColorStop(1, "rgba(124, 58, 237, 0.32)");
  } else {
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.42)");
    gradient.addColorStop(0.52, "rgba(236, 72, 153, 0.34)");
    gradient.addColorStop(1, "rgba(250, 204, 21, 0.18)");
  }

  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "source-over";

  const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.12, width / 2, height / 2, width * 0.72);
  vignette.addColorStop(0, "rgba(255,255,255,0.02)");
  vignette.addColorStop(1, "rgba(0,0,0,0.54)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  if (workflow.id === "image-to-image") {
    ctx.globalAlpha = 0.26;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = Math.max(1, width / 480);
    for (let x = -height; x < width; x += Math.max(18, width / 32)) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  const insetW = Math.round(width * 0.28);
  const insetH = Math.round(insetW * 0.68);
  const insetX = Math.round(width * 0.04);
  const insetY = Math.round(height * 0.04);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(insetX - 8, insetY - 32, insetW + 16, insetH + 44);
  ctx.drawImage(image, insetX, insetY, insetW, insetH);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = `${Math.max(12, Math.floor(width / 80))}px Arial`;
  ctx.fillText("BEFORE", insetX, insetY - 10);
  ctx.restore();

  ctx.lineWidth = Math.max(10, Math.floor(width / 90));
  ctx.strokeStyle = workflow.id === "ai-clothes-changer" ? "rgba(251, 191, 36, 0.74)" : "rgba(236, 72, 153, 0.82)";
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  ctx.fillStyle = "rgba(2, 6, 23, 0.76)";
  ctx.fillRect(0, height - 112, width, 112);
  ctx.fillStyle = "white";
  ctx.font = `${Math.max(24, Math.floor(width / 28))}px Arial`;
  ctx.fillText(`AIMediaOS • ${workflow.label}`, 28, height - 64);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `${Math.max(14, Math.floor(width / 54))}px Arial`;
  ctx.fillText("LOCAL PREVIEW • NOT REAL AI OUTPUT", 28, height - 28);
}

async function generateLocalResult(sourceUrl: string, workflow: WorkflowDefinition) {
  const image = await loadImage(sourceUrl);
  const maxSize = 1400;
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(320, Math.round(image.naturalWidth * scale));
  const height = Math.max(320, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas is not supported in this browser");
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  applyPixelEffect(ctx, width, height, workflow.id);
  drawStrongOverlay(ctx, image, width, height, workflow);

  return canvas.toDataURL("image/png", 0.94);
}

async function pollJob(jobId: string): Promise<MediaJob> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const response = await fetch(`/api/jobs/${jobId}`);
    const body = (await response.json()) as { job: MediaJob };
    if (body.job.status === "complete" || body.job.status === "failed") {
      return body.job;
    }
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("Timed out waiting for the provider to finish.");
}

const PROVIDER_ENV_HINT: Partial<Record<ProviderId, string>> = {
  seedream: "SEEDREAM_API_KEY",
  runpod: "RUNPOD_API_KEY",
};

export function Studio() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition>(workflows[0]);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [providerStatus, setProviderStatus] = useState<Partial<Record<ProviderId, boolean>>>({});
  const [storageConfigured, setStorageConfigured] = useState(false);
  const [status, setStatus] = useState<JobStatus>("queued");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultKind, setResultKind] = useState<MediaKind>("image");
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const requiresImage = selectedWorkflow.requiredInputs.includes("image");
  const isLiveWorkflow = !requiresImage || storageConfigured;
  const isConfigured = Boolean(providerStatus[selectedWorkflow.provider]);

  useEffect(() => {
    const savedJobs = window.localStorage.getItem("aimediaos_jobs");
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs) as JobRecord[]);
    }

    fetch("/api/providers")
      .then((response) => response.json())
      .then((body: { providers: Array<{ id: ProviderId; configured: boolean }>; storage: { configured: boolean } }) => {
        const next: Partial<Record<ProviderId, boolean>> = {};
        for (const provider of body.providers) next[provider.id] = provider.configured;
        setProviderStatus(next);
        setStorageConfigured(body.storage.configured);
      })
      .catch(() => {
        setProviderStatus({});
        setStorageConfigured(false);
      });

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function saveJobs(nextJobs: JobRecord[]) {
    setJobs(nextJobs);
    window.localStorage.setItem("aimediaos_jobs", JSON.stringify(nextJobs));
  }

  function selectWorkflow(workflow: WorkflowDefinition) {
    setSelectedWorkflow(workflow);
    setResultUrl(null);
    setError(null);
    setStatus("queued");
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSourceUrl(url);
    setSourceFile(file);
    setFileName(file.name);
    setResultUrl(null);
    setError(null);
    setStatus("queued");
  }

  async function handleGenerateLocal() {
    if (!sourceUrl || !fileName) return;
    setIsRunning(true);
    setResultUrl(null);
    setError(null);
    setStatus("processing");

    try {
      const output = await generateLocalResult(sourceUrl, selectedWorkflow);
      const job: JobRecord = {
        id: `local_${Date.now()}`,
        label: `${selectedWorkflow.label} (local preview)`,
        source: "local",
        kind: "image",
        resultUrl: output,
        createdAt: new Date().toLocaleString(),
      };
      setResultUrl(output);
      setResultKind("image");
      saveJobs([job, ...jobs].slice(0, 8));
      setStatus("complete");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Generation failed");
      setStatus("failed");
    } finally {
      setIsRunning(false);
    }
  }

  async function handleGenerateLive() {
    if (!prompt.trim()) return;
    if (requiresImage && !sourceFile) return;
    setIsRunning(true);
    setResultUrl(null);
    setError(null);
    setStatus("processing");

    try {
      let inputImages: Array<{ id: string; url: string }> | undefined;

      if (requiresImage && sourceFile) {
        const uploadForm = new FormData();
        uploadForm.append("file", sourceFile);
        const uploadResponse = await fetch("/api/uploads", { method: "POST", body: uploadForm });
        const uploadBody = (await uploadResponse.json()) as { url?: string; error?: string };
        if (!uploadResponse.ok || !uploadBody.url) {
          throw new Error(uploadBody.error ?? "Upload failed.");
        }
        inputImages = [{ id: "input-0", url: uploadBody.url }];
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: selectedWorkflow.id, prompt: prompt.trim(), inputImages }),
      });
      const body = (await response.json()) as { job: MediaJob };
      const finalJob = body.job.status === "complete" || body.job.status === "failed" ? body.job : await pollJob(body.job.id);

      if (finalJob.status === "failed" || finalJob.resultUrls.length === 0) {
        throw new Error(finalJob.error ?? "Generation failed with no result.");
      }

      const job: JobRecord = {
        id: finalJob.id,
        label: `${selectedWorkflow.label} — "${prompt.trim().slice(0, 60)}"`,
        source: finalJob.provider,
        kind: finalJob.kind,
        resultUrl: finalJob.resultUrls[0],
        createdAt: new Date().toLocaleString(),
      };
      setResultUrl(finalJob.resultUrls[0]);
      setResultKind(finalJob.kind);
      saveJobs([job, ...jobs].slice(0, 8));
      setStatus("complete");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Generation failed");
      setStatus("failed");
    } finally {
      setIsRunning(false);
    }
  }

  function resetStudio() {
    setResultUrl(null);
    setError(null);
    setStatus("queued");
    saveJobs([]);
  }

  const canGenerate = isLiveWorkflow
    ? prompt.trim().length > 0 && (!requiresImage || Boolean(sourceFile))
    : Boolean(sourceUrl);
  const resultExtension = resultKind === "video" ? "mp4" : "png";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">1. Choose a workflow</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {workflows.map((workflow) => {
            const active = workflow.id === selectedWorkflow.id;
            const live = !workflow.requiredInputs.includes("image") || storageConfigured;
            const configured = Boolean(providerStatus[workflow.provider]);
            const badge = live
              ? configured
                ? "Live · real generation"
                : `Live · needs ${PROVIDER_ENV_HINT[workflow.provider] ?? "provider key"}`
              : "Local preview only";
            return (
              <button
                key={workflow.id}
                type="button"
                onClick={() => selectWorkflow(workflow)}
                className={`min-h-[44px] rounded-xl border p-3 text-left text-sm transition ${
                  active
                    ? "border-cyan-300 bg-cyan-300/15 text-white shadow-lg shadow-cyan-950/30"
                    : "border-white/10 bg-white/5 text-white/70 active:bg-white/10"
                }`}
              >
                <div className="font-medium">{workflow.label}</div>
                <div className="mt-1 text-xs text-white/50">{workflow.description}</div>
                <div
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${
                    live && configured ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/50"
                  }`}
                >
                  {badge}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {requiresImage && (
        <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white/80">2. Upload an image</h2>
          <p className="mt-1 text-xs text-white/50">
            {storageConfigured
              ? "Uploaded to media storage and sent to the real provider below."
              : "Media storage isn't configured yet, so this workflow always runs as a local style preview instead of real generation."}
          </p>
          <label className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 active:bg-white/10">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            {fileName ?? "Tap to choose a photo"}
          </label>
          {sourceUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sourceUrl}
              alt="Selected upload preview"
              className="mt-3 max-h-72 w-full rounded-xl object-cover"
            />
          )}
        </section>
      )}

      {isLiveWorkflow && (
        <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white/80">{requiresImage ? "3. Describe the change" : "2. Describe the image"}</h2>
          <p className="mt-1 text-xs text-white/50">
            {isConfigured
              ? `Sent to a real ${selectedWorkflow.provider} job.`
              : `${selectedWorkflow.provider} isn't configured yet — generating will show the exact error the API returns.`}
          </p>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={requiresImage ? "Change the outfit to a red leather jacket" : "A neon-lit city street in the rain, cinematic"}
            rows={3}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
          />
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">{isLiveWorkflow && requiresImage ? "4." : "3."} Generate{isLiveWorkflow ? "" : " and download"}</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!canGenerate || isRunning}
            onClick={isLiveWorkflow ? handleGenerateLive : handleGenerateLocal}
            className="min-h-[44px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {isRunning ? "Generating…" : isLiveWorkflow ? `Generate with ${selectedWorkflow.provider}` : "Generate local preview"}
          </button>
          <button
            type="button"
            onClick={resetStudio}
            className="min-h-[44px] rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-white/70 active:bg-white/10"
          >
            Reset
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
          <StatusDot status={status} />
          <span className="capitalize">{status}</span>
        </div>

        {error && <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

        {resultUrl && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-xs text-white/50">
                {isLiveWorkflow ? `Real ${selectedWorkflow.provider} output` : "Local preview with a BEFORE inset and visible effect overlay"}
              </div>
              <a
                href={resultUrl}
                download={`aimediaos-${selectedWorkflow.id}.${resultExtension}`}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white active:bg-white/20"
              >
                Download
              </a>
            </div>
            {resultKind === "video" ? (
              <video src={resultUrl} controls className="mt-2 max-h-[520px] w-full rounded-xl object-contain" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resultUrl}
                alt="Generated result preview"
                className="mt-2 max-h-[520px] w-full rounded-xl object-contain"
              />
            )}
          </div>
        )}
      </section>

      {jobs.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white/80">Recent results</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <a
                href={job.resultUrl}
                download={`aimediaos-${job.id}.${job.kind === "video" ? "mp4" : "png"}`}
                key={job.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 active:bg-white/10"
              >
                {job.kind === "video" ? (
                  <video src={job.resultUrl} className="h-28 w-full rounded-lg object-cover" muted />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={job.resultUrl} alt="Recent generated result" className="h-28 w-full rounded-lg object-cover" />
                )}
                <div className="mt-2 text-sm font-medium text-white">{job.label}</div>
                <div className="text-xs text-white/50">{job.source === "local" ? "Local preview" : `Real ${job.source} job`}</div>
                <div className="text-xs text-white/40">{job.createdAt}</div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusDot({ status }: { status: JobStatus }) {
  const color =
    status === "complete"
      ? "bg-emerald-400"
      : status === "failed"
        ? "bg-red-400"
        : status === "processing"
          ? "bg-amber-400"
          : "bg-white/30";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}
