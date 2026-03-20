package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface OnlineSnapshotRepository extends MongoRepository<OnlineSnapshot, ObjectId> {

    /** Get all snapshots after the given cutoff, ordered oldest → newest */
    List<OnlineSnapshot> findByTimestampAfterOrderByTimestampAsc(Instant cutoff);

    /** Get the most recent snapshot (for throttle check) */
    Optional<OnlineSnapshot> findTopByOrderByTimestampDesc();
}
