package dev.tutorRev.TutorRev;

import java.util.regex.Pattern;

/**
 * Centralized input validation for all user-submitted data.
 * All validation rules are defined here so they stay consistent
 * across registration, profile changes, and reviews.
 */
public final class InputValidator {

    private InputValidator() {} // utility class

    // ── Username ──────────────────────────────────────────────
    public static final int USERNAME_MIN = 3;
    public static final int USERNAME_MAX = 20;
    // Only letters, digits, underscores, hyphens
    private static final Pattern USERNAME_PATTERN =
            Pattern.compile("^[a-zA-Z0-9_-]+$");

    public static String validateUsername(String username) {
        if (username == null || username.isBlank()) {
            return "Username is required";
        }
        username = username.trim();
        if (username.length() < USERNAME_MIN) {
            return "Username must be at least " + USERNAME_MIN + " characters";
        }
        if (username.length() > USERNAME_MAX) {
            return "Username cannot exceed " + USERNAME_MAX + " characters";
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            return "Username can only contain letters, numbers, underscores, and hyphens";
        }
        return null; // valid
    }

    // ── Email ─────────────────────────────────────────────────
    // RFC‑5322 simplified — covers 99.9% of real addresses
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$");

    public static String validateEmail(String email) {
        if (email == null || email.isBlank()) {
            return "Email is required";
        }
        email = email.trim();
        if (email.length() > 254) {
            return "Email address is too long";
        }
        if (!EMAIL_PATTERN.matcher(email).matches()) {
            return "Invalid email format";
        }
        return null; // valid
    }

    // ── Password ──────────────────────────────────────────────
    public static final int PASSWORD_MIN = 8;

    public static String validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            return "Password is required";
        }
        if (password.length() < PASSWORD_MIN) {
            return "Password must be at least " + PASSWORD_MIN + " characters";
        }
        if (password.length() > 128) {
            return "Password cannot exceed 128 characters";
        }
        return null; // valid
    }

    // ── Review body ───────────────────────────────────────────
    public static final int REVIEW_MIN = 10;
    public static final int REVIEW_MAX = 2000;

    public static String validateReviewBody(String body) {
        if (body == null || body.isBlank()) {
            return "Review body is required";
        }
        body = body.trim();
        if (body.length() < REVIEW_MIN) {
            return "Review must be at least " + REVIEW_MIN + " characters";
        }
        if (body.length() > REVIEW_MAX) {
            return "Review cannot exceed " + REVIEW_MAX + " characters";
        }
        return null; // valid
    }

    // ── HTML / script stripping ──────────────────────────────
    // Removes <tags> and common script patterns from user input.
    // Not meant to be a full XSS sanitizer (React already escapes
    // on render), but prevents stored payloads in the DB.
    private static final Pattern HTML_TAGS = Pattern.compile("<[^>]*>");

    public static String stripHtml(String input) {
        if (input == null) return null;
        return HTML_TAGS.matcher(input).replaceAll("").trim();
    }
}
