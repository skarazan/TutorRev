package dev.tutorRev.TutorRev;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
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
        log.info("Verification email sent to: {}", toEmail);
    }

    public void sendPasswordChangeCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("TutorRev password change code");
        message.setText(
            "You requested a password change on TutorRev.\n\n" +
            "Your verification code is:\n\n" +
            "    " + code + "\n\n" +
            "Enter this code on the profile page to confirm your password change.\n\n" +
            "This code expires in 15 minutes.\n\n" +
            "If you didn't request this, you can ignore this email."
        );

        mailSender.send(message);
        log.info("Password change code sent to: {}", toEmail);
    }

    public void sendPasswordResetCode(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("TutorRev password reset");
        message.setText(
            "You requested a password reset on TutorRev.\n\n" +
            "Your reset code is:\n\n" +
            "    " + code + "\n\n" +
            "Enter this code on the password reset page to set a new password.\n\n" +
            "This code expires in 15 minutes.\n\n" +
            "If you didn't request this, you can safely ignore this email."
        );

        mailSender.send(message);
        log.info("Password reset code sent to: {}", toEmail);
    }
}
