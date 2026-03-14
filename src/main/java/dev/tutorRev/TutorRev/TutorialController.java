package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/tutorials")
public class TutorialController {

    @Autowired
    private TutorialService tutorialService;

    @Autowired
    private RateLimitService rateLimitService;

    @GetMapping
    public ResponseEntity<List<Tutorials>> AllTutorials(){
        return new ResponseEntity<List<Tutorials>>(tutorialService.getAllTutorials(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Optional<Tutorials>> GetTutorial(@PathVariable String id){
        return new ResponseEntity<Optional<Tutorials>>(tutorialService.getTutorial(id), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<?> createTutorial(@RequestBody Map<String, String> payload,
                                             Authentication authentication){
        String username = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("tutorials", username, 10, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many tutorials added. Please try again later."));
        }

        int rating = Integer.parseInt(payload.get("rating"));
        return new ResponseEntity<>(
                tutorialService.createTutorial(
                        payload.get("url"),
                        payload.get("reviewBody"),
                        payload.get("level"),
                        username,
                        rating
                ),
                HttpStatus.CREATED
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteTutorial(@PathVariable String id){
        tutorialService.deleteTutorial(id);
        return new ResponseEntity<>(Map.of("message", "Tutorial deleted successfully"), HttpStatus.OK);
    }
}
