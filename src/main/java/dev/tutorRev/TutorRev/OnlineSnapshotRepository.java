package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface OnlineSnapshotRepository extends MongoRepository<OnlineSnapshot, ObjectId> {

    /** Get all snapshots after the given cutoff, ordered oldest → newest */
    List<OnlineSnapshot> findByTimestampAfterOrderByTimestampAsc(Instant cutoff);
}
