package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

// @Configuration marks this as a Spring config class that defines @Bean methods.
// @EnableWebSecurity activates Spring Security's web security support and
// tells Spring to use THIS class for all security configuration instead of
// the default "lock everything down" behavior.
//
// WITHOUT THIS CLASS: Every endpoint returns 401 because Spring Security's
// default is to require authentication for everything.
// WITH THIS CLASS: You control exactly which endpoints are public and which
// require specific roles.
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler;

    // CORS origin — defaults to localhost:3000 for dev,
    // set FRONTEND_URL env var in production (e.g. on Render)
    @org.springframework.beans.factory.annotation.Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // This is the CENTRAL security configuration. It defines the entire
    // security behavior of your application.
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // CSRF (Cross-Site Request Forgery) protection is designed for
                // browser-based apps with sessions/cookies. Since your API is
                // stateless and uses JWT tokens (not cookies), CSRF attacks
                // are not possible, so we disable it. If you left it enabled,
                // all your POST requests (like POST /api/v1/reviews) would
                // be rejected with 403 Forbidden.
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())

                // STATELESS session management: tells Spring Security to NEVER
                // create an HTTP session. Every request must carry its own
                // JWT token. This is the correct setting for a REST API.
                // Without this, Spring would create sessions and your API
                // would behave inconsistently.
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // AUTHORIZATION RULES — this is where you map YOUR endpoints
                // to who can access them:
                .authorizeHttpRequests(auth -> auth

                        // "/" — your apiRoot() in TutorRevApplication.java (line 23-26)
                        // This just returns 17, it's a health check — keep it public.
                        .requestMatchers("/").permitAll()

                        // SPA fallback + static frontend assets — must be public so
                        // React index.html, JS/CSS bundles, and the error handler work.
                        .requestMatchers("/error", "/index.html", "/assets/**", "/favicon.ico").permitAll()

                        // Public share endpoints — OG meta pages + card images for
                        // Discord / Twitter / social media embeds (no auth required).
                        .requestMatchers(HttpMethod.GET, "/api/v1/share/**").permitAll()

                        // PUT /api/v1/auth/promote/{username} — admin only
                        // Must come BEFORE the auth wildcard below, otherwise
                        // permitAll() would match first and anyone could promote users.
                        .requestMatchers(HttpMethod.PUT, "/api/v1/auth/promote/**")
                        .hasAuthority("ROLE_ADMIN")

                        // Profile endpoints — must come BEFORE auth/** wildcard
                        .requestMatchers(HttpMethod.PUT, "/api/v1/auth/profile/**")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/profile/**")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/auth/profile/**")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // Batch avatar lookup — authenticated users
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/avatars")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // Heartbeat — any authenticated user (before auth/** wildcard)
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/heartbeat")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // Admin panel endpoints — admin only
                        .requestMatchers("/api/v1/admin/**")
                        .hasAuthority("ROLE_ADMIN")

                        // "/api/v1/auth/**" — the auth endpoints (register, login, logout)
                        // These MUST be public because users can't authenticate
                        // before they've registered or logged in (chicken-and-egg problem).
                        .requestMatchers("/api/v1/auth/**").permitAll()

                        // OAuth2 endpoints — Spring Security's built-in OAuth2 URLs.
                        // "/oauth2/**" handles the redirect to Google.
                        // "/login/**" handles the callback from Google.
                        // These must be public for the Google login flow to work.
                        .requestMatchers("/oauth2/**", "/login/**").permitAll()

                        // YOUR EXISTING ENDPOINT: GET /api/v1/tutorials and GET /api/v1/tutorials/{id}
                        // These are in TutorialController.java (lines 18-29).
                        // After this change, only logged-in users with ROLE_USER or
                        // ROLE_ADMIN can browse tutorials.
                        .requestMatchers(HttpMethod.GET, "/api/v1/tutorials/**")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // POST /api/v1/tutorials — create a new tutorial from a YouTube link
                        .requestMatchers(HttpMethod.POST, "/api/v1/tutorials")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // DELETE /api/v1/tutorials/{id} — admin only
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/tutorials/**")
                        .hasAuthority("ROLE_ADMIN")

                        // GET /api/v1/reviews/user — current user's reviews
                        .requestMatchers(HttpMethod.GET, "/api/v1/reviews/user")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // PUT /api/v1/reviews/{id}/like and /dislike — authenticated users
                        .requestMatchers(HttpMethod.PUT, "/api/v1/reviews/*/like")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/reviews/*/dislike")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // PUT /api/v1/reviews/{id} — edit own review
                        .requestMatchers(HttpMethod.PUT, "/api/v1/reviews/*")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // POST /api/v1/reviews — create a review, authenticated users
                        .requestMatchers(HttpMethod.POST, "/api/v1/reviews")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // DELETE /api/v1/reviews/{reviewId} — owner or admin (enforced in service)
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/reviews/**")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // GET /api/v1/devnotes — all authenticated users can view
                        .requestMatchers(HttpMethod.GET, "/api/v1/devnotes")
                        .hasAnyAuthority("ROLE_USER", "ROLE_ADMIN")

                        // POST /api/v1/devnotes — admin only
                        .requestMatchers(HttpMethod.POST, "/api/v1/devnotes")
                        .hasAuthority("ROLE_ADMIN")

                        // DELETE /api/v1/devnotes/{noteId} — admin only
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/devnotes/**")
                        .hasAuthority("ROLE_ADMIN")

                        // Any other endpoint not listed above requires authentication.
                        // This is a safety net — if you add new endpoints later and
                        // forget to add rules here, they'll be protected by default.
                        .anyRequest().authenticated()
                )

                // GOOGLE OAUTH2 LOGIN: Enables the /oauth2/authorization/google
                // endpoint. When a user visits that URL, Spring redirects them
                // to Google's consent screen. After they approve, Google redirects
                // back to your app, and oAuth2LoginSuccessHandler runs to create
                // a JWT token for the Google user.
                .oauth2Login(oauth2 -> oauth2
                        .successHandler(oAuth2LoginSuccessHandler)
                )

                // INSERT our JWT filter BEFORE Spring's default username/password filter.
                // This is critical — our filter runs first, checks for a JWT token,
                // and sets up the authentication. If we added it AFTER, Spring's
                // default filter would reject the request before ours could run.
                .addFilterBefore(jwtAuthFilter,
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // BCrypt password encoder — this is the industry standard for hashing passwords.
    // BCrypt automatically adds a random salt and is intentionally slow,
    // making brute-force attacks impractical. When a user registers with
    // password "mypass123", BCrypt produces something like:
    // "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAg..."
    // The original password CANNOT be recovered from this hash.
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // The AuthenticationManager coordinates the login process. When you call
    // authenticationManager.authenticate(username, password) in the AuthController,
    // it internally:
    // 1. Calls CustomUserDetailsService.loadUserByUsername()
    // 2. Gets the stored BCrypt hash
    // 3. Hashes the provided password and compares
    // 4. Returns success or throws BadCredentialsException
    //
    // We expose it as a @Bean so the AuthController can @Autowired it.
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    // CORS configuration — allows your React frontend (localhost:3000)
    // to call your API (localhost:8080). Without this, the browser
    // blocks all cross-origin requests with a CORS error.
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(frontendUrl));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
