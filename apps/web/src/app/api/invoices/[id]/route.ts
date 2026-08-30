import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../middleware/auth";
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
  metadata?: Record<string, unknown>;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const { context: authContext, response: authError } = await requireAuth(request);
  if (authError) return authError;

  if (!supabase) return json(500, { error: "Database not configured" });

  try {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", authContext!.userId)
      .single();

    if (error || !invoice) {
      return json(404, { error: "Invoice not found" });
    }

    const invoiceData = invoice as Invoice;

    return json(200, {
      id: invoiceData.id,
      amount: invoiceData.amount,
      currency: invoiceData.currency,
      status: invoiceData.status,
      description: invoiceData.description,
      issuedAt: invoiceData.issued_at,
      dueAt: invoiceData.due_at,
      paidAt: invoiceData.paid_at,
      stripeInvoiceId: invoiceData.stripe_invoice_id,
      metadata: invoiceData.metadata,
    });
  } catch (error) {
    console.error("Invoice fetch error:", error);
    return json(500, { error: "Failed to fetch invoice" });
  }
}
