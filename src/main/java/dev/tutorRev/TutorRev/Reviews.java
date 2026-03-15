package dev.tutorRev.TutorRev;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "reviews")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Reviews {

    @Id
    private ObjectId id;

    private String body;

    private String username;

    private int rating;

    private Instant createdAt;

    private List<String> likedBy = new ArrayList<>();

    private List<String> dislikedBy = new ArrayList<>();

    @JsonProperty("reviewId")
    public String getReviewId() {
        return id != null ? id.toHexString() : null;
    }

    @JsonProperty("likes")
    public int getLikes() {
        return likedBy != null ? likedBy.size() : 0;
    }

    @JsonProperty("dislikes")
    public int getDislikes() {
        return dislikedBy != null ? dislikedBy.size() : 0;
    }

    public Reviews(String review, String username, int rating) {
        this.body = review;
        this.username = username;
        this.rating = rating;
        this.createdAt = Instant.now();
        this.likedBy = new ArrayList<>();
        this.dislikedBy = new ArrayList<>();
    }
}
