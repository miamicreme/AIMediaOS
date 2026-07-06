import type { MediaJob } from "@aimediaos/shared";

declare global {
  // eslint-disable-next-line no-var
  var __aimediaosJobs: Map<string, MediaJob> | undefined;
}

export const jobs = globalThis.__aimediaosJobs ?? new Map<string, MediaJob>();

globalThis.__aimediaosJobs = jobs;
