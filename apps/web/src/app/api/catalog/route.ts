import { NextResponse } from "next/server";
import { workflows } from "@aimediaos/workflows";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    categories: [
      { id: "image", label: "AI Image" },
      { id: "makeover", label: "Makeover" },
      { id: "video", label: "AI Video" },
    ],
    tools: workflows.map((workflow) => ({
      id: workflow.id,
      label: workflow.label,
      category: workflow.category,
      kind: workflow.kind,
      description: workflow.description,
      defaultModel: workflow.defaultModel,
      provider: workflow.provider,
      creditCost: workflow.creditCost,
    })),
  });
}
