export type MediaKind = "image" | "video";

export type JobStatus = "queued" | "processing" | "complete" | "failed";

export type ProviderId = "seedream" | "runpod" | "qwen" | "none";

export type WorkflowId =
  | "ai-clothes-changer"
  | "image-to-image"
  | "text-to-image"
  | "image-to-video";

export interface MediaAsset {
  id: string;
  url: string;
  mimeType?: string;
  filename?: string;
}

export interface CreateMediaJobInput {
  workflowId: WorkflowId;
  prompt?: string;
  inputImages?: MediaAsset[];
  aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" | "2:3" | "3:2";
  resolution?: "HD" | "FHD";
  durationSeconds?: 5 | 8;
  model?: string;
  taskType?: string;
  queueTag?: string;
  options?: Record<string, unknown>;
}

export interface JobQueueMeta {
  queueTag?: string;
  queueLength?: number;
  queuePosition?: number;
  activeWorkers?: number;
  estimatedWaitSeconds?: number;
  estimatedProcessingSeconds?: number;
  estimatedTotalSeconds?: number;
  confidence?: "low" | "medium" | "high";
}

export interface MediaJob {
  id: string;
  workflowId: WorkflowId;
  kind: MediaKind;
  status: JobStatus;
  provider: ProviderId;
  providerJobId?: string;
  taskType?: string;
  model?: string;
  prompt?: string;
  inputImages: MediaAsset[];
  resultUrls: string[];
  queue?: JobQueueMeta;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeEffect {
  id: string;
  label: string;
  description: string;
  kind: MediaKind;
}
