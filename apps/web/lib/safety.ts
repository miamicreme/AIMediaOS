const blockedTerms = [
  "nude",
  "nsfw",
  "porn",
  "sex",
  "explicit",
  "minor",
  "child",
  "underage",
  "deepfake",
  "non-consensual",
  "revenge",
  "gore",
  "bloodbath"
];

export type SafetyResult = {
  allowed: boolean;
  reason?: string;
};

export function validatePromptSafety(prompt: string): SafetyResult {
  const normalized = prompt.toLowerCase();
  const matched = blockedTerms.find((term) => normalized.includes(term));

  if (matched) {
    return {
      allowed: false,
      reason: `Blocked unsafe term: ${matched}`
    };
  }

  return { allowed: true };
}

export function buildSafePrompt(systemPrompt: string, userPrompt: string) {
  return [
    systemPrompt,
    "safe for work, consent-respecting, no explicit sexual content, no impersonation, no minors, no gore",
    `User request: ${userPrompt}`
  ].join(". ");
}
