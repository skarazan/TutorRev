package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TutorialsRepository extends MongoRepository<Tutorials, ObjectId> {

    Optional<Tutorials> findTutorialById(String id);


}
