package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DevNoteService {

    @Autowired
    private DevNoteRepository devNoteRepository;

    public List<DevNote> getAllNotes() {
        return devNoteRepository.findAllByOrderByCreatedAtDesc();
    }

    public DevNote createNote(String content, String author) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("Note content cannot be empty");
        }
        if (ProfanityFilter.containsProfanity(content)) {
            throw new IllegalArgumentException("Note contains inappropriate language");
        }
        return devNoteRepository.insert(new DevNote(content, author));
    }

    public void deleteNote(String noteId) {
        ObjectId objId = new ObjectId(noteId);
        if (!devNoteRepository.existsById(objId)) {
            throw new IllegalArgumentException("Note not found");
        }
        devNoteRepository.deleteById(objId);
    }
}
