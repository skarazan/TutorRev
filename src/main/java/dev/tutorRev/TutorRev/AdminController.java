package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        long totalUsers = userRepository.count();

        Instant fiveMinutesAgo = Instant.now().minus(5, ChronoUnit.MINUTES);
        List<User> onlineUsersList = userRepository.findByLastSeenAfter(fiveMinutesAgo);

        // All admins
        List<User> allAdmins = userRepository.findAll().stream()
                .filter(u -> u.getRoles().contains(Role.ROLE_ADMIN))
                .toList();
        long totalAdmins = allAdmins.size();

        // Online users with username + profilePicture
        List<Map<String, String>> onlineUsers = onlineUsersList.stream()
                .map(u -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("username", u.getUsername());
                    m.put("profilePicture", u.getProfilePicture() != null ? u.getProfilePicture() : "");
                    return m;
                })
                .toList();

        // Online admins
        List<Map<String, String>> onlineAdmins = onlineUsersList.stream()
                .filter(u -> u.getRoles().contains(Role.ROLE_ADMIN))
                .map(u -> {
                    Map<String, String> m = new HashMap<>();
                    m.put("username", u.getUsername());
                    return m;
                })
                .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("totalUsers", totalUsers);
        response.put("totalAdmins", totalAdmins);
        response.put("onlineUsers", onlineUsers);
        response.put("onlineAdmins", onlineAdmins);
        response.put("onlineCount", onlineUsers.size());
        response.put("onlineAdminCount", onlineAdmins.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> result = users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("username", u.getUsername());
            m.put("email", u.getEmail());
            m.put("roles", u.getRoles().stream().map(Enum::name).toList());
            m.put("banned", u.isBanned());
            m.put("bannedAt", u.getBannedAt());
            m.put("provider", u.getProvider() != null ? u.getProvider() : "local");
            m.put("emailVerified", u.isEmailVerified());
            m.put("lastSeen", u.getLastSeen());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    @GetMapping("/users/{username}")
    public ResponseEntity<?> getUserProfile(@PathVariable String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        Map<String, Object> response = new HashMap<>();
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("roles", user.getRoles().stream().map(Enum::name).toList());
        response.put("profilePicture", user.getProfilePicture());
        response.put("banned", user.isBanned());
        response.put("bannedAt", user.getBannedAt());
        response.put("provider", user.getProvider() != null ? user.getProvider() : "local");
        response.put("emailVerified", user.isEmailVerified());
        response.put("lastSeen", user.getLastSeen());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/users/{username}/ban")
    public ResponseEntity<?> banUser(@PathVariable String username,
                                      Authentication authentication) {
        if (username.equals(authentication.getName())) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "You cannot ban yourself"));
        }

        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        if (user.getRoles().contains(Role.ROLE_ADMIN)) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Cannot ban an admin"));
        }

        user.setBanned(true);
        user.setBannedAt(Instant.now());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", username + " has been banned"));
    }

    @PutMapping("/users/{username}/unban")
    public ResponseEntity<?> unbanUser(@PathVariable String username) {
        User user = userRepository.findByUsername(username).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }

        user.setBanned(false);
        user.setBannedAt(null);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", username + " has been unbanned"));
    }
}
