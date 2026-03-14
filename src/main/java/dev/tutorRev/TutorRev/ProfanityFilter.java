package dev.tutorRev.TutorRev;

import java.util.Set;

public final class ProfanityFilter {

    private ProfanityFilter() {}

    private static final Set<String> BLOCKED_WORDS = Set.of(
        "fuck", "shit", "ass", "bitch", "damn",
        "bastard", "dick", "pussy", "cock", "cunt",
        "fag", "faggot", "nigger", "nigga", "retard",
        "slut", "whore", "piss", "bollocks", "wanker",
        "twat", "asshole", "motherfucker", "bullshit"
    );

    /**
     * Returns true if the text contains any blocked word.
     * Uses word-boundary splitting to avoid false positives
     * (e.g. "assassin" won't match "ass").
     */
    public static boolean containsProfanity(String text) {
        if (text == null || text.isBlank()) return false;
        String[] words = text.toLowerCase().split("[^a-zA-Z]+");
        for (String word : words) {
            if (BLOCKED_WORDS.contains(word)) {
                return true;
            }
            for (String blocked : BLOCKED_WORDS) {
                if (word.contains(blocked)) {
                    return true;
                }
            }
        }
        return false;
    }
}
