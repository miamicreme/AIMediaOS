import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getProviderForJob } from "@aimediaos/providers";
import { getWorkflowById } from "@aimediaos/workflows";
import type { CreateMediaJobInput, MediaAsset, MediaJob } from "@aimediaos/shared";
import { jobs } from "../../jobs/store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

type ImageToImageRequest = {
  prompt?: string;
  imageUrl?: string;
  image_url?: string;
  inputImageUrl?: string;
  images?: Array<string | { id?: string; url?: string }>;
  effectId?: string;
  model?: string;
  taskType?: string;
  task_type?: string;
  queueTag?: string;
  queue_tag?: string;
  aspectRatio?: CreateMediaJobInput["aspectRatio"];
  aspect_ratio?: CreateMediaJobInput["aspectRatio"];
  resolution?: CreateMediaJobInput["resolution"];
  options?: Record<string, unknown>;
};

function extractImages(body: ImageToImageRequest): MediaAsset[] {
  const directUrl = body.imageUrl ?? body.image_url ?? body.inputImageUrl;
  const assets: MediaAsset[] = [];

  if (directUrl) {
    assets.push({ id: "input-0", url: directUrl });
  }

  if (Array.isArray(body.images)) {
    body.images.forEach((item, index) => {
      if (typeof item === "string") assets.push({ id: `input-${index + assets.length}`, url: item });
      if (item && typeof item === "object" && item.url) {
        assets.push({ id: item.id ?? `input-${index + assets.length}`, url: item.url });
      }
    });
  }

  return assets;
}

function imagesResponse(resultUrls: string[]) {
  return resultUrls.map((url) => ({
    url,
    watermarkedImageUrl: url,
  }));
}

export async function POST(request: Request) {
  let body: ImageToImageRequest;

  try {
    body = (await request.json()) as ImageToImageRequest;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const prompt = body.prompt?.trim();
  const inputImages = extractImages(body);

  if (!prompt) return json(400, { error: "Prompt is required." });
  if (inputImages.length === 0) return json(400, { error: "At least one input image URL is required." });

  const workflowId: CreateMediaJobInput["workflowId"] = body.effectId === "ai-clothes-changer" ? "ai-clothes-changer" : "image-to-image";
  const workflow = getWorkflowById(workflowId)!;
  const jobId = randomUUID();
  const model = body.model ?? workflow.defaultModel;
  const taskType = body.taskType ?? body.task_type ?? `${model}:image-to-image`;
  const queueTag = body.queueTag ?? body.queue_tag ?? "i2i";
  const now = new Date().toISOString();

  const providerInput = {
    workflowId,
    prompt,
    inputImages,
    aspectRatio: body.aspectRatio ?? body.aspect_ratio ?? "3:4",
    resolution: body.resolution ?? "HD",
    model,
    taskType,
    queueTag,
    options: body.options ?? {},
    jobId,
    kind: workflow.kind,
  };

  const provider = getProviderForJob(providerInput);
  const job: MediaJob = {
    id: jobId,
    workflowId,
    kind: workflow.kind,
    status: "queued",
    provider: provider.id,
    providerJobId: undefined,
    taskType,
    model,
    prompt,
    inputImages,
    resultUrls: [],
    queue: { queueTag },
    createdAt: now,
    updatedAt: now,
  };

  jobs.set(job.id, job);

  const submitted = await provider.submitJob(providerInput);
  const updated: MediaJob = {
    ...job,
    status: submitted.status,
    provider: submitted.provider,
    providerJobId: submitted.providerJobId,
    taskType: submitted.taskType ?? taskType,
    model: submitted.model ?? model,
    queue: submitted.queue ?? job.queue,
    resultUrls: submitted.resultUrls ?? [],
    error: submitted.error,
    updatedAt: new Date().toISOString(),
  };
  jobs.set(job.id, updated);

  if (updated.status === "failed") {
    return json(422, { job: updated, error: updated.error });
  }

  if (updated.resultUrls.length > 0) {
    return json(200, { jobId: updated.id, status: updated.status, images: imagesResponse(updated.resultUrls), job: updated });
  }

  return json(202, {
    jobId: updated.id,
    providerJobId: updated.providerJobId,
    task_type: updated.taskType,
    category: updated.kind,
    status: updated.status === "queued" ? "pending" : updated.status,
    queue_tag: updated.queue?.queueTag,
    queue_length: updated.queue?.queueLength ?? 0,
    queue_position: updated.queue?.queuePosition ?? 0,
    active_workers: updated.queue?.activeWorkers,
    estimated_wait_seconds: updated.queue?.estimatedWaitSeconds,
    estimated_processing_seconds: updated.queue?.estimatedProcessingSeconds,
    estimated_total_seconds: updated.queue?.estimatedTotalSeconds,
    confidence: updated.queue?.confidence,
    job: updated,
  });
}
