package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private TutorialsRepository tutorialsRepository;

    public Reviews createReview(String reviewBody, String id, String username, int rating){
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        Reviews review = reviewRepository.insert(new Reviews(reviewBody, username, rating));

        mongoTemplate.update(Tutorials.class).matching(Criteria.where("id")
                .is((id))).apply(new Update().push("reviewIds").value(review))
                .first();

        return review;
    }

    public void deleteReview(String reviewId, String tutorialId){
        ObjectId objId = new ObjectId(reviewId);

        // Remove the review reference from the tutorial's reviewIds list.
        // We load the tutorial, remove the review from the Java list,
        // and save — this lets Spring handle @DocumentReference correctly.
        Tutorials tutorial = tutorialsRepository.findTutorialById(tutorialId)
                .orElseThrow(() -> new IllegalArgumentException("Tutorial not found"));
        tutorial.getReviewIds().removeIf(r -> r.getId().equals(objId));
        tutorialsRepository.save(tutorial);

        // Delete the review document itself
        reviewRepository.deleteById(objId);
    }
}
