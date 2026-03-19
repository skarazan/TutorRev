package dev.tutorRev.TutorRev;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * SPA fallback — when Spring can't find a matching route (404),
 * serve index.html so the React client-side router can handle it.
 *
 * Without this, navigating directly to /dashboard or /tutorials/xyz
 * would return 404 or the Whitelabel Error Page because Spring has
 * no controller mapped to those SPA routes.
 */
@Controller
public class SpaForwardController implements ErrorController {

    @GetMapping("/error")
    public String handleError(HttpServletRequest request) {
        // Forward to index.html so React Router can resolve the path
        return "forward:/index.html";
    }
}
