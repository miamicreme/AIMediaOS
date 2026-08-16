// Database integrity and safety utilities

import { getSupabaseClient } from "./client";
import type { MediaJob } from "@aimediaos/shared";

export interface AuditEntry {
  id: string;
  job_id: string;
  action: "create" | "update" | "delete";
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  changed_at: string;
  changed_by?: string;
}

export async function createAuditLog(
  jobId: string,
  action: "create" | "update" | "delete",
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: true }; // Silently skip if not configured
  }

  try {
    const { error } = await client.from("job_audit_log").insert({
      job_id: jobId,
      action,
      old_data: oldData,
      new_data: newData,
      changed_at: new Date().toISOString(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Audit log error:", err);
    return { success: false, error: "Failed to create audit log" };
  }
}

export async function withAuditLog<T>(
  jobId: string,
  action: "create" | "update" | "delete",
  operation: () => Promise<T>,
  beforeData?: Record<string, unknown>
): Promise<{ result: T; error?: string }> {
  try {
    const result = await operation();

    // Log the successful operation
    await createAuditLog(jobId, action, beforeData, result as Record<string, unknown>);

    return { result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await createAuditLog(jobId, action, beforeData, { error: message });
    return { result: null as any, error: message };
  }
}

export function validateJobIntegrity(job: MediaJob): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // UUID format
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(job.id)) {
    errors.push("Invalid job ID format");
  }

  // Required fields
  if (!job.workflow_id) errors.push("Missing workflow_id");
  if (!job.kind) errors.push("Missing kind");
  if (!job.status) errors.push("Missing status");
  if (!job.provider) errors.push("Missing provider");

  // Status enum
  const validStatuses = ["queued", "processing", "completed", "failed"];
  if (!validStatuses.includes(job.status)) {
    errors.push(`Invalid status: ${job.status}`);
  }

  // Array fields must be valid JSON arrays
  if (!Array.isArray(job.inputImages)) {
    errors.push("inputImages must be an array");
  }
  if (!Array.isArray(job.resultUrls)) {
    errors.push("resultUrls must be an array");
  }

  // URL validation
  if (job.resultUrls && job.resultUrls.length > 0) {
    for (const url of job.resultUrls) {
      try {
        new URL(url);
      } catch {
        errors.push(`Invalid result URL: ${url}`);
      }
    }
  }

  // Timestamp validation
  if (job.createdAt && isNaN(new Date(job.createdAt).getTime())) {
    errors.push("Invalid createdAt timestamp");
  }
  if (job.updatedAt && isNaN(new Date(job.updatedAt).getTime())) {
    errors.push("Invalid updatedAt timestamp");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function migrateJobSchema(
  oldJob: Record<string, unknown>
): Promise<MediaJob | null> {
  // Handle schema evolution safely
  // This allows gradual migration of job records

  const job = {
    id: oldJob.id,
    workflow_id: oldJob.workflow_id || oldJob.workflowId,
    kind: oldJob.kind,
    status: oldJob.status || "queued",
    provider: oldJob.provider,
    provider_job_id: oldJob.provider_job_id || oldJob.providerJobId,
    task_type: oldJob.task_type || oldJob.taskType,
    model: oldJob.model,
    prompt: oldJob.prompt,
    input_images: oldJob.input_images || oldJob.inputImages || [],
    result_urls: oldJob.result_urls || oldJob.resultUrls || [],
    queue: oldJob.queue,
    error: oldJob.error,
    created_at: oldJob.created_at || oldJob.createdAt,
    updated_at: oldJob.updated_at || oldJob.updatedAt,
  } as unknown as MediaJob;

  const validation = validateJobIntegrity(job);
  if (!validation.valid) {
    console.error("Job migration failed:", validation.errors);
    return null;
  }

  return job;
}
