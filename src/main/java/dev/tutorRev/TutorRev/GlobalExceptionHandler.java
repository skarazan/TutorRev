package dev.tutorRev.TutorRev;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Map;

// @ControllerAdvice catches exceptions thrown by ANY controller
// and converts them into clean JSON error responses instead of
// ugly stack traces or 302 redirects.
@ControllerAdvice
public class GlobalExceptionHandler {

    // Catches IllegalArgumentException — used in TutorialService for:
    //   "Invalid YouTube URL"
    //   "Tutorial with this video already exists"
    //   "Video not found on YouTube"
    //   "Tutorial not found"
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
    }

    // Catches YouTube API errors (e.g., invalid API key returns 400/403)
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<Map<String, String>> handleHttpClientError(HttpClientErrorException e) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(Map.of("error", "YouTube API error: " + e.getStatusCode()));
    }

    // Catches anything else unexpected
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGeneral(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error"));
    }
}
