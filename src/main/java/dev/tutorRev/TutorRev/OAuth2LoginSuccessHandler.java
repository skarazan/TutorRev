package dev.tutorRev.TutorRev;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.HashSet;
import java.util.Set;

// WHY THIS CLASS?
// After Google authenticates a user and redirects back to your app,
// Spring Security calls this handler. The problem is: Spring Security's
// default behavior after OAuth2 login is to create a SESSION and redirect
// to "/". But your API is stateless (no sessions, JWT only). So we need
// this custom handler to:
// 1. Check if this Google user already exists in YOUR MongoDB
// 2. If not, create a new User document in your "users" collection
// 3. Generate a JWT token for the user
// 4. Redirect to your frontend with the token
//
// Without this class, Google login would succeed but you'd have no way
// to identify the user on subsequent API calls.
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

        // Spring Security gives us an OAuth2User object populated with
        // data from Google's userinfo endpoint. We extract what we need:
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();

        String email = oAuth2User.getAttribute("email");     // user's Gmail address
        String googleId = oAuth2User.getAttribute("sub");    // Google's unique user ID
        String name = oAuth2User.getAttribute("name");       // display name

        // FIND OR CREATE: Check if this email already exists in MongoDB.
        // If the user logged in with Google before, we find their existing
        // account. If it's their first time, we create a new User document.
        //
        // This is important because you don't want a new MongoDB document
        // every time someone clicks "Sign in with Google."
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setUsername(name); // Use Google display name as username
            newUser.setProvider("google");
            newUser.setGoogleId(googleId);
            Set<Role> roles = new HashSet<>();
            roles.add(Role.ROLE_USER);  // Google users get ROLE_USER by default
            newUser.setEmailVerified(true); // Google already verified their email
            newUser.setRoles(roles);
            return userRepository.save(newUser); // Save to MongoDB
        });

        // Ensure existing Google users are also marked as verified
        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        // Generate a JWT for this user — same token format as local login.
        // From this point on, the frontend uses this JWT for all API calls,
        // and the JwtAuthFilter can't tell the difference between a Google
        // user and a local user. They're both just valid JWT tokens.
        String token = jwtUtil.generateToken(user.getUsername());

        // Redirect to your FRONTEND with the token as a query parameter.
        // Your frontend (React, Angular, etc.) reads the token from the URL
        // and stores it in localStorage for future API calls.
        //
        // ⚠️ CHANGE THIS URL to match where your frontend is running!
        // If you don't have a frontend yet, you can change this to return
        // JSON instead — see the note below.
        response.sendRedirect(frontendUrl + "/oauth2/callback?token=" + token);

    }
}
