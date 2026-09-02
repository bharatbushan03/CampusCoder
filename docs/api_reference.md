# CampusCoder REST API Reference

The CampusCoder backend is built with Express.js and TypeScript, operating on base URL `http://localhost:4000/api` (or your configured production domain).

---

## 🔐 Authentication & Headers

Protected routes require Supabase JWT bearer tokens passed via the `Authorization` header or HTTP-only cookies:

```http
Authorization: Bearer <supabase-access-token>
Content-Type: application/json
```

---

## 📡 Public Endpoints

### 1. Events

#### `GET /api/events`
Returns all active and upcoming published events.
- **Query Params**:
  - `type` *(optional)*: Filter by event type (`workshop`, `coding_session`, `challenge`, `orientation`, `webinar`).
  - `mode` *(optional)*: Filter by mode (`online`, `offline`, `hybrid`).
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "events": [
      {
        "id": "uuid",
        "title": "Full Stack Web Development Masterclass",
        "slug": "full-stack-web-dev",
        "short_description": "Learn React and Node.js...",
        "event_type": "workshop",
        "mode": "online",
        "date": "2026-09-05",
        "start_time": "18:00:00",
        "end_time": "20:00:00",
        "meeting_link": null,
        "registration_deadline": "2026-09-04T23:59:59Z",
        "photos": ["https://..."],
        "status": "published"
      }
    ]
  }
  ```

#### `GET /api/events/:slug`
Fetches a single event with speaker and owner details.

#### `POST /api/events/:id/register`
RSVPs a student for an open event and queues a confirmation email.
- **Request Body**:
  ```json
  {
    "fullName": "Jane Doe",
    "email": "jane@college.edu",
    "phone": "+919876543210",
    "college": "University Institute of Technology",
    "branch": "Computer Science & Engineering",
    "year": "2028",
    "codingLevel": "intermediate",
    "preferredLanguage": "Python",
    "reasonToJoin": "Excited to master backend systems!"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "success": true
  }
  ```

#### `GET /api/events/archive`
Returns past and completed events with recording URLs and RSVP counts.

---

### 2. Notes & Study Resources

#### `GET /api/notes`
Fetches verified course notes and study handbooks grouped by branch and year.

#### `GET /api/resources`
Fetches curated external developer roadmaps and cheat sheets.

---

### 3. Student Project Showcase

#### `GET /api/showcase`
Fetches approved student showcase projects.

#### `POST /api/showcase/submit` *(Authenticated)*
Submits a student project for review.

---

## 🛡️ Admin & Organizer Endpoints

*All endpoints under `/api/admin` require `admin` or `organizer` role.*

### 1. Events Management

#### `POST /api/admin/events`
Creates a new event with speaker assignments.
- **Request Body**:
  ```json
  {
    "title": "Machine Learning Bootcamp",
    "slug": "ml-bootcamp-2026",
    "short_description": "Hands-on PyTorch and Scikit-learn",
    "full_description": "Full markdown description...",
    "event_type": "workshop",
    "mode": "online",
    "date": "2026-09-20",
    "start_time": "17:00:00",
    "end_time": "19:30:00",
    "meeting_link": "https://meet.google.com/xyz",
    "photos": ["https://..."],
    "status": "published"
  }
  ```

#### `PUT /api/admin/events/:id`
Updates existing sprint or event metadata.

#### `DELETE /api/admin/events/:id`
Deletes an event and cascades associated records.

#### `GET /api/admin/events/:id/attendees`
Returns the full attendee registration list for an event.

---

### 2. Media Uploads

#### `POST /api/admin/upload/banner`
Uploads a single event banner image (`multipart/form-data`, max 5MB).

#### `POST /api/admin/upload/photos`
Batch uploads multiple event gallery photos (`multipart/form-data`, max 10MB per file).
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "urls": [
      "https://your-project.supabase.co/storage/v1/object/public/event-photos/photo-1.webp",
      "https://your-project.supabase.co/storage/v1/object/public/event-photos/photo-2.webp"
    ]
  }
  ```

---

### 3. Email Broadcasts

#### `POST /api/emails/meeting-link/:eventId`
Sends meeting link announcements with dynamic date and time to all registered attendees.
- **Request Body**:
  ```json
  {
    "force": false
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "ok": true,
    "success": true,
    "count": 48,
    "queued": true
  }
  ```
