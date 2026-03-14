package dev.tutorRev.TutorRev;

import java.util.Set;

public final class ProfanityFilter {

    private ProfanityFilter() {}

    private static final Set<String> BLOCKED_WORDS = Set.of(
        "fuck", "shit", "ass", "bitch", "damn",
        "bastard", "dick", "pussy", "cock", "cunt",
        "fag", "faggot", "nigger", "nigga", "retard",
        "slut", "whore", "piss", "bollocks", "wanker",
        "twat", "asshole", "motherfucker", "bullshit",
            "arsewipe","arseface","arsehat","arsebag",
            "balls","ballbag","ballface","balllicker",
            "bitchface","bitchboy","bitchmade","bitching",
            "blowjob","blowjobs",
            "boner","boners",
            "butthead","buttfuck","buttfucker","butthole","buttface","buttwipe",
            "chode","choad",
            "clit","clitoris",
            "cockbite","cockblock","cockblocked","cockblocking",
            "cockholster","cockmaster","cockmuncher","cocknose",
            "cocksmoker","cocktease","cockwaffle",
            "cum","cumming","cumshot","cumshots","cumbucket","cumdumpster","cumface",
            "dickhole","dickweed","dickwad","dicklicker","dickmaster",
            "dildo","dildos",
            "dingleberry",
            "dumbshit","dogshit",
            "douchecanoe","douchelord","doucheface",
            "fap","fapping","fapper",
            "fistfuck","fistfucker",
            "fuckbag","fuckbrain","fucknut","fuckstick","fucktard","fuckup",
            "gayass","gaylord",
            "hellshit",
            "horndog","horny",
            "jackoff","jackoffs",
            "jerk","jerkface","jerkass",
            "knob","knobhead","knobface",
            "loserass",
            "motherfucking","motherfucked",
            "nutjob","nutsack",
            "pecker","peckerhead",
            "penis","penises",
            "pissface","pisshead","pissbrain",
            "porn","porno","pornstar","pornstars",
            "prat","pratface",
            "scrote","scrotum",
            "sex","sexy",
            "shitbagger","shitbucket","shitdick","shitface","shitfuck","shitlord",
            "shitmouth","shitpants","shitstick",
            "skank","skanky",
            "slutbag","slutface",
            "smegma",
            "suckmydick","suckmyass",
            "tit","tits","titty","titties","titface",
            "tosser",
            "twatwaffle",
            "vagina","vaginas",
            "wank","wanked","wanking","wankstain",
            "whorebag","whoreface"

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
