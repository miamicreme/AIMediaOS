import type { MediaJob } from "@aimediaos/shared";

export interface ProviderAdapter {
  id: string;
  label: string;
  generate(job: Pick<MediaJob, "kind" | "effectId" | "sourceUrl">): Promise<{ resultUrl: string }>;
}

/**
 * Returns a fake result without calling any external service.
 * Swap for a real adapter (Replicate, fal.ai, RunPod, OpenAI, etc.) per README's provider list.
 */
export const stubAdapter: ProviderAdapter = {
  id: "stub",
  label: "Stub (no external calls)",
  async generate(job) {
    return { resultUrl: job.sourceUrl };
  },
};

export const providers: ProviderAdapter[] = [stubAdapter];
