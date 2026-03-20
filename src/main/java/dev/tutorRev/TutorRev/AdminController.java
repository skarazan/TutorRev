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

    @Autowired
    private OnlineSnapshotRepository snapshotRepository;

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

    // ── Online Snapshot Endpoints ──────────────────────────────────────
    // Snapshots are recorded automatically by OnlineSnapshotService every 60s.

    @GetMapping("/online-history")
    public ResponseEntity<?> getOnlineHistory() {
        Instant now = Instant.now();
        Instant cutoff24h = now.minus(24, ChronoUnit.HOURS);
        List<OnlineSnapshot> snapshots = snapshotRepository.findByTimestampAfterOrderByTimestampAsc(cutoff24h);

        // ── Summary stats ──
        // Today: from midnight local-ish (use start of UTC day for simplicity)
        Instant startOfToday = now.truncatedTo(ChronoUnit.DAYS);
        // This week: 7 days ago
        Instant startOfWeek = now.minus(7, ChronoUnit.DAYS);
        // This month: 30 days ago
        Instant startOfMonth = now.minus(30, ChronoUnit.DAYS);

        Map<String, Object> todayStats = computeStats(snapshots, startOfToday);
        Map<String, Object> weekStats = computeStats(snapshots, startOfWeek);

        // For month, we need snapshots older than 24h too
        List<OnlineSnapshot> monthSnapshots = snapshotRepository.findByTimestampAfterOrderByTimestampAsc(startOfMonth);
        Map<String, Object> monthStats = computeStats(monthSnapshots, startOfMonth);

        Map<String, Object> response = new HashMap<>();
        response.put("points", snapshots);
        response.put("today", todayStats);
        response.put("week", weekStats);
        response.put("month", monthStats);

        return ResponseEntity.ok(response);
    }

    private Map<String, Object> computeStats(List<OnlineSnapshot> snapshots, Instant after) {
        List<OnlineSnapshot> filtered = snapshots.stream()
                .filter(s -> s.getTimestamp().isAfter(after) || s.getTimestamp().equals(after))
                .toList();

        if (filtered.isEmpty()) {
            return Map.of("hasData", false);
        }

        int peak = filtered.stream().mapToInt(OnlineSnapshot::getOnlineCount).max().orElse(0);
        double avg = filtered.stream().mapToInt(OnlineSnapshot::getOnlineCount).average().orElse(0);

        Map<String, Object> m = new HashMap<>();
        m.put("hasData", true);
        m.put("peak", peak);
        m.put("avg", Math.round(avg * 10.0) / 10.0);
        m.put("datapoints", filtered.size());
        return m;
    }
}
