import type { CreativeEffect, MediaKind, WorkflowId } from "@aimediaos/shared";

export interface WorkflowDefinition {
  id: WorkflowId;
  label: string;
  category: "image" | "video" | "makeover";
  kind: MediaKind;
  description: string;
  requiredInputs: Array<"prompt" | "image">;
  defaultModel: string;
  provider: "seedream" | "runpod";
  creditCost: number;
}

export const workflows: WorkflowDefinition[] = [
  {
    id: "ai-clothes-changer",
    label: "AI Clothes Changer",
    category: "makeover",
    kind: "image",
    description: "Change clothing from an uploaded person image using a real image-editing provider.",
    requiredInputs: ["image", "prompt"],
    defaultModel: "seedream-4.5",
    provider: "seedream",
    creditCost: 4,
  },
  {
    id: "image-to-image",
    label: "Image to Image",
    category: "image",
    kind: "image",
    description: "Transform an uploaded image with a prompt using a real image-editing provider.",
    requiredInputs: ["image", "prompt"],
    defaultModel: "seedream-4.5",
    provider: "seedream",
    creditCost: 4,
  },
  {
    id: "text-to-image",
    label: "Text to Image",
    category: "image",
    kind: "image",
    description: "Generate an image from a text prompt using a real image provider.",
    requiredInputs: ["prompt"],
    defaultModel: "seedream-4.5",
    provider: "seedream",
    creditCost: 4,
  },
  {
    id: "image-to-video",
    label: "Image to Video",
    category: "video",
    kind: "video",
    description: "Turn an uploaded image into a video through an async provider job.",
    requiredInputs: ["image", "prompt"],
    defaultModel: "runpod-image-to-video",
    provider: "runpod",
    creditCost: 24,
  },
];

export function getWorkflowById(id: string): WorkflowDefinition | undefined {
  return workflows.find((workflow) => workflow.id === id);
}

export const effects: CreativeEffect[] = workflows.map((workflow) => ({
  id: workflow.id,
  label: workflow.label,
  description: workflow.description,
  kind: workflow.kind,
}));

export function getEffectById(id: string): CreativeEffect | undefined {
  return effects.find((effect) => effect.id === id);
}
