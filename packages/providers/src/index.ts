export * from "./types";
export { seedreamAdapter } from "./seedream";
export { runpodAdapter } from "./runpod";

import type { ProviderAdapter, ProviderJobInput } from "./types";
import { seedreamAdapter } from "./seedream";
import { runpodAdapter } from "./runpod";

export const providers: ProviderAdapter[] = [seedreamAdapter, runpodAdapter];

export function getProviderForJob(input: ProviderJobInput): ProviderAdapter {
  if (input.kind === "video" || input.workflowId === "image-to-video") {
    return runpodAdapter;
  }

  return seedreamAdapter;
}
