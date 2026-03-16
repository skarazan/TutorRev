package dev.tutorRev.TutorRev;

import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends MongoRepository<User, ObjectId> {

    List<User> findByUsernameIn(List<String> usernames);


    Optional<User> findByUsername(String username);


    Optional<User> findByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    Optional<User> findByEmailAndVerificationCode(String email, String verificationCode);

    List<User> findByLastSeenAfter(Instant cutoff);

    boolean existsByEmailAndBannedTrue(String email);
}
