package dev.tutorRev.TutorRev;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
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
import java.util.*;
import java.util.stream.Collectors;

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

    @Autowired
    private MongoTemplate mongoTemplate;

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

        // Input validation
        String usernameErr = InputValidator.validateUsername(username);
        if (usernameErr != null) {
            return ResponseEntity.badRequest().body(Map.of("error", usernameErr));
        }

        String emailErr = InputValidator.validateEmail(email);
        if (emailErr != null) {
            return ResponseEntity.badRequest().body(Map.of("error", emailErr));
        }

        String passwordErr = InputValidator.validatePassword(password);
        if (passwordErr != null) {
            return ResponseEntity.badRequest().body(Map.of("error", passwordErr));
        }

        username = username.trim();
        email = email.trim();

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

        if (userRepository.existsByEmailAndBannedTrue(email)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "This email has been restricted from registration."));
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
    // FORGOT PASSWORD: POST /api/v1/auth/forgot-password
    // Body: { "email": "..." }
    // Public — sends a reset code to the email if it exists.
    // =========================================================
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> payload,
                                             HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.tryConsumeByIp("forgot-pw", clientIp, 3, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required"));
        }

        User user = userRepository.findByEmail(email.trim()).orElse(null);

        if (user != null && user.isBanned()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "This account has been banned."));
        }

        // Only allow for local accounts (Google users reset via Google)
        if (user != null && !"local".equals(user.getProvider())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "This account uses Google sign-in. Please reset your password through Google."));
        }

        if (user != null) {
            String code = generateVerificationCode();
            user.setVerificationCode(code);
            user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
            userRepository.save(user);
            emailService.sendPasswordResetCode(email, code);
        }

        // Intentionally vague to prevent email enumeration
        return ResponseEntity.ok(
                Map.of("message", "If that email is registered, a password reset code has been sent."));
    }

    // =========================================================
    // RESET PASSWORD: POST /api/v1/auth/reset-password
    // Body: { "email": "...", "code": "123456", "newPassword": "..." }
    // Public — verifies code and sets new password.
    // =========================================================
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> payload,
                                            HttpServletRequest request) {
        String clientIp = request.getRemoteAddr();
        if (!rateLimitService.tryConsumeByIp("reset-pw", clientIp, 5, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many attempts. Please try again later."));
        }

        String email = payload.get("email");
        String code = payload.get("code");
        String newPassword = payload.get("newPassword");

        if (email == null || code == null || newPassword == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email, code, and new password are required"));
        }

        String pwErr = InputValidator.validatePassword(newPassword);
        if (pwErr != null) {
            return ResponseEntity.badRequest().body(Map.of("error", pwErr));
        }

        User user = userRepository.findByEmail(email.trim()).orElse(null);

        if (user == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid email or verification code"));
        }

        if (user.isBanned()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "This account has been banned."));
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid verification code"));
        }

        if (user.getVerificationCodeExpiry().isBefore(Instant.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Verification code has expired. Please request a new one."));
        }

        // Prevent reusing the same password
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New password cannot be the same as your current password"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password reset successful! You can now log in."));
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

        // Check if user is banned
        if (user != null && user.isBanned()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Your account has been banned."));
        }

        // Set lastSeen on login
        if (user != null) {
            user.setLastSeen(Instant.now());
            userRepository.save(user);
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

        Map<String, Object> response = new HashMap<>();
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("roles", user.getRoles().stream().map(Enum::name).toList());
        response.put("provider", user.getProvider() != null ? user.getProvider() : "local");
        response.put("profilePicture", user.getProfilePicture());
        return ResponseEntity.ok(response);
    }

    // =========================================================
    // CHANGE USERNAME: PUT /api/v1/auth/profile/username
    // Body: { "newUsername": "..." }
    // Cascades to all reviews by this user.
    // =========================================================
    @PutMapping("/profile/username")
    public ResponseEntity<?> changeUsername(@RequestBody Map<String, String> payload,
                                            Authentication authentication) {
        String currentUsername = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("change-username", currentUsername, 5, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        String newUsername = payload.get("newUsername");

        String usernameErr = InputValidator.validateUsername(newUsername);
        if (usernameErr != null) {
            return ResponseEntity.badRequest().body(Map.of("error", usernameErr));
        }

        newUsername = newUsername.trim();

        if (newUsername.equals(currentUsername)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "New username is the same as current"));
        }

        if (ProfanityFilter.containsProfanity(newUsername)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username contains inappropriate language"));
        }

        if (userRepository.existsByUsername(newUsername)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already taken"));
        }

        User user = userRepository.findByUsername(currentUsername).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        // Update username on user document
        user.setUsername(newUsername);
        userRepository.save(user);

        // Cascade: update username on all reviews by this user
        mongoTemplate.updateMulti(
                org.springframework.data.mongodb.core.query.Query.query(
                        Criteria.where("username").is(currentUsername)),
                new Update().set("username", newUsername),
                Reviews.class
        );

        // Issue a new JWT with the updated username
        String newToken = jwtUtil.generateToken(newUsername);

        return ResponseEntity.ok(Map.of(
                "message", "Username updated successfully",
                "username", newUsername,
                "token", newToken
        ));
    }

    // =========================================================
    // REQUEST PASSWORD CHANGE CODE:
    // POST /api/v1/auth/profile/request-password-change
    // Sends a 6-digit code to the user's email.
    // =========================================================
    @PostMapping("/profile/request-password-change")
    public ResponseEntity<?> requestPasswordChange(Authentication authentication) {
        String username = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("req-pw-change", username, 3, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        String code = generateVerificationCode();
        user.setVerificationCode(code);
        user.setVerificationCodeExpiry(Instant.now().plus(15, ChronoUnit.MINUTES));
        userRepository.save(user);

        emailService.sendPasswordChangeCode(user.getEmail(), code);

        return ResponseEntity.ok(Map.of("message", "Verification code sent to your email"));
    }

    // =========================================================
    // CHANGE PASSWORD: PUT /api/v1/auth/profile/password
    // Body: { "code": "123456", "newPassword": "..." }
    // =========================================================
    @PutMapping("/profile/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> payload,
                                             Authentication authentication) {
        String username = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("change-password", username, 5, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        String code = payload.get("code");
        String newPassword = payload.get("newPassword");

        if (code == null || newPassword == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Code and new password are required"));
        }

        String pwErr = InputValidator.validatePassword(newPassword);
        if (pwErr != null) {
            return ResponseEntity.badRequest().body(Map.of("error", pwErr));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        if (user.getVerificationCode() == null || !user.getVerificationCode().equals(code)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid verification code"));
        }

        if (user.getVerificationCodeExpiry().isBefore(Instant.now())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Verification code has expired. Please request a new one."));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setVerificationCode(null);
        user.setVerificationCodeExpiry(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Password changed successfully"));
    }

    // =========================================================
    // UPLOAD PROFILE PICTURE: PUT /api/v1/auth/profile/picture
    // Body: { "profilePicture": "data:image/jpeg;base64,..." }
    // =========================================================
    @PutMapping("/profile/picture")
    public ResponseEntity<?> uploadProfilePicture(@RequestBody Map<String, String> payload,
                                                   Authentication authentication) {
        String username = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("upload-picture", username, 5, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many requests. Please try again later."));
        }

        String profilePicture = payload.get("profilePicture");
        if (profilePicture == null || profilePicture.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Profile picture data is required"));
        }

        if (!profilePicture.startsWith("data:image/")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid image format"));
        }

        // ~700KB Base64 string ≈ ~500KB image
        if (profilePicture.length() > 700_000) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Image is too large. Maximum size is 500KB."));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        user.setProfilePicture(profilePicture);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Profile picture updated"));
    }

    // =========================================================
    // DELETE PROFILE PICTURE: DELETE /api/v1/auth/profile/picture
    // =========================================================
    @DeleteMapping("/profile/picture")
    public ResponseEntity<?> deleteProfilePicture(Authentication authentication) {
        String username = authentication.getName();

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        user.setProfilePicture(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "Profile picture removed"));
    }

    // =========================================================
    // BATCH AVATARS: POST /api/v1/auth/avatars
    // Body: { "usernames": ["user1", "user2", ...] }
    // Returns map of username → profilePicture (or null)
    // =========================================================
    // =========================================================
    // HEARTBEAT: POST /api/v1/auth/heartbeat
    // Updates lastSeen for online tracking.
    // =========================================================
    @PostMapping("/heartbeat")
    public ResponseEntity<?> heartbeat(Authentication authentication) {
        mongoTemplate.updateFirst(
                org.springframework.data.mongodb.core.query.Query.query(
                        Criteria.where("username").is(authentication.getName())),
                new Update().set("lastSeen", Instant.now()),
                User.class
        );
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    @PostMapping("/avatars")
    public ResponseEntity<?> getAvatars(@RequestBody Map<String, List<String>> payload) {
        List<String> usernames = payload.get("usernames");
        if (usernames == null || usernames.isEmpty()) {
            return ResponseEntity.ok(Map.of());
        }

        // Cap at 50 usernames per request
        if (usernames.size() > 50) {
            usernames = usernames.subList(0, 50);
        }

        List<User> users = userRepository.findByUsernameIn(usernames);
        Map<String, String> avatars = new HashMap<>();
        for (User user : users) {
            avatars.put(user.getUsername(), user.getProfilePicture());
        }

        return ResponseEntity.ok(avatars);
    }
}
