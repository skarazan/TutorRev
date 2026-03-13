package dev.tutorRev.TutorRev;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.mongodb.autoconfigure.MongoAutoConfiguration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;



@SpringBootApplication
//@EnableAutoConfiguration(exclude={MongoAutoConfiguration.class})

@RestController
public class TutorRevApplication {

	public static void main(String[] args) {
		SpringApplication.run(TutorRevApplication.class, args);
	}

	private TutorialController tutorialController;
	@GetMapping("/")
	public String home(){
		return "redirect/api/v1/auth";
	}
}
