import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getProviderForJob } from "@aimediaos/providers";
import { getWorkflowById } from "@aimediaos/workflows";
import type { CreateMediaJobInput, MediaJob } from "@aimediaos/shared";
import { deductCredits } from "@aimediaos/db/billing";
import { requireAuth, checkCredits } from "../../middleware/auth";
import { jobs } from "../../jobs/store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function validateInput(input: CreateMediaJobInput) {
  if (input.workflowId !== "image-to-video") {
    return "Invalid workflow for image-to-video endpoint.";
  }
  if (!input.inputImages || input.inputImages.length === 0) {
    return "At least one input image URL is required for image-to-video generation.";
  }
  if (input.prompt && input.prompt.trim().length > 2000) {
    return "Motion prompt must be 2000 characters or less.";
  }
  return null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  let input: CreateMediaJobInput;

  try {
    input = (await request.json()) as CreateMediaJobInput;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const validationError = validateInput(input);
  if (validationError) return json(400, { error: validationError });

  const workflow = getWorkflowById(input.workflowId)!;

  const credits = await checkCredits(authContext!.userId, input.workflowId);
  if (!credits.hasCredits) {
    return json(402, { error: `Insufficient credits. Required: ${credits.required}, Available: ${credits.balance}` });
  }

  const now = new Date().toISOString();
  const jobId = randomUUID();
  const model = input.model ?? workflow.defaultModel;
  const taskType = input.taskType ?? `${model}:${input.workflowId}`;
  const providerInput = {
    ...input,
    jobId,
    kind: workflow.kind,
    model,
    taskType,
  };
  const provider = getProviderForJob(providerInput);

  const job: MediaJob = {
    id: jobId,
    workflowId: input.workflowId,
    kind: workflow.kind,
    status: "queued",
    provider: provider.id,
    taskType,
    model,
    prompt: input.prompt,
    inputImages: input.inputImages ?? [],
    resultUrls: [],
    queue: input.queueTag ? { queueTag: input.queueTag } : undefined,
    createdAt: now,
    updatedAt: now,
    userId: authContext!.userId,
  };

  await jobs.set(job.id, job);

  const submitted = await provider.submitJob(providerInput);
  const updated: MediaJob = {
    ...job,
    status: submitted.status,
    provider: submitted.provider,
    providerJobId: submitted.providerJobId,
    taskType: submitted.taskType ?? job.taskType,
    model: submitted.model ?? job.model,
    queue: submitted.queue ?? job.queue,
    resultUrls: submitted.resultUrls ?? [],
    error: submitted.error,
    updatedAt: new Date().toISOString(),
  };
  await jobs.set(job.id, updated);

  if (updated.status !== "failed") {
    await deductCredits(authContext!.userId, input.workflowId, jobId);
  }

  return json(submitted.status === "failed" ? 422 : 201, { job: updated });
}
