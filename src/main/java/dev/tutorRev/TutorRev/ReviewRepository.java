package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends MongoRepository<Reviews, ObjectId> {
    List<Reviews> findByUsername(String username);
}
