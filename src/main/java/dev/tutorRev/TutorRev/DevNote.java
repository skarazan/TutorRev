package dev.tutorRev.TutorRev;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "devnotes")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DevNote {

    @Id
    private ObjectId id;

    private String content;

    private String author;

    private Instant createdAt;

    @JsonProperty("noteId")
    public String getNoteId() {
        return id != null ? id.toHexString() : null;
    }

    public DevNote(String content, String author) {
        this.content = content;
        this.author = author;
        this.createdAt = Instant.now();
    }
}
