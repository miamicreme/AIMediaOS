import { NextResponse } from "next/server";
import { providers } from "@aimediaos/providers";
import { jobs } from "../../../jobs/store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function imagesResponse(resultUrls: string[]) {
  return resultUrls.map((url) => ({
    url,
    watermarkedImageUrl: url,
  }));
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const job = await jobs.get(params.id);
  if (!job) return json(404, { error: "Job not found." });

  let updated = job;

  if (job.providerJobId && ["queued", "processing"].includes(job.status)) {
    const provider = providers.find((candidate) => candidate.id === job.provider);
    if (provider) {
      const status = await provider.getJob(job.providerJobId);
      updated = {
        ...job,
        status: status.status,
        resultUrls: status.resultUrls ?? job.resultUrls,
        queue: status.queue ?? job.queue,
        error: status.error,
        updatedAt: new Date().toISOString(),
      };
      await jobs.set(job.id, updated);
    }
  }

  return json(200, {
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
    images: imagesResponse(updated.resultUrls),
    error: updated.error,
    job: updated,
  });
}
