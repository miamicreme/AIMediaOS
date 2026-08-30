import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../middleware/auth";
import { supabase } from "@aimediaos/db";

function json(status: number, body: unknown) {
  return NextResponse.json(body, { status });
}

interface Invoice {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  description?: string;
  issued_at: string;
  due_at?: string;
  paid_at?: string;
  stripe_invoice_id?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build query
    let query = supabase
      .from("invoices")
      .select("*")
      .eq("user_id", authContext!.userId);

    // Apply status filter if provided
    if (status && ["draft", "issued", "paid", "overdue", "cancelled"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: invoices, error } = await query
      .order("issued_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Invoice fetch error:", error);
      return json(500, { error: "Failed to fetch invoices" });
    }

    const invoiceData = invoices as Invoice[] || [];

    // Calculate summary statistics
    const stats = {
      total: 0,
      paid: 0,
      pending: 0,
      overdue: 0,
    };

    invoiceData.forEach(inv => {
      stats.total += inv.amount;
      if (inv.status === "paid") stats.paid += inv.amount;
      else if (inv.status === "issued") stats.pending += inv.amount;
      else if (inv.status === "overdue") stats.overdue += inv.amount;
    });

    return json(200, {
      invoices: invoiceData.map(inv => ({
        id: inv.id,
        amount: inv.amount,
        currency: inv.currency,
        status: inv.status,
        description: inv.description,
        issuedAt: inv.issued_at,
        dueAt: inv.due_at,
        paidAt: inv.paid_at,
        stripeInvoiceId: inv.stripe_invoice_id,
      })),
      stats: {
        totalAmount: stats.total,
        paidAmount: stats.paid,
        pendingAmount: stats.pending,
        overdueAmount: stats.overdue,
      },
      pagination: {
        limit,
        offset,
        hasMore: invoiceData.length === limit,
      },
    });
  } catch (error) {
    console.error("Invoices error:", error);
    return json(500, { error: "Failed to fetch invoices" });
  }
}
