package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TutorialsRepository extends MongoRepository<Tutorials, ObjectId> {

    Optional<Tutorials> findTutorialById(String id);

    /** Find the tutorial that contains a given review ObjectId in its reviewIds array */
    @Query("{ 'reviewIds': ?0 }")
    Optional<Tutorials> findByReviewIdsContaining(ObjectId reviewId);
}
