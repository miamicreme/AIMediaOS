import { NextResponse } from "next/server";
import { providers } from "@aimediaos/providers";
import { jobs } from "../store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const job = jobs.get(params.id);
  if (!job) return json(404, { error: "Job not found." });

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
      jobs.set(job.id, updated);
      return json(200, { job: updated });
    }
  }

  return json(200, { job });
}
