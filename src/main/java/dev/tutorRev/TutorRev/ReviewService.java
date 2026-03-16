package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ReviewService {

    private static final Pattern URL_PATTERN = Pattern.compile(
            "(https?://\\S+|www\\.\\S+)", Pattern.CASE_INSENSITIVE);

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
        if (ProfanityFilter.containsProfanity(reviewBody)) {
            throw new IllegalArgumentException("Review contains inappropriate language");
        }

        // Duplicate review check — one review per user per tutorial
        Tutorials tutorial = tutorialsRepository.findTutorialById(id).orElse(null);
        if (tutorial != null && tutorial.getReviewIds() != null) {
            boolean alreadyReviewed = tutorial.getReviewIds().stream()
                    .anyMatch(r -> username.equals(r.getUsername()));
            if (alreadyReviewed) {
                throw new IllegalArgumentException("You have already reviewed this tutorial");
            }
        }

        // Link limit — max 1 URL per review
        Matcher urlMatcher = URL_PATTERN.matcher(reviewBody);
        int linkCount = 0;
        while (urlMatcher.find()) linkCount++;
        if (linkCount > 1) {
            throw new IllegalArgumentException("Reviews can contain at most one link");
        }

        Reviews review = reviewRepository.insert(new Reviews(reviewBody, username, rating));

        mongoTemplate.update(Tutorials.class).matching(Criteria.where("id")
                .is((id))).apply(new Update().push("reviewIds").value(review))
                .first();

        return review;
    }

    public void deleteReview(String reviewId, String tutorialId, String username, boolean isAdmin){
        ObjectId objId = new ObjectId(reviewId);

        Reviews review = reviewRepository.findById(objId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        // Only the review owner or an admin can delete
        if (!isAdmin && !username.equals(review.getUsername())) {
            throw new IllegalArgumentException("You can only delete your own reviews");
        }

        // Remove the review reference from the tutorial's reviewIds list.
        Tutorials tutorial = tutorialsRepository.findTutorialById(tutorialId)
                .orElseThrow(() -> new IllegalArgumentException("Tutorial not found"));
        tutorial.getReviewIds().removeIf(r -> r.getId().equals(objId));
        tutorialsRepository.save(tutorial);

        // Delete the review document itself
        reviewRepository.deleteById(objId);
    }

    public Reviews updateReview(String reviewId, String newBody, int newRating, String username) {
        ObjectId objId = new ObjectId(reviewId);
        Reviews review = reviewRepository.findById(objId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        // Only the owner can edit
        if (!username.equals(review.getUsername())) {
            throw new IllegalArgumentException("You can only edit your own reviews");
        }

        if (newRating < 1 || newRating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        if (ProfanityFilter.containsProfanity(newBody)) {
            throw new IllegalArgumentException("Review contains inappropriate language");
        }

        // Link limit — max 1 URL
        Matcher urlMatcher = URL_PATTERN.matcher(newBody);
        int linkCount = 0;
        while (urlMatcher.find()) linkCount++;
        if (linkCount > 1) {
            throw new IllegalArgumentException("Reviews can contain at most one link");
        }

        review.setBody(newBody);
        review.setRating(newRating);
        return reviewRepository.save(review);
    }

    public Reviews toggleLike(String reviewId, String username) {
        ObjectId objId = new ObjectId(reviewId);
        Reviews review = reviewRepository.findById(objId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        // Remove from dislikedBy if present
        review.getDislikedBy().remove(username);

        // Toggle like
        if (review.getLikedBy().contains(username)) {
            review.getLikedBy().remove(username);
        } else {
            review.getLikedBy().add(username);
        }

        return reviewRepository.save(review);
    }

    public Reviews toggleDislike(String reviewId, String username) {
        ObjectId objId = new ObjectId(reviewId);
        Reviews review = reviewRepository.findById(objId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        // Remove from likedBy if present
        review.getLikedBy().remove(username);

        // Toggle dislike
        if (review.getDislikedBy().contains(username)) {
            review.getDislikedBy().remove(username);
        } else {
            review.getDislikedBy().add(username);
        }

        return reviewRepository.save(review);
    }
}
