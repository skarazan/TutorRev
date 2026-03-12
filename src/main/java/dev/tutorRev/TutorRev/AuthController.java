package dev.tutorRev.TutorRev;

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

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

// This controller follows the SAME pattern as your ReviewController:
// - @RestController (like ReviewController line 14)
// - @RequestMapping with a base path (like ReviewController line 15)
// - @Autowired services (like ReviewController line 18-19)
// - @PostMapping methods with @RequestBody Map<String, String> (like ReviewController line 21-22)
//
// The base path "/api/v1/auth" keeps it consistent with your existing
// "/api/v1/tutorials" and "/api/v1/reviews" URL structure.
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    // The AuthenticationManager is the Spring Security component that
    // orchestrates the login process. We defined it as a @Bean in SecurityConfig.
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private UserRepository userRepository;

    // The PasswordEncoder (BCrypt) we defined in SecurityConfig.
    // Used to hash the password before saving to MongoDB.
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // =========================================================
    // REGISTER: POST /api/v1/auth/register
    // Body: { "username": "saba", "email": "saba@email.com", "password": "mypass" }
    //
    // What it does:
    // 1. Validates that all required fields are present
    // 2. Checks MongoDB for duplicate username or email
    // 3. Hashes the password with BCrypt (NEVER stores plain text)
    // 4. Creates a new User document in the "users" collection
    // 5. Generates a JWT so the user is immediately logged in
    // 6. Returns the token and username
    // =========================================================
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String email = payload.get("email");
        String password = payload.get("password");

        // Validate input — return 400 Bad Request if anything is missing
        if (username == null || email == null || password == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "username, email, and password are required"));
        }

        // Check for duplicates BEFORE attempting to save.
        // This gives the user a clear error message instead of a
        // MongoDB duplicate key exception (which would be a 500 error).
        if (userRepository.existsByUsername(username)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Username already taken"));
        }

        if (userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Email already registered"));
        }

        // Build the User object
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        // passwordEncoder.encode() runs BCrypt on the password.
        // "mypass" becomes "$2a$10$N9qo8uLOickgx2ZMRZoMye..."
        // Even if someone steals your database, they can't get the passwords.
        user.setPassword(passwordEncoder.encode(password));
        user.setProvider("local"); // This is a username/password user, not Google
        Set<Role> roles = new HashSet<>();
        roles.add(Role.ROLE_USER); // New users get ROLE_USER by default
        user.setRoles(roles);

        // Save to MongoDB — creates a document in the "users" collection
        userRepository.save(user);

        // Generate JWT immediately so the user doesn't have to log in
        // separately after registering
        String token = jwtUtil.generateToken(username);

        // Return 201 Created (same status you use in ReviewController line 24)
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("token", token, "username", username));
    }

    // =========================================================
    // LOGIN: POST /api/v1/auth/login
    // Body: { "username": "saba", "password": "mypass" }
    //
    // What it does:
    // 1. Passes credentials to Spring Security's AuthenticationManager
    // 2. AuthenticationManager calls CustomUserDetailsService.loadUserByUsername()
    // 3. It BCrypt-hashes the provided password and compares to the stored hash
    // 4. If match → generates JWT token
    // 5. If no match → returns 401 Unauthorized
    // =========================================================
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");

        try {
            // This single line does ALL the work:
            // 1. Calls loadUserByUsername("saba") → gets UserDetails from MongoDB
            // 2. Hashes the provided password with BCrypt
            // 3. Compares the hash to the one stored in the database
            // 4. If they don't match → throws BadCredentialsException
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password));
        } catch (BadCredentialsException e) {
            // Wrong username or password — return 401
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid username or password"));
        }

        // If we get here, authentication succeeded. Generate a fresh JWT.
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        String token = jwtUtil.generateToken(userDetails.getUsername());

        return ResponseEntity.ok(Map.of("token", token, "username", username));
    }

    // =========================================================
    // LOGOUT: POST /api/v1/auth/logout
    //
    // Why is this so simple? Because JWT is STATELESS.
    // The server doesn't store tokens anywhere — there's no session to
    // invalidate. Logout happens on the CLIENT side by deleting the
    // token from localStorage/cookies.
    //
    // This endpoint exists so your frontend has a consistent API to call.
    // If you later want server-side token revocation, you'd add a
    // "blacklist" collection in MongoDB and check it in JwtAuthFilter.
    // =========================================================
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        return ResponseEntity.ok(
                Map.of("message", "Logged out successfully. Discard the token on the client."));
    }

    // =========================================================
    // PROMOTE: PUT /api/v1/auth/promote/{username}
    // Admin-only endpoint to give another user ROLE_ADMIN.
    //
    // Your FIRST admin must be created manually in MongoDB:
    //   In MongoDB Compass, find your user document and change
    //   "roles" from ["ROLE_USER"] to ["ROLE_USER", "ROLE_ADMIN"]
    //
    // After that, that admin can promote others using this endpoint.
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

    // GET /api/v1/auth/me — returns the current user's profile.
    // The frontend needs this to know who's logged in, their email,
    // and what roles they have (to show/hide admin controls).
    // Spring Security populates the Authentication object from the JWT
    // via JwtAuthFilter, so we just read the username from it.
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
