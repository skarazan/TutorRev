Nice — since you already have a **live deployed instance**, we can include it directly in the README so anyone visiting your GitHub can try the app immediately.

Here’s a **cleaner and more professional README** using your actual link.

---

# TutorRev

TutorRev is a full stack web platform that helps developers and students discover and review programming tutorials. Users can sign in with Google, explore learning resources, and leave ratings and feedback for tutorials they have used.

The project was built to explore backend system design, authentication, and full stack deployment.

Live Application
[https://tutorrev-wkhq.onrender.com/dashboard](https://tutorrev-wkhq.onrender.com/dashboard)

---

<p align="center">
  <img width="801" height="862" alt="Screenshot 2026-03-13 at 1 23 27 am" src="https://github.com/user-attachments/assets/11b22f3d-f38d-4e07-873d-6adc92929a57" />
</p>

<p align="center">
  <img width="801" height="862" alt="Screenshot 2026-03-13 at 1 23 08 am" src="https://github.com/user-attachments/assets/fecb70fb-b85f-4bc7-9dd8-5ae75dde132a" />
</p>


<p align="center">
  <img width="801" height="862" alt="Screenshot 2026-03-13 at 1 23 47 am" src="https://github.com/user-attachments/assets/84dab413-4796-439f-b868-af42ecf90a82" />
</p>


<p align="center">
  <img width="801" height="862" alt="Screenshot 2026-03-13 at 1 25 13 am" src="https://github.com/user-attachments/assets/cd7b6bcb-a624-4e2a-a76b-d39915b3aabd" />
</p>



## Features

Google OAuth authentication
Secure user login and session management
Browse programming tutorials
Submit ratings and written reviews
RESTful backend API
Responsive frontend interface

---

## Tech Stack

Frontend
React
JavaScript
HTML
CSS

Backend
Java
Spring Boot
Spring Security
REST APIs

Authentication
Google OAuth2

Database
MongoDB

Deployment
Docker
Render Cloud Platform

---

## Architecture

TutorRev follows a standard full stack architecture.

The React frontend communicates with a Spring Boot REST API that handles authentication, business logic, and database operations. Google OAuth2 is used for secure user authentication. All tutorial and review data are stored in MongoDB.

System flow

Browser → React Frontend → Spring Boot API → MongoDB

---

## Project Structure

```
tutorrev
│
├── frontend
│   ├── components
│   ├── pages
│   ├── services
│   └── styles
│
├── backend
│   ├── controllers
│   ├── services
│   ├── repositories
│   ├── models
│   └── security
│
└── Dockerfile
```

---

## Running the Project Locally

Clone the repository

```
git clone https://github.com/yourusername/tutorrev.git
```

Navigate into the project

```
cd tutorrev
```

Run the backend

```
./mvnw spring-boot:run
```

Run the frontend

```
npm install
npm start
```

---

## Environment Variables

The application requires the following environment variables to run.

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MONGODB_URI
JWT_SECRET
```

---

## Future Improvements

Better tutorial discovery and filtering
User reputation system
Recommendation engine for learning resources
Pagination and performance optimizations
Improved UI and dashboard analytics

---

## Author

Saba Karazanashvili
Computer Science student focused on backend systems, distributed infrastructure, and scalable application design.

---

If you want, I can also show you **3 things that would make this project look MUCH stronger to Amazon/Stripe/Coinbase recruiters**, because right now you’re about **2 small additions away from this looking like a serious production backend project.**
