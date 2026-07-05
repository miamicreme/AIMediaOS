import { NextResponse } from "next/server";
import { z } from "zod";
import { getWorkflow } from "@/lib/workflows";

const GenerateSchema = z.object({
  workflowId: z.string().min(1),
  prompt: z.string().min(3).max(800),
  inputImageUrl: z.string().url().optional().or(z.literal(""))
});

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .slice(0, 180);
}

function makeSvgDataUrl({ prompt, workflowName, kind }: { prompt: string; workflowName: string; kind: string }) {
  const safePrompt = escapeXml(prompt);
  const safeWorkflow = escapeXml(workflowName);
  const safeKind = escapeXml(kind.toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#111827"/>
        <stop offset="42%" stop-color="#4c1d95"/>
        <stop offset="100%" stop-color="#0891b2"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="65%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.45"/></filter>
    </defs>
    <rect width="1200" height="800" fill="url(#bg)"/>
    <rect width="1200" height="800" fill="url(#glow)"/>
    <circle cx="980" cy="120" r="190" fill="#22d3ee" opacity="0.17"/>
    <circle cx="210" cy="650" r="250" fill="#a855f7" opacity="0.28"/>
    <rect x="78" y="78" width="1044" height="644" rx="44" fill="#020617" opacity="0.52" filter="url(#shadow)"/>
    <text x="120" y="145" fill="#67e8f9" font-family="Inter, Arial" font-size="28" font-weight="800">AIMediaOS MVP OUTPUT</text>
    <text x="120" y="215" fill="#ffffff" font-family="Inter, Arial" font-size="68" font-weight="900">${safeWorkflow}</text>
    <text x="120" y="275" fill="#c4b5fd" font-family="Inter, Arial" font-size="30" font-weight="700">${safeKind} workflow • local provider</text>
    <foreignObject x="120" y="340" width="960" height="210">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial; color: white; font-size: 38px; line-height: 1.15; font-weight: 800; letter-spacing: -1.5px;">${safePrompt}</div>
    </foreignObject>
    <text x="120" y="650" fill="#e5e7eb" font-family="Inter, Arial" font-size="24">Replace the local provider with Replicate, fal.ai, RunPod, OpenAI, Kling, Runway, or ComfyUI when keys are added.</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid generation request", details: parsed.error.flatten() }, { status: 400 });
  }

  const workflow = getWorkflow(parsed.data.workflowId);
  const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const startedAt = new Date().toISOString();
  const outputUrl = makeSvgDataUrl({
    prompt: `${workflow.systemPrompt}. User prompt: ${parsed.data.prompt}`,
    workflowName: workflow.name,
    kind: workflow.kind
  });

  return NextResponse.json({
    job: {
      id: jobId,
      status: "succeeded",
      provider: "local-svg-demo",
      workflowId: workflow.id,
      workflowName: workflow.name,
      kind: workflow.kind,
      cost: workflow.cost,
      prompt: parsed.data.prompt,
      inputImageUrl: parsed.data.inputImageUrl || null,
      outputUrl,
      startedAt,
      completedAt: new Date().toISOString()
    }
  });
}
