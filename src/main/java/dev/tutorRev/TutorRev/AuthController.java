package dev.tutorRev.TutorRev;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.Map;
import java.util.Random;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

    @Autowired
    private RateLimitService rateLimitService;

    private final Random random = new Random();

    private String generateVerificationCode() {
        int code = 100000 + random.nextInt(900000); // 6-digit code
        return String.valueOf(code);
    }

    // =========================================================
    // REGISTER: POST /api/v1/auth/register
    // Creates user, sends 6-digit verification code to email.
    // Does NOT issue a JWT — user must verify email first.
    // =========================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload,
                                       HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.tryConsumeByIp("register", clientIp, 5, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many registration attempts. Please try again later."));
        }

        String username = payload.get("username");
        String email = payload.get("email");
        String password = payload.get("password");

        if (username == null || email == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "username, email, and password are required"));
        }

        if (ProfanityFilter.containsProfanity(username)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username contains inappropriate language"));
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already taken"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }

        // Build and save user (unverified)
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setProvider("local");
        user.setEmailVerified(false);

        Set<Role> roles = new HashSet<>();
        roles.add(Role.ROLE_USER);
        user.setRoles(roles);

        // Generate 6-digit verification code
        String code = generateVerificationCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));

        userRepository.save(user);

        // Send verification email
        emailService.sendVerificationCode(email, code);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "Registration successful! Check your email for a verification code.",
                    "email", email
                ));
    }

    // =========================================================
    // VERIFY CODE: POST /api/v1/auth/verify-code
    // Body: { "email": "...", "code": "123456" }
    // =========================================================
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody Map<String, String> payload,
                                         HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.tryConsumeByIp("verify", clientIp, 5, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many verification attempts. Please try again later."));
        }

        String email = payload.get("email");
        String code = payload.get("code");

        if (email == null || code == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email and code are required"));
        }

        User user = userRepository.findByEmailAndVerificationCode(email, code).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid verification code"));
        }

        if (user.getVerificationCodeExpiry().isBefore(Instant.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Verification code has expired. Please request a new one."));
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Email verified successfully! You can now log in."));
    }

    // =========================================================
    // RESEND CODE: POST /api/v1/auth/resend-code
    // Body: { "email": "..." }
    // =========================================================
    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody Map<String, String> payload,
                                         HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.tryConsumeByIp("resend", clientIp, 3, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required"));
        }

        // Intentionally vague response to prevent email enumeration
        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null && !user.isEmailVerified()) {
            String code = generateVerificationCode();
            user.setVerificationCode(code);
            user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
            userRepository.save(user);
            emailService.sendVerificationCode(email, code);
        }

        return ResponseEntity.ok(
                Map.of("message", "If that email is registered, a new verification code has been sent."));
    }

    // =========================================================
    // LOGIN: POST /api/v1/auth/login
    // =========================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload,
                                    HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.tryConsumeByIp("login", clientIp, 10, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many login attempts. Please try again later."));
        }

        String username = payload.get("username");
        String password = payload.get("password");

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        // Check email verification for local users
        User user = userRepository.findByUsername(username).orElse(null);
        if (user != null && "local".equals(user.getProvider()) && !user.isEmailVerified()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                        "error", "Please verify your email before logging in.",
                        "email", user.getEmail()
                    ));
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtUtil.generateToken(userDetails.getUsername());

        return ResponseEntity.ok(Map.of("token", token, "username", username));
    }

    // =========================================================
    // LOGOUT: POST /api/v1/auth/logout
    // =========================================================
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully. Discard the token on the client."));
    }

    // =========================================================
    // PROMOTE: PUT /api/v1/auth/promote/{username}
    // =========================================================
    @PutMapping("/promote/{targetUsername}")
    public ResponseEntity<?> promoteToAdmin(@PathVariable String targetUsername) {
        User user = userRepository.findByUsername(targetUsername).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        user.getRoles().add(Role.ROLE_ADMIN);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", targetUsername + " is now an admin"));
    }

    // =========================================================
    // GET CURRENT USER: GET /api/v1/auth/me
    // =========================================================
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email", user.getEmail(),
                "roles", user.getRoles().stream().map(Enum::name).toList(),
                "provider", user.getProvider() != null ? user.getProvider() : "local"
        ));
    }
}
