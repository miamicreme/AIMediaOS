import type { MediaJob } from "@aimediaos/shared";

/**
 * Placeholder in-memory store so the API can run with zero external
 * dependencies. Swap for real Postgres/Supabase migrations + a query
 * layer here before going to production (see README "Suggested Stack").
 */
const jobs = new Map<string, MediaJob>();

export const jobsTable = {
  insert(job: MediaJob): MediaJob {
    jobs.set(job.id, job);
    return job;
  },
  get(id: string): MediaJob | undefined {
    return jobs.get(id);
  },
  update(id: string, patch: Partial<MediaJob>): MediaJob | undefined {
    const existing = jobs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() };
    jobs.set(id, updated);
    return updated;
  },
  list(): MediaJob[] {
    return Array.from(jobs.values());
  },
};
