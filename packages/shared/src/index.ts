export type MediaKind = "image" | "video";

export type JobStatus = "queued" | "processing" | "complete" | "failed";

export interface MediaJob {
  id: string;
  kind: MediaKind;
  status: JobStatus;
  effectId: string;
  sourceUrl: string;
  resultUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreativeEffect {
  id: string;
  label: string;
  description: string;
  kind: MediaKind;
}
