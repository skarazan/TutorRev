package dev.tutorRev.TutorRev;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "reviews")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Reviews {

    @Id
    private ObjectId id;

    private String body;

    private String username;

    // Jackson serializes ObjectId as a complex object by default.
    // This getter ensures the JSON response has a clean string ID
    // like "683abc12def..." that the frontend can use in URLs.
    @JsonProperty("reviewId")
    public String getReviewId() {
        return id != null ? id.toHexString() : null;
    }

    public Reviews(String review, String username) {
        this.body = review;
        this.username = username;
    }
}
