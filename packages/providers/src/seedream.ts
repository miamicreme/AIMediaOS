import type { JobQueueMeta } from "@aimediaos/shared";
import type { ProviderAdapter, ProviderJobInput, ProviderStatusResult, ProviderSubmitResult } from "./types";

const DEFAULT_BASE_URL = "https://fal.run";

function getConfig() {
  return {
    apiKey: process.env.SEEDREAM_API_KEY ?? process.env.FAL_KEY ?? "",
    endpoint: process.env.SEEDREAM_ENDPOINT ?? "",
    baseUrl: process.env.SEEDREAM_BASE_URL ?? DEFAULT_BASE_URL,
  };
}

function normalizeStatus(value: unknown): ProviderStatusResult["status"] {
  const status = String(value ?? "").toLowerCase();
  if (["complete", "completed", "succeeded", "success"].includes(status)) return "complete";
  if (["failed", "error", "canceled", "cancelled"].includes(status)) return "failed";
  if (["running", "processing", "in_progress"].includes(status)) return "processing";
  return "queued";
}

function readNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "number" ? value : undefined;
}

function extractQueueMeta(raw: unknown): JobQueueMeta | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const record = raw as Record<string, unknown>;
  const queue: JobQueueMeta = {
    queueTag: typeof record.queue_tag === "string" ? record.queue_tag : undefined,
    queueLength: readNumber(record, "queue_length"),
    queuePosition: readNumber(record, "queue_position"),
    activeWorkers: readNumber(record, "active_workers"),
    estimatedWaitSeconds: readNumber(record, "estimated_wait_seconds"),
    estimatedProcessingSeconds: readNumber(record, "estimated_processing_seconds"),
    estimatedTotalSeconds: readNumber(record, "estimated_total_seconds"),
    confidence:
      record.confidence === "low" || record.confidence === "medium" || record.confidence === "high"
        ? record.confidence
        : undefined,
  };

  return Object.values(queue).some((value) => value !== undefined) ? queue : undefined;
}

function extractResultUrls(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const record = raw as Record<string, unknown>;
  const candidates = [record.image, record.images, record.url, record.urls, record.output, record.result];
  const urls: string[] = [];

  for (const candidate of candidates) {
    if (typeof candidate === "string") urls.push(candidate);
    if (Array.isArray(candidate)) {
      for (const item of candidate) {
        if (typeof item === "string") urls.push(item);
        if (item && typeof item === "object") {
          const itemRecord = item as Record<string, unknown>;
          if (typeof itemRecord.url === "string") urls.push(itemRecord.url);
          if (typeof itemRecord.watermarkedImageUrl === "string") urls.push(itemRecord.watermarkedImageUrl);
        }
      }
    }
    if (candidate && typeof candidate === "object") {
      const candidateRecord = candidate as Record<string, unknown>;
      if (typeof candidateRecord.url === "string") urls.push(candidateRecord.url);
      if (typeof candidateRecord.watermarkedImageUrl === "string") urls.push(candidateRecord.watermarkedImageUrl);
    }
  }

  return Array.from(new Set(urls));
}

export const seedreamAdapter: ProviderAdapter = {
  id: "seedream",
  label: "Seedream-compatible image provider",
  isConfigured() {
    const config = getConfig();
    return Boolean(config.apiKey && config.endpoint);
  },
  async submitJob(input: ProviderJobInput): Promise<ProviderSubmitResult> {
    const config = getConfig();

    if (!config.apiKey || !config.endpoint) {
      return {
        provider: "seedream",
        status: "failed",
        taskType: input.taskType,
        model: input.model,
        queue: input.queueTag ? { queueTag: input.queueTag } : undefined,
        error:
          "Seedream provider is not configured. Add SEEDREAM_API_KEY or FAL_KEY and SEEDREAM_ENDPOINT to run real image generation.",
      };
    }

    const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/${config.endpoint.replace(/^\//, "")}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${config.apiKey}`,
      },
      body: JSON.stringify({
        prompt: input.prompt,
        image_url: input.inputImages?.[0]?.url,
        image_urls: input.inputImages?.map((image) => image.url),
        aspect_ratio: input.aspectRatio,
        resolution: input.resolution,
        model: input.model ?? "seedream-4.5",
        task_type: input.taskType,
        queue_tag: input.queueTag ?? "i2i",
        workflow_id: input.workflowId,
        options: input.options ?? {},
      }),
    });

    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        provider: "seedream",
        status: "failed",
        taskType: typeof raw.task_type === "string" ? raw.task_type : input.taskType,
        model: input.model,
        queue: extractQueueMeta(raw),
        error: String(raw.error ?? raw.message ?? `Seedream request failed with ${response.status}`),
        raw,
      };
    }

    const providerJobId = String(raw.request_id ?? raw.job_id ?? raw.id ?? input.jobId);
    const resultUrls = extractResultUrls(raw);

    return {
      provider: "seedream",
      providerJobId,
      status: resultUrls.length > 0 ? "complete" : normalizeStatus(raw.status),
      resultUrls,
      taskType: typeof raw.task_type === "string" ? raw.task_type : input.taskType,
      model: input.model,
      queue: extractQueueMeta(raw),
      raw,
    };
  },
  async getJob(providerJobId: string): Promise<ProviderStatusResult> {
    const config = getConfig();

    if (!config.apiKey || !config.endpoint) {
      return {
        status: "failed",
        error: "Seedream provider is not configured.",
      };
    }

    const statusUrl = `${config.baseUrl.replace(/\/$/, "")}/${config.endpoint.replace(/^\//, "")}/requests/${providerJobId}/status`;
    const response = await fetch(statusUrl, {
      headers: {
        Authorization: `Key ${config.apiKey}`,
      },
    });
    const raw = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      return {
        status: "failed",
        error: String(raw.error ?? raw.message ?? `Seedream status failed with ${response.status}`),
        queue: extractQueueMeta(raw),
        raw,
      };
    }

    return {
      status: normalizeStatus(raw.status),
      resultUrls: extractResultUrls(raw),
      queue: extractQueueMeta(raw),
      raw,
    };
  },
};
