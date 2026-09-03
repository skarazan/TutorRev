package dev.tutorRev.TutorRev;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
public class OAuth2LoginSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @org.springframework.beans.factory.annotation.Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");     // user's Gmail address
        String googleId = oAuth2User.getAttribute("sub");    // Google's unique user ID
        String name = oAuth2User.getAttribute("name");       // display name



        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(name);
            newUser.setProvider("google");
            newUser.setGoogleId(googleId);
            Set<Role> roles = new HashSet<>();
            roles.add(Role.ROLE_USER);
            newUser.setEmailVerified(true);
            newUser.setRoles(roles);
            log.info("New Google user created: {}", name);
            return userRepository.save(newUser);
        });

        // Ensure existing Google users are also marked as verified
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        if (user.isBanned()) {
            log.warn("OAuth login attempt by banned user: {}", user.getUsername());
            response.sendRedirect(frontendUrl + "/login?error=banned");
            return;
        }

        // Set lastSeen on OAuth login
        user.setLastSeen(Instant.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getUsername());

        log.info("OAuth login successful: {}", user.getUsername());
        response.sendRedirect(frontendUrl + "/oauth2/callback?token=" + token);

    }
}
