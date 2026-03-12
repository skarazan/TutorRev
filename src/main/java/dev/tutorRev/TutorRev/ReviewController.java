package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/reviews")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Reviews> createReview(@RequestBody Map<String, String> payload,
                                                Authentication authentication){
        String username = authentication.getName();
        return new ResponseEntity<Reviews>(reviewService.createReview(payload.get("reviewBody"), payload.get("id"), username), HttpStatus.CREATED);
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Map<String, String>> deleteReview(@PathVariable String reviewId,
                                                            @RequestParam String tutorialId){
        reviewService.deleteReview(reviewId, tutorialId);
        return new ResponseEntity<>(Map.of("message", "Review deleted successfully"), HttpStatus.OK);
    }
}
