import type { JobQueueMeta, MediaAsset, MediaJob } from "@aimediaos/shared";
import { getSupabaseClient } from "./client";

interface MediaJobRow {
  id: string;
  workflow_id: string;
  kind: string;
  status: string;
  provider: string;
  provider_job_id: string | null;
  task_type: string | null;
  model: string | null;
  prompt: string | null;
  input_images: MediaAsset[];
  result_urls: string[];
  queue: JobQueueMeta | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

function toRow(job: MediaJob): MediaJobRow {
  return {
    id: job.id,
    workflow_id: job.workflowId,
    kind: job.kind,
    status: job.status,
    provider: job.provider,
    provider_job_id: job.providerJobId ?? null,
    task_type: job.taskType ?? null,
    model: job.model ?? null,
    prompt: job.prompt ?? null,
    input_images: job.inputImages,
    result_urls: job.resultUrls,
    queue: job.queue ?? null,
    error: job.error ?? null,
    created_at: job.createdAt,
    updated_at: job.updatedAt,
  };
}

function fromRow(row: MediaJobRow): MediaJob {
  return {
    id: row.id,
    workflowId: row.workflow_id as MediaJob["workflowId"],
    kind: row.kind as MediaJob["kind"],
    status: row.status as MediaJob["status"],
    provider: row.provider as MediaJob["provider"],
    providerJobId: row.provider_job_id ?? undefined,
    taskType: row.task_type ?? undefined,
    model: row.model ?? undefined,
    prompt: row.prompt ?? undefined,
    inputImages: row.input_images ?? [],
    resultUrls: row.result_urls ?? [],
    queue: row.queue ?? undefined,
    error: row.error ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function dbUpsertJob(job: MediaJob): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { error } = await client.from("media_jobs").upsert(toRow(job));
  if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
}

export async function dbGetJob(id: string): Promise<MediaJob | null> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client.from("media_jobs").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return data ? fromRow(data as MediaJobRow) : null;
}

export async function dbListJobs(): Promise<MediaJob[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase is not configured.");
  const { data, error } = await client
    .from("media_jobs")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return (data as MediaJobRow[] | null)?.map(fromRow) ?? [];
}
