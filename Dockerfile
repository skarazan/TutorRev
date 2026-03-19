FROM eclipse-temurin:21-jdk

RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY . .

# Build React frontend and copy into Spring Boot static resources
RUN cd frontend && npm install && npm run build && cd ..
RUN cp -r frontend/dist/* src/main/resources/static/

# Build Spring Boot JAR (which now includes the frontend)
RUN chmod +x mvnw
RUN ./mvnw clean package -DskipTests

EXPOSE 8080

CMD ["java", "-jar", "target/TutorRev-0.0.1-SNAPSHOT.jar"]
