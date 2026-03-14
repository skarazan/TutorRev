package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DevNoteRepository extends MongoRepository<DevNote, ObjectId> {
    List<DevNote> findAllByOrderByCreatedAtDesc();
}
