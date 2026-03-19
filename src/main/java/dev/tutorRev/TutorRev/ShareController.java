package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.geom.Path2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Public controller for shareable review links.
 * Serves OG-meta HTML pages and server-side rendered card PNGs
 * so that Discord / Twitter / etc. can generate rich embeds.
 */
@RestController
@RequestMapping("/api/v1/share")
public class ShareController {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private TutorialsRepository tutorialsRepository;

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // ── Colours (matching the client-side Canvas card) ──────
    private static final Color BG_TOP      = new Color(0x1c, 0x17, 0x14);
    private static final Color BG_BOTTOM   = new Color(0x11, 0x0f, 0x0d);
    private static final Color ACCENT_L    = new Color(0x8B, 0x6B, 0x4A);
    private static final Color ACCENT_R    = new Color(0xC4, 0x95, 0x6A);
    private static final Color DIVIDER     = new Color(0x2a, 0x25, 0x20);
    private static final Color STAR_EMPTY  = new Color(0x2a, 0x25, 0x20);
    private static final Color TEXT_BODY   = new Color(0xe8, 0xe0, 0xd6);
    private static final Color WATERMARK   = new Color(0x3a, 0x35, 0x30);
    private static final Color QUOTE_MARK  = new Color(0x8B, 0x6B, 0x4A, 0x1F); // 12 % alpha

    // ── Card dimensions ────────────────────────────────────
    private static final int W   = 600;
    private static final int H   = 340;
    private static final int PAD = 32;

    /* ─────────────────────────────────────────────────────────
       GET /api/v1/share/review/{reviewId}/card.png
       Returns a server-rendered PNG card for the review.
       ───────────────────────────────────────────────────────── */
    @GetMapping(value = "/review/{reviewId}/card.png", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> reviewCardPng(@PathVariable String reviewId) {
        ObjectId objId;
        try { objId = new ObjectId(reviewId); }
        catch (Exception e) { return ResponseEntity.notFound().build(); }

        Optional<Reviews> opt = reviewRepository.findById(objId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Reviews review = opt.get();

        // Find the parent tutorial
        Optional<Tutorials> tutOpt = tutorialsRepository.findByReviewIdsContaining(objId);
        String tutorialTitle = tutOpt.map(Tutorials::getTitle).orElse("Tutorial Review");

        byte[] png = renderCard(review, tutorialTitle);
        if (png == null) return ResponseEntity.status(500).build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.IMAGE_PNG);
        headers.setCacheControl(CacheControl.maxAge(java.time.Duration.ofHours(1)).cachePublic());
        return new ResponseEntity<>(png, headers, HttpStatus.OK);
    }

    /* ─────────────────────────────────────────────────────────
       GET /api/v1/share/review/{reviewId}
       Returns an HTML page with OG meta tags for rich embeds,
       and a JS redirect to the actual tutorial page.
       ───────────────────────────────────────────────────────── */
    @GetMapping(value = "/review/{reviewId}", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> reviewOgPage(@PathVariable String reviewId,
                                               HttpServletRequest request) {
        ObjectId objId;
        try { objId = new ObjectId(reviewId); }
        catch (Exception e) { return ResponseEntity.notFound().build(); }

        Optional<Reviews> opt = reviewRepository.findById(objId);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();
        Reviews review = opt.get();

        // Find the parent tutorial
        Optional<Tutorials> tutOpt = tutorialsRepository.findByReviewIdsContaining(objId);
        String tutorialTitle = tutOpt.map(Tutorials::getTitle).orElse("Tutorial Review");
        String tutorialId = tutOpt.map(Tutorials::getId).orElse("");

        // Derive the backend's own public URL from the incoming request.
        // On Render the X-Forwarded-* headers give us the real scheme + host.
        String scheme = request.getHeader("X-Forwarded-Proto");
        if (scheme == null) scheme = request.getScheme();
        String host = request.getHeader("X-Forwarded-Host");
        if (host == null) host = request.getHeader("Host");
        if (host == null) host = request.getServerName() + ":" + request.getServerPort();
        String apiBase = scheme + "://" + host;

        String apiCardUrl = apiBase + "/api/v1/share/review/" + reviewId + "/card.png";

        // Redirect target — the React SPA on the frontend domain
        String feBase = frontendUrl.replaceAll("/+$", "");
        String redirectUrl = feBase + "/tutorials/" + tutorialId + "#review-" + reviewId;

        // Truncate body for description
        String desc = review.getBody();
        if (desc.length() > 200) desc = desc.substring(0, 197) + "...";
        desc = desc.replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");
        String safeTitle = tutorialTitle.replace("\"", "&quot;").replace("<", "&lt;").replace(">", "&gt;");

        String stars = "★".repeat(Math.max(0, Math.min(5, review.getRating())))
                     + "☆".repeat(Math.max(0, 5 - review.getRating()));

        String html = "<!DOCTYPE html><html><head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta property=\"og:type\" content=\"article\" />"
                + "<meta property=\"og:title\" content=\"" + stars + " Review on TutorRev\" />"
                + "<meta property=\"og:description\" content=\"" + desc + " — " + review.getUsername() + "\" />"
                + "<meta property=\"og:image\" content=\"" + apiCardUrl + "\" />"
                + "<meta property=\"og:image:width\" content=\"600\" />"
                + "<meta property=\"og:image:height\" content=\"340\" />"
                + "<meta property=\"og:url\" content=\"" + apiBase + "/api/v1/share/review/" + reviewId + "\" />"
                + "<meta property=\"og:image:type\" content=\"image/png\" />"
                + "<meta property=\"og:site_name\" content=\"TutorRev\" />"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\" />"
                + "<meta name=\"twitter:title\" content=\"" + stars + " Review on TutorRev\" />"
                + "<meta name=\"twitter:description\" content=\"" + desc + "\" />"
                + "<meta name=\"twitter:image\" content=\"" + apiCardUrl + "\" />"
                + "<meta name=\"theme-color\" content=\"#8B6B4A\" />"
                + "<title>" + safeTitle + " — Review on TutorRev</title>"
                + "<script>window.location.replace(\"" + redirectUrl + "\");</script>"
                + "</head><body style=\"background:#1c1714;color:#e8e0d6;font-family:system-ui;padding:40px;text-align:center;\">"
                + "<p>Redirecting to TutorRev...</p>"
                + "<p style=\"margin-top:12px;\"><a href=\"" + redirectUrl + "\" style=\"color:#C4956A;\">Click here if not redirected</a></p>"
                + "</body></html>";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.TEXT_HTML);
        headers.setCacheControl(CacheControl.maxAge(java.time.Duration.ofMinutes(10)).cachePublic());
        return new ResponseEntity<>(html, headers, HttpStatus.OK);
    }

    // ── Server-side card rendering ──────────────────────────

    private byte[] renderCard(Reviews review, String tutorialTitle) {
        BufferedImage img = new BufferedImage(W, H, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();

        // Anti-aliasing
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_LCD_HRGB);

        // ── Background gradient
        GradientPaint bgGrad = new GradientPaint(0, 0, BG_TOP, W, H, BG_BOTTOM);
        g.setPaint(bgGrad);
        g.fillRect(0, 0, W, H);

        // ── Top accent bar
        GradientPaint accentGrad = new GradientPaint(0, 0, ACCENT_L, W, 0, ACCENT_R);
        g.setPaint(accentGrad);
        g.fillRect(0, 0, W, 3);

        // ── Decorative quote mark
        g.setColor(QUOTE_MARK);
        g.setFont(new Font(Font.SERIF, Font.BOLD, 120));
        g.drawString("\u201C", PAD - 10, 110);

        // ── Tutorial title
        g.setColor(ACCENT_L);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 12));
        String title = tutorialTitle;
        if (title.length() > 70) title = title.substring(0, 67) + "...";
        g.drawString(title.toUpperCase(), PAD, 34);

