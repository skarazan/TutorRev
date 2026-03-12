package dev.tutorRev.TutorRev;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DocumentReference;

import java.util.List;

@Document(collection = "tutorials")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Tutorials {
    @Id
    private ObjectId _id;

    private String id;

    private String  title;

    private String platform;

    private String channel;

    private String url;

    private String level;

    private List<String>[] topics;

    private List<String>[] backdrops;



    @DocumentReference
    private List<Reviews> reviewIds;






}
