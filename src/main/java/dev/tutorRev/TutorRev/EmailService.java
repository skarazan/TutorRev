package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendVerificationCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Your TutorRev verification code");
        message.setText(
            "Welcome to TutorRev!\n\n" +
            "Your verification code is:\n\n" +
            "    " + code + "\n\n" +
            "Enter this code on the verification page to activate your account.\n\n" +
            "This code expires in 15 minutes.\n\n" +
            "If you didn't create an account, you can ignore this email."
        );

        mailSender.send(message);
    }
}
