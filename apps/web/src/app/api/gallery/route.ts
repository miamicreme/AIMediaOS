import { NextResponse } from "next/server";
import { jobs } from "../jobs/store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

export async function GET(): Promise<NextResponse> {
  try {
    const allJobs = await jobs.list();
    const items = allJobs
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

    return json(200, {
      items,
      total: items.length,
    });
  } catch (error) {
    console.error("Gallery error:", error);
    return json(500, { error: "Failed to fetch gallery" });
  }
}
