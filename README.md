# CRM Customer Management System

A full-stack CRUD application for managing customer records, built with **Laravel** (REST API), **Angular** (Frontend), **MySQL** (Database), and **Elasticsearch** (Search Engine), orchestrated with **Docker Compose**.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| Frontend | Angular (latest) with Bootstrap 5 |
| Backend | Laravel 12 (REST API) |
| Database | MySQL 8.0 |
| Search | Elasticsearch 8.11 |
| Containerization | Docker Compose |
| Reverse Proxy | Nginx |

---

## Features

- Create, Read, Update, and Delete (CRUD) customer records
- Search customers by name and email address (powered by Elasticsearch)
- Form validation (unique email, required first/last name)
- Responsive UI with Bootstrap 5
- Dockerized backend with 4 services (`api`, `controller`, `database`, `searcher`)
- Elasticsearch document sync on every Create, Update, and Delete operation
- Graceful fallback to MySQL search when Elasticsearch is unavailable
- Automated feature tests for API endpoints and Elasticsearch sync

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for backend services)
- [Node.js](https://nodejs.org/) v18+ (for Angular frontend)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Iano023/CRM-Technical.git
cd CRM-Technical
```

### 2. Start Docker Services

```bash
docker compose up -d --build
```

This starts 4 containers:

| Service | Container | Port |
| :--- | :--- | :--- |
| `api` | PHP 8.2-FPM (Laravel) | Internal (9000) |
| `controller` | Nginx Reverse Proxy | `localhost:8000` |
| `database` | MySQL 8.0 | `localhost:3306` |
| `searcher` | Elasticsearch 8.11 | `localhost:9200` |

### 3. Install Backend Dependencies

```bash
docker compose exec api composer install
```

> **Note:** If the installation times out, run:
> ```bash
> docker compose exec api env COMPOSER_PROCESS_TIMEOUT=2000 composer install
> ```

### 4. Configure Laravel Environment

```bash
docker compose exec api cp .env.example .env
docker compose exec api php artisan key:generate
```

### 5. Run Database Migrations

```bash
docker compose exec api php artisan migrate --force
```

### 6. Start Angular Frontend

```bash
cd frontend
npm install
npx ng serve
```

### 7. Access the Application

| Service | URL |
| :--- | :--- |
| Frontend (Angular) | http://localhost:4200 |
| Backend API | http://localhost:8000/api/customers |
| Elasticsearch | http://localhost:9200 |

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/customers` | List all customers |
| `GET` | `/api/customers?search=query` | Search customers by name or email |
| `GET` | `/api/customers/{id}` | View a single customer |
| `POST` | `/api/customers` | Create a new customer |
| `PUT` | `/api/customers/{id}` | Update a customer |
| `DELETE` | `/api/customers/{id}` | Delete a customer |

### Customer Data Structure

```json
{
  "first_name": "Juan",
  "last_name": "Dela Cruz",
  "email": "juan@example.com",
  "contact_number": "09123456789"
}
```

### Validation Rules

- `first_name` — required
- `last_name` — required
- `email` — required, valid email format, unique
- `contact_number` — optional

---

## Elasticsearch Integration

- All customer records are automatically synchronized to Elasticsearch on **Create**, **Update**, and **Delete** operations.
- The sync is implemented using **Laravel's HTTP Client** (`Illuminate\Support\Facades\Http`) — no Laravel Scout.
- The search endpoint (`GET /api/customers?search=query`) performs a `multi_match` full-text search across `first_name`, `last_name`, `email`, and `contact_number`.

---

## Running Tests

```bash
docker compose exec api php artisan test
```

---

## Project Structure

```
├── backend/                  # Laravel REST API
│   ├── app/
│   │   ├── Http/Controllers/ # API Controllers
│   │   ├── Models/           # Eloquent Models
│   │   └── Services/         # ElasticsearchService
│   ├── tests/Feature/        # Feature Tests
│   └── Dockerfile            # PHP 8.2-FPM Docker image
├── frontend/                 # Angular Application
│   └── src/app/
│       ├── components/       # Standalone Components
│       ├── models/           # TypeScript Interfaces
│       └── services/         # HTTP Services
├── nginx/
│   └── default.conf          # Nginx reverse proxy config
├── docker-compose.yml        # Docker orchestration (4 services)
└── README.md
```
