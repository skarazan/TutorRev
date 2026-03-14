const BLOCKED_WORDS = new Set([
  "fuck", "shit", "ass", "bitch", "damn",
  "bastard", "dick", "pussy", "cock", "cunt",
  "fag", "faggot", "nigger", "nigga", "retard",
  "slut", "whore", "piss", "bollocks", "wanker",
  "twat", "asshole", "motherfucker", "bullshit"
]);

export function containsProfanity(text) {
  if (!text) return false;
  const words = text.toLowerCase().split(/[^a-zA-Z]+/);
  return words.some((word) =>
    BLOCKED_WORDS.has(word) || [...BLOCKED_WORDS].some((bw) => word.includes(bw))
  );
}
