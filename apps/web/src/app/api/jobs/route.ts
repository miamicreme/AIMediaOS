import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getProviderForJob } from "@aimediaos/providers";
import { getWorkflowById } from "@aimediaos/workflows";
import type { CreateMediaJobInput, MediaJob } from "@aimediaos/shared";
import { jobs } from "./store";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

function validateInput(input: CreateMediaJobInput) {
  const workflow = getWorkflowById(input.workflowId);
  if (!workflow) return "Unknown workflowId.";
  if (workflow.requiredInputs.includes("prompt") && !input.prompt?.trim()) return "Prompt is required for this workflow.";
  if (workflow.requiredInputs.includes("image") && (!input.inputImages || input.inputImages.length === 0)) {
    return "At least one input image URL is required for this workflow.";
  }
  return null;
}

export async function POST(request: Request) {
  let input: CreateMediaJobInput;

  try {
    input = (await request.json()) as CreateMediaJobInput;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const validationError = validateInput(input);
  if (validationError) return json(400, { error: validationError });

  const workflow = getWorkflowById(input.workflowId)!;
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

  return json(submitted.status === "failed" ? 422 : 201, { job: updated });
}

export async function GET() {
  const allJobs = await jobs.list();
  return json(200, { jobs: allJobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) });
}
