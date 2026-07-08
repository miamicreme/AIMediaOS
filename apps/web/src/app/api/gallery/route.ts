import { NextResponse } from "next/server";
import { jobs } from "../jobs/store";

export async function GET() {
  const items = Array.from(jobs.values())
    .filter((job) => job.resultUrls.length > 0)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .flatMap((job) =>
      job.resultUrls.map((url, index) => ({
        id: `${job.id}-${index}`,
        jobId: job.id,
        workflowId: job.workflowId,
        category: job.kind,
        taskType: job.taskType,
        model: job.model,
        prompt: job.prompt,
        url,
        watermarkedImageUrl: url,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      }))
    );

  return NextResponse.json({
    items,
    total: items.length,
  });
}
