import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMedia } from "@/lib/media-provider";
import { buildSafePrompt, validatePromptSafety } from "@/lib/safety";
import { getWorkflow } from "@/lib/workflows";

const GenerateSchema = z.object({
  workflowId: z.string().min(1),
  prompt: z.string().min(3).max(800),
  inputImageUrl: z.string().url().optional().or(z.literal(""))
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid generation request", details: parsed.error.flatten() }, { status: 400 });
  }

  const workflow = getWorkflow(parsed.data.workflowId);
  const safety = validatePromptSafety(parsed.data.prompt);

  if (!safety.allowed) {
    return NextResponse.json({ error: safety.reason ?? "Prompt blocked by safety policy" }, { status: 400 });
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const finalPrompt = buildSafePrompt(workflow.systemPrompt, parsed.data.prompt);
  const media = await generateMedia({ workflow, prompt: finalPrompt });

  return NextResponse.json({
    job: {
      id: jobId,
      status: "succeeded",
      provider: media.provider,
      model: media.model,
      workflowId: workflow.id,
      workflowName: workflow.name,
      kind: workflow.kind,
      cost: workflow.cost,
      prompt: parsed.data.prompt,
      finalPrompt,
      inputImageUrl: parsed.data.inputImageUrl || null,
      outputUrl: media.outputUrl,
      mimeType: media.mimeType,
      fileExtension: media.fileExtension,
      usedLiveProvider: media.usedLiveProvider,
      startedAt,
      completedAt: new Date().toISOString()
    }
  });
}
