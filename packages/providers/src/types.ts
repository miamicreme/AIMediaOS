import type { CreateMediaJobInput, JobStatus, MediaKind, ProviderId } from "@aimediaos/shared";

export interface ProviderJobInput extends CreateMediaJobInput {
  jobId: string;
  kind: MediaKind;
}

export interface ProviderSubmitResult {
  provider: ProviderId;
  providerJobId?: string;
  status: JobStatus;
  resultUrls?: string[];
  error?: string;
  raw?: unknown;
}

export interface ProviderStatusResult {
  status: JobStatus;
  resultUrls?: string[];
  error?: string;
  raw?: unknown;
}

export interface ProviderAdapter {
  id: ProviderId;
  label: string;
  isConfigured(): boolean;
  submitJob(input: ProviderJobInput): Promise<ProviderSubmitResult>;
  getJob(providerJobId: string): Promise<ProviderStatusResult>;
}
