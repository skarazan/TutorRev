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
@RequestMapping("/api/v1/devnotes")
public class DevNoteController {

    @Autowired
    private DevNoteService devNoteService;

    @Autowired
    private RateLimitService rateLimitService;

    @GetMapping
    public ResponseEntity<List<DevNote>> getAllNotes() {
        return new ResponseEntity<>(devNoteService.getAllNotes(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<?> createNote(@RequestBody Map<String, String> payload,
                                         Authentication authentication) {
        String username = authentication.getName();

        if (!rateLimitService.tryConsumeByUser("devnotes", username, 10, Duration.ofHours(1))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Too many notes. Please try again later."));
        }

        return new ResponseEntity<>(
                devNoteService.createNote(payload.get("content"), username),
                HttpStatus.CREATED
        );
    }

    @DeleteMapping("/{noteId}")
    public ResponseEntity<Map<String, String>> deleteNote(@PathVariable String noteId) {
        devNoteService.deleteNote(noteId);
        return new ResponseEntity<>(Map.of("message", "Note deleted successfully"), HttpStatus.OK);
    }
}
