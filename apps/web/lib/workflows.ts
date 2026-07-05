export type WorkflowKind = "image" | "video" | "avatar";

export type Workflow = {
  id: string;
  name: string;
  kind: WorkflowKind;
  cost: number;
  description: string;
  systemPrompt: string;
};

export const workflows: Workflow[] = [
  {
    id: "cinematic-poster",
    name: "Cinematic Poster",
    kind: "image",
    cost: 4,
    description: "Create a premium movie-poster style concept image.",
    systemPrompt: "premium cinematic poster, dramatic lighting, editorial composition, high detail"
  },
  {
    id: "brand-ad",
    name: "Brand Ad Creative",
    kind: "image",
    cost: 5,
    description: "Generate polished ad creative for a product, offer, or brand.",
    systemPrompt: "premium commercial ad creative, clean layout, professional product lighting"
  },
  {
    id: "avatar-profile",
    name: "Avatar Profile",
    kind: "avatar",
    cost: 6,
    description: "Turn a person or character idea into a consistent avatar direction.",
    systemPrompt: "high quality avatar portrait, consistent identity, clean background, expressive"
  },
  {
    id: "image-to-video-plan",
    name: "Image-to-Video Plan",
    kind: "video",
    cost: 8,
    description: "Create a motion plan and video storyboard from a still image idea.",
    systemPrompt: "short AI video plan, camera movement, subject motion, 5 second sequence"
  }
];

export function getWorkflow(id: string) {
  return workflows.find((workflow) => workflow.id === id) ?? workflows[0];
}
