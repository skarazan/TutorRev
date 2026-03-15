package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private RateLimitService rateLimitService;

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody Map<String, String> payload,
                                           Authentication authentication){
        String username = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("reviews", username, 20, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many reviews. Please try again later."));
        }

        int rating = Integer.parseInt(payload.get("rating"));
        return new ResponseEntity<>(reviewService.createReview(payload.get("reviewBody"), payload.get("id"), username, rating), HttpStatus.CREATED);
    }

    @GetMapping("/user")
    public ResponseEntity<List<Reviews>> getUserReviews(Authentication authentication) {
        String username = authentication.getName();
        return new ResponseEntity<>(reviewRepository.findByUsername(username), HttpStatus.OK);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Map<String, String>> deleteReview(@PathVariable String reviewId,
                                                            @RequestParam String tutorialId){
        reviewService.deleteReview(reviewId, tutorialId);
        return new ResponseEntity<>(Map.of("message", "Review deleted successfully"), HttpStatus.OK);
    }

    @PutMapping("/{reviewId}/like")
    public ResponseEntity<?> toggleLike(@PathVariable String reviewId,
                                        Authentication authentication) {
        String username = authentication.getName();
        Reviews review = reviewService.toggleLike(reviewId, username);
        return new ResponseEntity<>(review, HttpStatus.OK);
    }

    @PutMapping("/{reviewId}/dislike")
    public ResponseEntity<?> toggleDislike(@PathVariable String reviewId,
                                           Authentication authentication) {
        String username = authentication.getName();
        Reviews review = reviewService.toggleDislike(reviewId, username);
        return new ResponseEntity<>(review, HttpStatus.OK);
    }
}
