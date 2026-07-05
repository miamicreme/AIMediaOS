"use client";

import { useEffect, useRef, useState } from "react";
import { effects } from "@aimediaos/workflows";
import { stubAdapter } from "@aimediaos/providers";
import type { CreativeEffect, JobStatus } from "@aimediaos/shared";

export function Studio() {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedEffect, setSelectedEffect] = useState<CreativeEffect>(effects[0]);
  const [status, setStatus] = useState<JobStatus>("queued");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSourceUrl(url);
    setFileName(file.name);
    setResultUrl(null);
  }

  async function handleGenerate() {
    if (!sourceUrl) return;
    setIsRunning(true);
    setResultUrl(null);
    setStatus("processing");

    // Simulated queue -> processing -> complete, backed by a real
    // (stub) provider adapter call from @aimediaos/providers.
    await new Promise((resolve) => setTimeout(resolve, 700));
    const result = await stubAdapter.generate({
      kind: selectedEffect.kind,
      effectId: selectedEffect.id,
      sourceUrl,
    });

    setResultUrl(result.resultUrl);
    setStatus("complete");
    setIsRunning(false);
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">1. Upload an image</h2>
        <label className="mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-sm text-white/70 active:bg-white/10">
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          {fileName ?? "Tap to choose a photo"}
        </label>
        {sourceUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={sourceUrl}
            alt="Selected upload preview"
            className="mt-3 max-h-64 w-full rounded-xl object-cover"
          />
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">2. Choose a safe creative effect</h2>
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
                    ? "border-accent bg-accent/10 text-white"
                    : "border-white/10 bg-white/5 text-white/70 active:bg-white/10"
                }`}
              >
                <div className="font-medium">{effect.label}</div>
                <div className="mt-1 text-xs text-white/50">{effect.description}</div>
                <div className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/50">
                  {effect.kind}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-panel p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-white/80">3. Generate</h2>
        <button
          type="button"
          disabled={!sourceUrl || isRunning}
          onClick={handleGenerate}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 sm:w-auto"
        >
          {isRunning ? "Generating…" : "Generate"}
        </button>

        <div className="mt-4 flex items-center gap-2 text-xs text-white/60">
          <StatusDot status={status} />
          <span className="capitalize">{status}</span>
        </div>

        {resultUrl && (
          <div className="mt-4">
            <div className="text-xs text-white/50">Result</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resultUrl}
              alt="Generated result preview"
              className="mt-2 max-h-64 w-full rounded-xl object-cover"
            />
          </div>
        )}
      </section>
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
