import type { Workflow } from "./workflows";

export type ProviderResult = {
  provider: "live-image-api" | "local-svg-demo";
  outputUrl: string;
  mimeType: string;
  fileExtension: "png" | "svg";
  model: string;
  usedLiveProvider: boolean;
};

type GenerateArgs = {
  workflow: Workflow;
  prompt: string;
};

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .slice(0, 220);
}

function makeSvgDataUrl({ prompt, workflow }: GenerateArgs) {
  const safePrompt = escapeXml(prompt);
  const safeWorkflow = escapeXml(workflow.name);
  const safeCategory = escapeXml(workflow.category.toUpperCase());
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#0f172a"/>
        <stop offset="42%" stop-color="#581c87"/>
        <stop offset="100%" stop-color="#0e7490"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="70%">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.38"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </radialGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#000000" flood-opacity="0.55"/></filter>
    </defs>
    <rect width="1200" height="800" fill="url(#bg)"/>
    <rect width="1200" height="800" fill="url(#glow)"/>
    <circle cx="1040" cy="100" r="220" fill="#22d3ee" opacity="0.16"/>
    <circle cx="190" cy="680" r="280" fill="#a855f7" opacity="0.26"/>
    <rect x="72" y="72" width="1056" height="656" rx="46" fill="#020617" opacity="0.58" filter="url(#shadow)"/>
    <text x="120" y="145" fill="#67e8f9" font-family="Inter, Arial" font-size="28" font-weight="900">AIMediaOS GENERATED ASSET</text>
    <text x="120" y="220" fill="#ffffff" font-family="Inter, Arial" font-size="66" font-weight="900">${safeWorkflow}</text>
    <text x="120" y="280" fill="#c4b5fd" font-family="Inter, Arial" font-size="28" font-weight="800">${safeCategory} • ${workflow.kind.toUpperCase()} • LOCAL FALLBACK</text>
    <foreignObject x="120" y="345" width="960" height="220">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, Arial; color: white; font-size: 38px; line-height: 1.12; font-weight: 850; letter-spacing: -1.4px;">${safePrompt}</div>
    </foreignObject>
    <text x="120" y="665" fill="#e5e7eb" font-family="Inter, Arial" font-size="23">Live provider not configured. Add a server image endpoint later and this same app will return real AI images.</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function tryLiveImageProvider(args: GenerateArgs): Promise<ProviderResult | null> {
  const endpoint = process.env.AIMEDIA_IMAGE_ENDPOINT;
  const token = process.env.AIMEDIA_IMAGE_TOKEN;

  if (!endpoint || !token || args.workflow.kind !== "image") {
    return null;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt: args.prompt,
      workflow: args.workflow.id,
      size: "1024x1024"
    })
  });

  if (!response.ok) {
    throw new Error(`Live provider failed with ${response.status}`);
  }

  const data = await response.json();
  const imageUrl = data.outputUrl ?? data.imageUrl ?? data.url;

  if (!imageUrl || typeof imageUrl !== "string") {
    throw new Error("Live provider did not return an image URL");
  }

  return {
    provider: "live-image-api",
    outputUrl: imageUrl,
    mimeType: "image/png",
    fileExtension: "png",
    model: data.model ?? "external-image-provider",
    usedLiveProvider: true
  };
}

export async function generateMedia(args: GenerateArgs): Promise<ProviderResult> {
  const liveResult = await tryLiveImageProvider(args);

  if (liveResult) {
    return liveResult;
  }

  return {
    provider: "local-svg-demo",
    outputUrl: makeSvgDataUrl(args),
    mimeType: "image/svg+xml",
    fileExtension: "svg",
    model: "local-template-renderer",
    usedLiveProvider: false
  };
}
