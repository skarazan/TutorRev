package dev.tutorRev.TutorRev;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class RateLimitService {

    // Each key maps to a deque of timestamps (request times)
    private final Map<String, Deque<Instant>> requestLog = new ConcurrentHashMap<>();

    /**
     * Sliding-window rate limiter.
     * Returns true if the request is allowed, false if rate limit exceeded.
     */
    public boolean tryConsume(String key, int maxRequests, Duration window) {
        Deque<Instant> timestamps = requestLog.computeIfAbsent(key, k -> new ConcurrentLinkedDeque<>());
        Instant now = Instant.now();
        Instant cutoff = now.minus(window);

        // Remove expired entries
        while (!timestamps.isEmpty() && timestamps.peekFirst().isBefore(cutoff)) {
            timestamps.pollFirst();
        }

        if (timestamps.size() >= maxRequests) {
            return false;
        }

        timestamps.addLast(now);
        return true;
    }

    public boolean tryConsumeByIp(String endpoint, String ipAddress,
                                   int maxRequests, Duration duration) {
        return tryConsume(endpoint + ":" + ipAddress, maxRequests, duration);
    }

    public boolean tryConsumeByUser(String endpoint, String username,
                                     int maxRequests, Duration duration) {
        return tryConsume(endpoint + ":" + username, maxRequests, duration);
    }
}
