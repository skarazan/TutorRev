package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import org.bson.types.ObjectId;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TutorialService {

    @Autowired
    private TutorialsRepository tutorialsRepository;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private ReviewRepository reviewRepository;

    @Value("${youtube.api.key}")
    private String youtubeApiKey;

    public List<Tutorials> getAllTutorials() {
        return tutorialsRepository.findAll();
    }

    public Optional<Tutorials> getTutorial(String id) {
        return tutorialsRepository.findTutorialById(id);
    }

    @SuppressWarnings("unchecked")
    public Tutorials createTutorial(String url, String reviewBody, String level, String username, int rating) {
        // Step 1: Extract YouTube video ID from the URL
        String videoId = extractVideoId(url);
        if (videoId == null) {
            throw new IllegalArgumentException("Invalid YouTube URL");
        }

        // Step 2: Check if this tutorial already exists
        if (tutorialsRepository.findTutorialById(videoId).isPresent()) {
            throw new IllegalArgumentException("Tutorial with this video already exists");
        }

        // Step 3: Call YouTube Data API v3 to get video metadata
        Map<String, Object> youtubeData = fetchYouTubeData(videoId);

        // Step 4: Parse the API response
        List<Map<String, Object>> items = (List<Map<String, Object>>) youtubeData.get("items");
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Video not found on YouTube");
        }
        Map<String, Object> snippet = (Map<String, Object>) items.get(0).get("snippet");

        String title = (String) snippet.get("title");
        String channelTitle = (String) snippet.get("channelTitle");

        // Step 5: Build topics from YouTube tags
        List<String> tags = (List<String>) snippet.get("tags");
        if (tags == null) {
            tags = new ArrayList<>();
        }
        List<String>[] topics = new List[]{tags};

        // Step 6: Build backdrops from YouTube thumbnails
        Map<String, Object> thumbnails = (Map<String, Object>) snippet.get("thumbnails");
        List<String> thumbnailUrls = new ArrayList<>();
        for (String key : new String[]{"default", "medium", "high", "standard", "maxres"}) {
            if (thumbnails.containsKey(key)) {
                Map<String, Object> thumb = (Map<String, Object>) thumbnails.get(key);
                thumbnailUrls.add((String) thumb.get("url"));
            }
        }
        List<String>[] backdrops = new List[]{thumbnailUrls};

        // Step 7: Build and save the Tutorials object
        Tutorials tutorial = new Tutorials();
        tutorial.setId(videoId);
        tutorial.setTitle(title);
        tutorial.setPlatform("YouTube");
        tutorial.setChannel(channelTitle);
        tutorial.setUrl(url);
        tutorial.setLevel(level);
        tutorial.setTopics(topics);
        tutorial.setBackdrops(backdrops);
        tutorial.setReviewIds(new ArrayList<>());

        tutorialsRepository.insert(tutorial);

        // Step 8: Create the first review and link it to the tutorial
        // This reuses your existing ReviewService.createReview() which:
        //   - inserts the review via reviewRepository.insert()
        //   - pushes the review into tutorial.reviewIds via mongoTemplate
        reviewService.createReview(reviewBody, videoId, username, rating);

        // Step 9: Re-fetch to return the tutorial with the linked review populated
        return tutorialsRepository.findTutorialById(videoId).orElse(tutorial);
    }

    public void deleteTutorial(String id) {
        Tutorials tutorial = tutorialsRepository.findTutorialById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tutorial not found"));

        // Delete all reviews linked to this tutorial
        if (tutorial.getReviewIds() != null) {
            for (Reviews review : tutorial.getReviewIds()) {
                reviewRepository.deleteById(review.getId());
            }
        }

        // Delete the tutorial itself
        tutorialsRepository.deleteById(tutorial.get_id());
    }

    // Extracts the 11-character video ID from common YouTube URL formats:
    //   https://www.youtube.com/watch?v=6T_HgnjoYwM
    //   https://youtu.be/6T_HgnjoYwM
    //   https://www.youtube.com/watch?v=6T_HgnjoYwM&t=120
    private String extractVideoId(String url) {
        Pattern pattern = Pattern.compile(
                "(?:youtube\\.com/watch\\?v=|youtu\\.be/)([a-zA-Z0-9_-]{11})");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    // Calls YouTube Data API v3 using Spring's built-in RestClient
    // Returns the raw JSON response as a Map
    @SuppressWarnings("unchecked")
    private Map<String, Object> fetchYouTubeData(String videoId) {
        RestClient restClient = RestClient.create();
        return restClient.get()
                .uri("https://www.googleapis.com/youtube/v3/videos?id={videoId}&key={apiKey}&part=snippet",
                        videoId, youtubeApiKey)
                .retrieve()
                .body(Map.class);
    }
}
