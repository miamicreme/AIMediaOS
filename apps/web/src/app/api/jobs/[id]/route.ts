import { NextRequest, NextResponse } from "next/server";
import { providers } from "@aimediaos/providers";
import { requireAuth } from "../../middleware/auth";
import { jobs } from "../store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const job = await jobs.get(params.id);
    if (!job) return json(404, { error: "Job not found." });

    // Ensure user can only see their own jobs
    if (job.userId && job.userId !== authContext!.userId) {
      return json(403, { error: "Unauthorized to access this job" });
    }

    if (job.providerJobId && ["queued", "processing"].includes(job.status)) {
      const provider = providers.find((candidate) => candidate.id === job.provider);
      if (provider) {
        const status = await provider.getJob(job.providerJobId);
        const updated = {
          ...job,
          status: status.status,
          resultUrls: status.resultUrls ?? job.resultUrls,
          queue: status.queue ?? job.queue,
          error: status.error,
          updatedAt: new Date().toISOString(),
        };
        await jobs.set(job.id, updated);
        return json(200, { job: updated });
      }
    }

    return json(200, { job });
  } catch (error) {
    console.error("Job fetch error:", error);
    return json(500, { error: "Failed to fetch job" });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  let body: { action: string };

  try {
    body = (await request.json()) as { action: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (body.action !== "cancel") {
    return json(400, { error: "Invalid action. Only 'cancel' is supported." });
  }

  try {
    const job = await jobs.get(params.id);
    if (!job) return json(404, { error: "Job not found." });

    // Ensure user can only cancel their own jobs
    if (job.userId && job.userId !== authContext!.userId) {
      return json(403, { error: "Unauthorized to cancel this job" });
    }

    // Only cancel if not already completed or failed
    if (!["queued", "processing"].includes(job.status)) {
      return json(400, { error: `Cannot cancel job with status: ${job.status}` });
    }

    // Cancel the job with the provider if it has a provider job ID
    if (job.providerJobId) {
      const provider = providers.find((candidate) => candidate.id === job.provider);
      if (provider && "cancelJob" in provider) {
        await (provider as any).cancelJob(job.providerJobId);
      }
    }

    // Update local job status
    const updated = {
      ...job,
      status: "cancelled",
      updatedAt: new Date().toISOString(),
    };
    await jobs.set(job.id, updated);

    return json(200, { job: updated, message: "Job cancelled successfully" });
  } catch (error) {
    console.error("Job cancellation error:", error);
    return json(500, { error: "Failed to cancel job" });
  }
}
