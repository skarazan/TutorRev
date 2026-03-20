package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class OnlineSnapshotService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OnlineSnapshotRepository snapshotRepository;

    /**
     * Runs every 60 seconds. Counts users with lastSeen within the past 5 minutes
     * (same logic as the /admin/stats endpoint) and persists a snapshot.
     */
    @Scheduled(fixedRate = 60_000)
    public void recordSnapshot() {
        Instant fiveMinAgo = Instant.now().minus(5, ChronoUnit.MINUTES);
        int onlineCount = userRepository.findByLastSeenAfter(fiveMinAgo).size();

        OnlineSnapshot snapshot = new OnlineSnapshot(Instant.now(), onlineCount);
        snapshotRepository.save(snapshot);
    }
}
