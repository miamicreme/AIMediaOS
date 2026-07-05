import type { CreativeEffect } from "@aimediaos/shared";

/**
 * First MVP effect catalog per README: "select a safe creative effect".
 * Each effect should map to a real provider adapter before shipping.
 */
export const effects: CreativeEffect[] = [
  {
    id: "portrait-glow",
    label: "Portrait Glow",
    description: "Soft cinematic lighting pass for portraits.",
    kind: "image",
  },
  {
    id: "anime-style",
    label: "Anime Style",
    description: "Restyle a photo into an anime-inspired look.",
    kind: "image",
  },
  {
    id: "gentle-motion",
    label: "Gentle Motion",
    description: "Turn a still image into a short looping video.",
    kind: "video",
  },
];

export function getEffectById(id: string): CreativeEffect | undefined {
  return effects.find((effect) => effect.id === id);
}
