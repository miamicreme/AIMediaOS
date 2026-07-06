import type { ProviderAdapter, ProviderJobInput, ProviderStatusResult, ProviderSubmitResult } from "./types";

function getConfig() {
  return {
    apiKey: process.env.RUNPOD_API_KEY ?? "",
    endpointId: process.env.RUNPOD_ENDPOINT_ID ?? "",
    baseUrl: process.env.RUNPOD_BASE_URL ?? "https://api.runpod.ai/v2",
  };
}

function normalizeStatus(value: unknown): ProviderStatusResult["status"] {
  const status = String(value ?? "").toLowerCase();
  if (["completed", "succeeded", "success"].includes(status)) return "complete";
  if (["failed", "error", "cancelled", "canceled"].includes(status)) return "failed";
  if (["in_progress", "running", "processing"].includes(status)) return "processing";
  return "queued";
}

function extractResultUrls(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  const output = record.output ?? record.result;
  const urls: string[] = [];

  for (const candidate of [output, record.video_url, record.videoUrl, record.url, record.urls]) {
    if (typeof candidate === "string") urls.push(candidate);
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === "string") urls.push(item);
        if (item && typeof item === "object" && typeof (item as Record<string, unknown>).url === "string") {
          urls.push((item as Record<string, string>).url);
        }
      }
    }
    if (candidate && typeof candidate === "object" && typeof (candidate as Record<string, unknown>).url === "string") {
      urls.push((candidate as Record<string, string>).url);
    }
  }

  return Array.from(new Set(urls));
}

export const runpodAdapter: ProviderAdapter = {
  id: "runpod",
  label: "RunPod async provider",
  isConfigured() {
    const config = getConfig();
    return Boolean(config.apiKey && config.endpointId);
  },
  async submitJob(input: ProviderJobInput): Promise<ProviderSubmitResult> {
    const config = getConfig();

    if (!config.apiKey || !config.endpointId) {
      return {
        provider: "runpod",
        status: "failed",
        error: "RunPod provider is not configured. Add RUNPOD_API_KEY and RUNPOD_ENDPOINT_ID to run real video generation.",
      };
    }

    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/${config.endpointId}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        input: {
          job_id: input.jobId,
          workflow_id: input.workflowId,
          prompt: input.prompt,
          image_url: input.inputImages?.[0]?.url,
          image_urls: input.inputImages?.map((image) => image.url),
          aspect_ratio: input.aspectRatio,
          resolution: input.resolution,
          duration_seconds: input.durationSeconds,
          model: input.model,
          options: input.options ?? {},
        },
      }),
    });

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        provider: "runpod",
        status: "failed",
        error: String(raw.error ?? raw.message ?? `RunPod request failed with ${response.status}`),
        raw,
      };
    }

    const providerJobId = String(raw.id ?? raw.jobId ?? raw.request_id ?? input.jobId);

    return {
      provider: "runpod",
      providerJobId,
      status: normalizeStatus(raw.status),
      resultUrls: extractResultUrls(raw),
      raw,
    };
  },
  async getJob(providerJobId: string): Promise<ProviderStatusResult> {
    const config = getConfig();

    if (!config.apiKey || !config.endpointId) {
      return {
        status: "failed",
        error: "RunPod provider is not configured.",
      };
    }

    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/${config.endpointId}/status/${providerJobId}`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        status: "failed",
        error: String(raw.error ?? raw.message ?? `RunPod status failed with ${response.status}`),
        raw,
      };
    }

    const resultUrls = extractResultUrls(raw);

    return {
      status: resultUrls.length > 0 ? "complete" : normalizeStatus(raw.status),
      resultUrls,
      raw,
    };
  },
};
