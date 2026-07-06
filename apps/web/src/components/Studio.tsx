"use client";

import { useEffect, useRef, useState } from "react";
import { effects } from "@aimediaos/workflows";
import type { CreativeEffect, JobStatus } from "@aimediaos/shared";

type JobRecord = {
  id: string;
  effectLabel: string;
  fileName: string;
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

function applyPixelEffect(ctx: CanvasRenderingContext2D, width: number, height: number, effect: CreativeEffect) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    const average = (r + g + b) / 3;

    if (effect.id === "portrait-glow") {
      data[index] = clamp(r * 1.18 + 18);
      data[index + 1] = clamp(g * 1.08 + 10);
      data[index + 2] = clamp(b * 0.95);
    } else if (effect.id === "anime-style") {
      data[index] = clamp(posterize(r * 1.18, 5));
      data[index + 1] = clamp(posterize(g * 1.12, 5));
      data[index + 2] = clamp(posterize(b * 1.28 + 12, 5));
    } else {
      data[index] = clamp(average * 0.42 + r * 0.52);
      data[index + 1] = clamp(average * 0.78 + g * 0.22 + 18);
      data[index + 2] = clamp(b * 1.35 + 38);
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

function drawStrongOverlay(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  effect: CreativeEffect
) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);

  if (effect.id === "portrait-glow") {
    gradient.addColorStop(0, "rgba(255, 196, 128, 0.52)");
    gradient.addColorStop(0.5, "rgba(236, 72, 153, 0.18)");
    gradient.addColorStop(1, "rgba(124, 58, 237, 0.32)");
  } else if (effect.id === "anime-style") {
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.42)");
    gradient.addColorStop(0.52, "rgba(236, 72, 153, 0.34)");
    gradient.addColorStop(1, "rgba(250, 204, 21, 0.18)");
  } else {
    gradient.addColorStop(0, "rgba(34, 211, 238, 0.55)");
    gradient.addColorStop(0.58, "rgba(37, 99, 235, 0.22)");
    gradient.addColorStop(1, "rgba(14, 165, 233, 0.38)");
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

  if (effect.id === "anime-style") {
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

  if (effect.id === "gentle-motion") {
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = "rgba(103, 232, 249, 0.95)";
    ctx.lineWidth = Math.max(2, width / 180);
    for (let y = height * 0.18; y < height * 0.82; y += height / 9) {
      ctx.beginPath();
      ctx.moveTo(width * 0.08, y);
      ctx.bezierCurveTo(width * 0.32, y - 36, width * 0.62, y + 36, width * 0.95, y - 10);
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
  ctx.strokeStyle = effect.id === "portrait-glow" ? "rgba(251, 191, 36, 0.74)" : effect.id === "anime-style" ? "rgba(236, 72, 153, 0.82)" : "rgba(34, 211, 238, 0.82)";
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, width - ctx.lineWidth, height - ctx.lineWidth);

  ctx.fillStyle = "rgba(2, 6, 23, 0.76)";
  ctx.fillRect(0, height - 112, width, 112);
  ctx.fillStyle = "white";
  ctx.font = `${Math.max(24, Math.floor(width / 28))}px Arial`;
  ctx.fillText(`AIMediaOS • ${effect.label}`, 28, height - 64);
  ctx.fillStyle = "rgba(255,255,255,0.72)";
  ctx.font = `${Math.max(14, Math.floor(width / 54))}px Arial`;
  ctx.fillText("VISIBLE LOCAL EFFECT • DOWNLOADABLE PNG • NO API KEY", 28, height - 28);
}

async function generateLocalResult(sourceUrl: string, effect: CreativeEffect) {
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
  applyPixelEffect(ctx, width, height, effect);
  drawStrongOverlay(ctx, image, width, height, effect);

  return canvas.toDataURL("image/png", 0.94);
}

export function Studio() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<CreativeEffect>(effects[0]);
  const [status, setStatus] = useState<JobStatus>("queued");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const savedJobs = window.localStorage.getItem("aimediaos_jobs");
    if (savedJobs) {
      setJobs(JSON.parse(savedJobs) as JobRecord[]);
    }

    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function saveJobs(nextJobs: JobRecord[]) {
    setJobs(nextJobs);
    window.localStorage.setItem("aimediaos_jobs", JSON.stringify(nextJobs));
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSourceUrl(url);
    setFileName(file.name);
    setResultUrl(null);
    setError(null);
    setStatus("queued");
  }

  async function handleGenerate() {
    if (!sourceUrl || !fileName) return;
    setIsRunning(true);
    setResultUrl(null);
    setError(null);
    setStatus("processing");

    try {
      const output = await generateLocalResult(sourceUrl, selectedEffect);
      const job: JobRecord = {
        id: `job_${Date.now()}`,
        effectLabel: selectedEffect.label,
        fileName,
        resultUrl: output,
        createdAt: new Date().toLocaleString()
      };
      setResultUrl(output);
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

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-white/80">1. Upload an image</h2>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
            Visible effects ready
          </span>
        </div>
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

      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">2. Choose a visible test effect</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {effects.map((effect) => {
            const active = effect.id === selectedEffect.id;
            return (
              <button
                key={effect.id}
                type="button"
                onClick={() => setSelectedEffect(effect)}
                className={`min-h-[44px] rounded-xl border p-3 text-left text-sm transition ${
                  active
                    ? "border-cyan-300 bg-cyan-300/15 text-white shadow-lg shadow-cyan-950/30"
                    : "border-white/10 bg-white/5 text-white/70 active:bg-white/10"
                }`}
              >
                <div className="font-medium">{effect.label}</div>
                <div className="mt-1 text-xs text-white/50">{effect.description}</div>
                <div className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                  visible PNG effect
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">3. Generate and download</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!sourceUrl || isRunning}
            onClick={handleGenerate}
            className="min-h-[44px] rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
          >
            {isRunning ? "Generating…" : "Generate visible effect"}
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
              <div className="text-xs text-white/50">Result includes a BEFORE inset and visible effect overlay</div>
              <a
                href={resultUrl}
                download={`aimediaos-${selectedEffect.id}.png`}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white active:bg-white/20"
              >
                Download PNG
              </a>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="Generated result preview"
              className="mt-2 max-h-[520px] w-full rounded-xl object-contain"
            />
          </div>
        )}
      </section>

      {jobs.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-white/80">Recent local jobs</h2>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {jobs.map((job) => (
              <a
                href={job.resultUrl}
                download={`aimediaos-${job.id}.png`}
                key={job.id}
                className="rounded-xl border border-white/10 bg-white/5 p-3 active:bg-white/10"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={job.resultUrl} alt="Recent generated result" className="h-28 w-full rounded-lg object-cover" />
                <div className="mt-2 text-sm font-medium text-white">{job.effectLabel}</div>
                <div className="text-xs text-white/50">{job.fileName}</div>
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
