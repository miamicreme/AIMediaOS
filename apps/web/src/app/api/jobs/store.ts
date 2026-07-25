import type { MediaJob } from "@aimediaos/shared";
import { dbGetJob, dbListJobs, dbUpsertJob, isDatabaseConfigured } from "@aimediaos/db";

declare global {
  // eslint-disable-next-line no-var
  var __aimediaosJobs: Map<string, MediaJob> | undefined;
}

const memoryJobs = globalThis.__aimediaosJobs ?? new Map<string, MediaJob>();
globalThis.__aimediaosJobs = memoryJobs;

/**
 * Always writes to the in-process memory cache (fast, works with zero
 * setup) and, when Supabase is configured, also persists to Postgres so
 * jobs survive a server restart. Reads prefer Postgres when available so
 * multiple server instances stay consistent; memory is the fallback.
 */
export const jobs = {
  async set(id: string, job: MediaJob): Promise<MediaJob> {
    memoryJobs.set(id, job);
    if (isDatabaseConfigured()) {
      await dbUpsertJob(job);
    }
    return job;
  },
  async get(id: string): Promise<MediaJob | undefined> {
    if (isDatabaseConfigured()) {
      const job = await dbGetJob(id);
      if (job) return job;
    }
    return memoryJobs.get(id);
  },
  async list(): Promise<MediaJob[]> {
    if (isDatabaseConfigured()) {
      return dbListJobs();
    }
    return Array.from(memoryJobs.values());
  },
};
