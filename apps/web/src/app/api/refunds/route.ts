import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../middleware/auth";
import { addCredits } from "@aimediaos/db/billing";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface RefundRequest {
  id: string;
  user_id: string;
  job_id: string;
  amount: number;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  let body: { jobId: string; reason: string };

  try {
    body = (await request.json()) as { jobId: string; reason: string };
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  if (!body.jobId || !body.reason) {
    return json(400, { error: "jobId and reason are required" });
  }

  if (body.reason.length > 1000) {
    return json(400, { error: "Reason must be 1000 characters or less" });
  }

  try {
    // Verify job exists and belongs to user
    const { data: jobData } = await supabase
      .from("media_jobs")
      .select("id, workflow_id, status, user_id")
      .eq("id", body.jobId)
      .single();

    if (!jobData) {
      return json(404, { error: "Job not found" });
    }

    const job = jobData as { id: string; workflow_id: string; status: string; user_id: string };

    if (job.user_id !== authContext!.userId) {
      return json(403, { error: "Unauthorized to refund this job" });
    }

    if (!["failed", "error"].includes(job.status)) {
      return json(400, { error: `Cannot refund job with status: ${job.status}. Only failed jobs can be refunded.` });
    }

    // Check if refund already exists
    const { data: existingRefund } = await supabase
      .from("refund_requests")
      .select("id")
      .eq("job_id", body.jobId)
      .eq("status", "pending")
      .single();

    if (existingRefund) {
      return json(400, { error: "A refund request for this job is already pending" });
    }

    const refundId = randomUUID();

    // Create refund request
    const { data: created, error: createError } = await supabase
      .from("refund_requests")
      .insert({
        id: refundId,
        user_id: authContext!.userId,
        job_id: body.jobId,
        amount: 0,
        reason: body.reason,
        status: "pending",
        created_at: new Date().toISOString(),
      })
      .select("id, job_id, status, created_at")
      .single();

    if (createError) {
      console.error("Refund request creation error:", createError);
      return json(500, { error: "Failed to create refund request" });
    }

    const createdData = created as { id: string; job_id: string; status: string; created_at: string };

    return json(201, {
      id: createdData.id,
      jobId: createdData.job_id,
      status: createdData.status,
      createdAt: createdData.created_at,
      message: "Refund request submitted. We'll review it within 24 hours.",
    });
  } catch (error) {
    console.error("Refund request error:", error);
    return json(500, { error: "Failed to create refund request" });
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    let query = supabase
      .from("refund_requests")
      .select("*")
      .eq("user_id", authContext!.userId);

    if (status && ["pending", "approved", "rejected", "completed"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: refunds, error } = await query
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Refund requests fetch error:", error);
      return json(500, { error: "Failed to fetch refund requests" });
    }

    const refundData = refunds as RefundRequest[] || [];

    return json(200, {
      refunds: refundData.map(r => ({
        id: r.id,
        jobId: r.job_id,
        amount: r.amount,
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
        resolvedAt: r.resolved_at,
      })),
      total: refundData.length,
    });
  } catch (error) {
    console.error("Refund requests error:", error);
    return json(500, { error: "Failed to fetch refund requests" });
  }
}
