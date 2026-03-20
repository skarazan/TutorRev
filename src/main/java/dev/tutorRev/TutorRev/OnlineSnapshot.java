package dev.tutorRev.TutorRev;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "online_snapshots")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class OnlineSnapshot {

    @Id
    @JsonIgnore
    private ObjectId id;

    private Instant timestamp;

    private int onlineCount;

    public OnlineSnapshot(Instant timestamp, int onlineCount) {
        this.timestamp = timestamp;
        this.onlineCount = onlineCount;
    }
}