        // ── Divider
        g.setColor(DIVIDER);
        g.setStroke(new BasicStroke(1));
        g.drawLine(PAD, 46, W - PAD, 46);

        // ── Stars
        for (int i = 0; i < 5; i++) {
            g.setColor(i < review.getRating() ? ACCENT_R : STAR_EMPTY);
            fillStar(g, PAD + 10 + i * 24, 66, 9);
        }

        // ── Review body (word-wrapped, max 7 lines)
        g.setColor(TEXT_BODY);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 15));
        List<String> lines = wrapText(g, review.getBody(), W - PAD * 2, 7);
        int y = 100;
        for (String line : lines) {
            g.drawString(line, PAD, y);
            y += 22;
        }

        // ── Bottom section
        int bottomY = H - 28;

        // Username
        g.setColor(ACCENT_R);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 13));
        String user = "— " + (review.getUsername() != null ? review.getUsername() : "Anonymous");
        g.drawString(user, PAD, bottomY);

        // Watermark
        g.setColor(WATERMARK);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 13));
        String wm = "TutorRev.live";
        int wmW = g.getFontMetrics().stringWidth(wm);
        g.drawString(wm, W - wmW - PAD, bottomY);

        // ── Bottom accent bar
        g.setPaint(accentGrad);
        g.fillRect(0, H - 3, W, 3);

        g.dispose();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(img, "png", baos);
            return baos.toByteArray();
        } catch (Exception e) {
            return null;
        }
    }

    /** Draw a filled 5-pointed star */
    private void fillStar(Graphics2D g, double cx, double cy, double r) {
        double innerR = r * 0.45;
        Path2D path = new Path2D.Double();
        for (int i = 0; i < 10; i++) {
            double radius = (i % 2 == 0) ? r : innerR;
            double angle = (i * Math.PI / 5) - Math.PI / 2;
            double x = cx + radius * Math.cos(angle);
            double y = cy + radius * Math.sin(angle);
            if (i == 0) path.moveTo(x, y);
            else path.lineTo(x, y);
        }
        path.closePath();
        g.fill(path);
    }

    /** Word-wrap text to fit within maxWidth, up to maxLines. */
    private List<String> wrapText(Graphics2D g, String text, int maxWidth, int maxLines) {
        FontMetrics fm = g.getFontMetrics();
        String[] words = text.split(" ");
        List<String> lines = new ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (String word : words) {
            String test = current.length() > 0 ? current + " " + word : word;
            if (fm.stringWidth(test) > maxWidth && current.length() > 0) {
                lines.add(current.toString());
                current = new StringBuilder(word);
                if (lines.size() >= maxLines) {
                    lines.set(lines.size() - 1, lines.get(lines.size() - 1) + "...");
                    return lines;
                }
            } else {
                current = new StringBuilder(test);
            }
        }
        if (current.length() > 0) {
            if (lines.size() >= maxLines) {
                lines.set(lines.size() - 1, lines.get(lines.size() - 1) + "...");
            } else {
                lines.add(current.toString());
            }
        }
        return lines;
    }
}
