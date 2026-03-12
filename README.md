# 🏪 Sales Representative Management API

A production-ready NestJS REST API for managing sales representatives, retailers, geographic hierarchies, and assignments — featuring JWT authentication, role-based access control, Redis caching, CSV bulk import, and full Docker support.

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Architecture Overview](#-architecture-overview)
- [Prerequisites](#-prerequisites)
- [Quick Start (Docker)](#-quick-start-docker)
- [Step-by-Step Setup](#-step-by-step-setup)
  - [1. Clone & Install](#1-clone--install)
  - [2. Start Docker Services](#2-start-docker-services)
  - [3. Run Migrations](#3-run-migrations)
  - [4. Seed the Database](#4-seed-the-database)
  - [5. Verify Everything Works](#5-verify-everything-works)
- [Database Management (Adminer)](#-database-management-adminer)
- [Swagger API Documentation](#-swagger-api-documentation)
- [Authentication Guide](#-authentication-guide)
- [API Endpoints Reference](#-api-endpoints-reference)
  - [Auth](#auth)
  - [Geography](#geography-regions-areas-territories-distributors)
  - [Retailers — Admin](#retailers--admin)
  - [Retailers — Sales Rep](#retailers--sales-rep)
  - [Assignments — Admin](#assignments--admin)
- [Search, Filter & Pagination](#-search-filter--pagination)
- [CSV Bulk Import](#-csv-bulk-import)
- [Migration Commands](#-migration-commands)
- [All CLI Commands](#-all-cli-commands)
- [Default Credentials](#-default-credentials)
- [API Response Format](#-api-response-format)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)

---

## 🛠 Tech Stack

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| **NestJS v11**    | Backend framework           |
| **TypeORM**       | ORM & database migrations   |
| **PostgreSQL 14** | Primary relational database |
| **Redis 7**       | Caching layer (LRU)        |
| **Passport JWT**  | Authentication & guards     |
| **Swagger/OpenAPI** | Interactive API docs      |
| **csv-parser**    | CSV bulk import             |
| **Multer**        | File upload handling        |
| **Docker Compose**| Container orchestration     |
| **Adminer**       | Database management UI      |
| **bcryptjs**      | Password hashing            |

---

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Docker Compose                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────────────┐  │
│  │ NestJS   │  │PostgreSQL│  │  Redis   │  │  Adminer   │  │
│  │ Backend  │──│    DB    │  │  Cache   │  │  DB UI     │  │
│  │ :3000    │  │  :5431   │  │  :6379   │  │  :8080     │  │
│  └──────────┘  └──────────┘  └─────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Key Design Patterns:**
- **Repository Pattern** — `BaseRepository<T>` with generic CRUD + pagination
- **Role-Based Access Control** — `@Roles(UserRole.ADMIN)` / `@Roles(UserRole.SALES_REP)`
- **Redis Caching** — Auto-cache with TTL, pattern-based invalidation
- **Global Response Interceptor** — Unified JSON response format
- **Global Exception Filter** — Standardized error responses

---

## ✅ Prerequisites

| Tool               | Version      | Required |
| ------------------ | ------------ | -------- |
| **Docker Desktop** | Latest       | ✅       |
| **Docker Compose** | v2+          | ✅       |
| **Git**            | Latest       | ✅       |
| **Node.js**        | v18+         | Optional (for local dev without Docker) |
| **npm**            | v9+          | Optional (for local dev without Docker) |

---

## ⚡ Quick Start (Docker)

Get everything running in **under 2 minutes**:

```bash
# 1. Clone the repository
git clone https://github.com/mdsami98/sales_rep.git
cd sales_rep

# 2. Start all services (PostgreSQL + Redis + Adminer + Backend)
docker-compose up -d --build

# 3. Wait ~15 seconds for services to initialize, then run migrations
docker exec -it sales_rep_backend npm run migration:run

# 4. Seed the database (10,000 retailers + geography + users)
docker exec -it sales_rep_backend npm run seed

# 5. Open in browser
# API:     http://localhost:3000/api
# Swagger: http://localhost:3000/swagger
# Adminer: http://localhost:8080
```

That's it! 🎉

---

## 📝 Step-by-Step Setup

### 1. Clone & Install

```bash
git clone https://github.com/mdsami98/sales_rep.git
cd sales_rep
```

If running **without Docker** (local Node.js):

```bash
npm install
```

### 2. Start Docker Services

```bash
# Start all containers in detached mode
docker-compose up -d --build
```

**Verify all containers are running:**

```bash
docker-compose ps
```

Expected output:

```
NAME                 STATUS          PORTS
postgres_db          Up              0.0.0.0:5431->5432/tcp
redis_cache          Up (healthy)    0.0.0.0:6379->6379/tcp
adminer              Up              0.0.0.0:8080->8080/tcp
sales_rep_backend    Up              0.0.0.0:3000->3000/tcp
```

**View backend logs:**

```bash
docker-compose logs -f backend
```

**Stop all services:**

```bash
docker-compose down
```

**Stop and remove all data (fresh start):**

```bash
docker-compose down -v
```

### 3. Run Migrations

Migrations create all required database tables.

**Inside Docker (recommended):**

```bash
docker exec -it sales_rep_backend npm run migration:run
```

**Local (outside Docker):**

```bash
npm run migration:run
```

Expected output:

```
query: SELECT * FROM "migrations" ...
query: CREATE TABLE "regions" ...
query: CREATE TABLE "areas" ...
query: CREATE TABLE "territories" ...
query: CREATE TABLE "distributors" ...
query: CREATE TABLE "retailers" ...
query: CREATE TABLE "users" ...
query: CREATE TABLE "refresh_tokens" ...
query: CREATE TABLE "sales_rep_retailers" ...
Migration has been executed successfully.
```

### 4. Seed the Database

Seeds create **10,000 retailers**, geographic data (8 regions, 58 areas, ~250 territories, 20 distributors), 1 admin, 10 sales reps, and auto-assigns retailers evenly.

**Inside Docker:**

```bash
docker exec -it sales_rep_backend npm run seed
```

**Local:**

```bash
npm run seed
```

Expected output:

```
📦 Database connected

🗑️  Clearing old data...
   Done.

🌍 Creating regions...
   ✅ 8 regions created
📍 Creating areas...
   ✅ 58 areas created
🗺️  Creating territories...
   ✅ ~250 territories created
🏢 Creating distributors...
   ✅ 20 distributors created
👤 Creating users...
   ✅ 11 users created (1 admin, 10 sales reps)
🏪 Creating 10,000 retailers...
   📦 Chunk 1/10: 1000 retailers inserted
   📦 Chunk 2/10: 1000 retailers inserted
   ...
   ✅ 10000 retailers created

🔗 Assigning retailers to sales reps...
   👤 Rahim Uddin: 1000 retailers
   👤 Karim Ahmed: 1000 retailers
   ...

✅ Seeding complete!
```

### 5. Verify Everything Works

```bash
# Health check — should return the API
curl http://localhost:3000/api

# Login as admin
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@salesrep.com", "password": "Password@123"}'

# Login as SR
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{"email": "rahim@salesrep.com", "password": "Password@123"}'
```

---

## 🗄 Database Management (Adminer)

Adminer provides a web-based interface to browse and manage your PostgreSQL database.

| Setting      | Value        |
| ------------ | ------------ |
| **URL**      | [http://localhost:8080](http://localhost:8080) |
| **System**   | PostgreSQL   |
| **Server**   | `db`         |
| **Username** | `admin`      |
| **Password** | `admin`      |
| **Database** | `sales_rep`  |

> ⚠️ **Important:** The Server field must be `db` (the Docker service name), NOT `localhost`.

![Adminer Login](https://via.placeholder.com/400x200?text=Adminer+Login+Screen)

**Tables you'll see after migration + seed:**

| Table                 | Records | Description                    |
| --------------------- | ------- | ------------------------------ |
| `regions`             | 8       | Geographic regions             |
| `areas`               | 58      | Areas within regions           |
| `territories`         | ~250    | Zones within areas             |
| `distributors`        | 20      | Product distributors           |
| `users`               | 11      | Admin + Sales Reps             |
| `retailers`           | 10,000  | Retail shops                   |
| `sales_rep_retailers` | 10,000  | SR ↔ Retailer assignments      |
| `refresh_tokens`      | —       | JWT refresh tokens             |
| `migrations`          | —       | TypeORM migration history      |

---

## 📖 Swagger API Documentation

Interactive API documentation with built-in request testing:

| Setting  | Value |
| -------- | ----- |
| **URL**  | [http://localhost:3000/swagger](http://localhost:3000/swagger) |

### How to Authenticate in Swagger

1. Open [http://localhost:3000/swagger](http://localhost:3000/swagger)
2. Call **POST `/api/auth/local/login`** with admin credentials
3. Copy the `access_token` from the response
4. Click the **🔒 Authorize** button (top right)
5. Paste the token (without `Bearer ` prefix)
6. Click **Authorize** → **Close**
7. All protected endpoints now work ✅

---

## 🔐 Authentication Guide

### Login (Get JWT Token)

```bash
# Admin login
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@salesrep.com",
    "password": "Password@123"
  }'
```

**Response:**

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
  "user": {
            "id": "4489a33e-7a25-4c27-a647-07029430a42d",
            "first_name": "Super",
            "last_name": "Admin",
            "email": "admin@salesrep.com",
            "is_active": true,
            "mfa_enabled": false,
            "role": 1,
            "created_at": "2026-03-10T18:56:04.065Z",
            "updated_at": "2026-03-10T18:56:04.065Z"
        }
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Use Token in Requests

```bash
# Add this header to all protected endpoints
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Sales Rep Login

```bash
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahim@salesrep.com",
    "password": "Password@123"
  }'
```


---
// ...existing code...

## 📡 API Endpoints Reference

### Auth

| Method | Endpoint                   | Auth   | Description           |
| ------ | -------------------------- | ------ | --------------------- |
| `POST` | `/api/auth/local/register` | Public | Register a new user   |
| `POST` | `/api/auth/local/login`    | Public | Login & get JWT tokens|
| `GET`  | `/api/users/me`            | Auth   | Get current user profile |

### Geography (Regions, Areas, Territories, Distributors)

#### Regions

| Method   | Endpoint                  | Role     | Description    |
| -------- | ------------------------- | -------- | -------------- |
| `GET`    | `/api/geography/regions`     | Admin/SR | List all regions    |
| `GET`    | `/api/geography/regions/:id` | Admin/SR | Get region by ID    |
| `POST`   | `/api/geography/regions`     | Admin    | Create region       |
| `PATCH`  | `/api/geography/regions/:id` | Admin    | Update region       |
| `DELETE` | `/api/geography/regions/:id` | Admin    | Delete region       |

#### Areas

| Method   | Endpoint                                | Role     | Description            |
| -------- | --------------------------------------- | -------- | ---------------------- |
| `GET`    | `/api/geography/areas`                  | Admin/SR | List all areas         |
| `GET`    | `/api/geography/areas?region_id=uuid`   | Admin/SR | Filter areas by region |
| `GET`    | `/api/geography/areas/:id`              | Admin/SR | Get area by ID         |
| `POST`   | `/api/geography/areas`                  | Admin    | Create area            |
| `PATCH`  | `/api/geography/areas/:id`              | Admin    | Update area            |
| `DELETE` | `/api/geography/areas/:id`              | Admin    | Delete area            |

#### Distributors

| Method   | Endpoint                             | Role     | Description         |
| -------- | ------------------------------------ | -------- | ------------------- |
| `GET`    | `/api/geography/distributors`        | Admin/SR | List all distributors |
| `GET`    | `/api/geography/distributors/:id`    | Admin/SR | Get distributor by ID |
| `POST`   | `/api/geography/distributors`        | Admin    | Create distributor    |
| `PATCH`  | `/api/geography/distributors/:id`    | Admin    | Update distributor    |
| `DELETE` | `/api/geography/distributors/:id`    | Admin    | Delete distributor    |

#### Territories

| Method   | Endpoint                                    | Role     | Description              |
| -------- | ------------------------------------------- | -------- | ------------------------ |
| `GET`    | `/api/geography/territories`                | Admin/SR | List all territories     |
| `GET`    | `/api/geography/territories?area_id=uuid`   | Admin/SR | Filter by area           |
| `GET`    | `/api/geography/territories/:id`            | Admin/SR | Get territory by ID      |
| `POST`   | `/api/geography/territories`                | Admin    | Create territory         |
| `PATCH`  | `/api/geography/territories/:id`            | Admin    | Update territory         |
| `DELETE` | `/api/geography/territories/:id`            | Admin    | Delete territory         |

### Retailers — Admin

| Method | Endpoint                    | Role  | Description                                    |
| ------ | --------------------------- | ----- | ---------------------------------------------- |
| `GET`  | `/api/retailers/admin/all`  | Admin | List all retailers (search, filter, paginated) |
| `GET`  | `/api/retailers/admin/:uid` | Admin | Get any retailer by UID                        |
| `POST` | `/api/retailers/import`     | Admin | Bulk import retailers from CSV                 |

### Retailers — Sales Rep

| Method  | Endpoint              | Role | Description                                        |
| ------- | --------------------- | ---- | -------------------------------------------------- |
| `GET`   | `/api/retailers`      | SR   | List assigned retailers (search, filter, paginated) |
| `GET`   | `/api/retailers/:uid` | SR   | Get assigned retailer detail by UID                |
| `PATCH` | `/api/retailers/:uid` | SR   | Update assigned retailer (points, routes, notes)   |

### Assignments — Admin

| Method | Endpoint                         | Role  | Description                                    |
| ------ | -------------------------------- | ----- | ---------------------------------------------- |
| `GET`  | `/api/assignments`               | Admin | List all SR ↔ Retailer assignments (paginated) |
| `GET`  | `/api/assignments/sales-rep/:id` | Admin | List retailers assigned to a specific SR        |
| `POST` | `/api/assignments/assign`        | Admin | Bulk assign retailers to a SR                  |
| `POST` | `/api/assignments/unassign`      | Admin | Bulk unassign retailers from a SR              |

---

## 🧪 cURL Samples

> Replace `$TOKEN` with your JWT access token in all examples.

### 🔐 Auth

```bash
# ─── Register ────────────────────────────────────────────────────
curl -X POST http://localhost:3000/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "Password@123",
    "role": "sales_rep"
  }'

# ─── Login (Admin) ──────────────────────────────────────────────
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@salesrep.com",
    "password": "Password@123"
  }'

# ─── Login (Sales Rep) ──────────────────────────────────────────
curl -X POST http://localhost:3000/api/auth/local/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rahim@salesrep.com",
    "password": "Password@123"
  }'

# ─── Get Profile ────────────────────────────────────────────────
curl http://localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

### 🌍 Geography

```bash
# ─── Regions ─────────────────────────────────────────────────────
# List all regions
curl http://localhost:3000/api/geography/regions \
  -H "Authorization: Bearer $TOKEN"

# Get region by ID
curl http://localhost:3000/api/geography/regions/REGION_UUID \
  -H "Authorization: Bearer $TOKEN"

# Create region (Admin)
curl -X POST http://localhost:3000/api/geography/regions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mymensingh"}'

# Update region (Admin)
curl -X PATCH http://localhost:3000/api/geography/regions/REGION_UUID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Mymensingh Division"}'

# Delete region (Admin)
curl -X DELETE http://localhost:3000/api/geography/regions/REGION_UUID \
  -H "Authorization: Bearer $TOKEN"

# ─── Areas ───────────────────────────────────────────────────────
# List all areas
curl http://localhost:3000/api/geography/areas \
  -H "Authorization: Bearer $TOKEN"

# Filter areas by region
curl "http://localhost:3000/api/geography/areas?region_id=REGION_UUID" \
  -H "Authorization: Bearer $TOKEN"

# Create area (Admin)
curl -X POST http://localhost:3000/api/geography/areas \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Banani", "region_id": "REGION_UUID"}'

# ─── Distributors ───────────────────────────────────────────────
# List all distributors
curl http://localhost:3000/api/geography/distributors \
  -H "Authorization: Bearer $TOKEN"

# Create distributor (Admin)
curl -X POST http://localhost:3000/api/geography/distributors \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "New Distributor Ltd."}'

# ─── Territories ────────────────────────────────────────────────
# List all territories
curl http://localhost:3000/api/geography/territories \
  -H "Authorization: Bearer $TOKEN"

# Filter territories by area
curl "http://localhost:3000/api/geography/territories?area_id=AREA_UUID" \
  -H "Authorization: Bearer $TOKEN"

# Create territory (Admin)
curl -X POST http://localhost:3000/api/geography/territories \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Banani - Zone 3", "area_id": "AREA_UUID"}'
```

### 🏪 Retailers — Admin

```bash
# ─── List all retailers (paginated, with search & filter) ───────
curl "http://localhost:3000/api/retailers/admin/all?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# ─── Search retailers by name ──────────────────────────────────
curl "http://localhost:3000/api/retailers/admin/all?search=Khan" \
  -H "Authorization: Bearer $TOKEN"

# ─── Search by phone prefix ────────────────────────────────────
curl "http://localhost:3000/api/retailers/admin/all?search=017" \
  -H "Authorization: Bearer $TOKEN"

# ─── Filter by region + sort by points ─────────────────────────
curl "http://localhost:3000/api/retailers/admin/all?region_id=REGION_UUID&sort_by=points&sort_order=DESC" \
  -H "Authorization: Bearer $TOKEN"

# ─── Combined search + filter + pagination ─────────────────────
curl "http://localhost:3000/api/retailers/admin/all?search=Rahman&region_id=REGION_UUID&area_id=AREA_UUID&page=2&limit=50&sort_by=name&sort_order=ASC" \
  -H "Authorization: Bearer $TOKEN"

# ─── Get retailer by UID ───────────────────────────────────────
curl http://localhost:3000/api/retailers/admin/RET-0009485 \
  -H "Authorization: Bearer $TOKEN"

# ─── Bulk import from CSV ──────────────────────────────────────
curl -X POST http://localhost:3000/api/retailers/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@./sample-import.csv"
```

### 🏪 Retailers — Sales Rep

```bash
# ─── List my assigned retailers ─────────────────────────────────
curl "http://localhost:3000/api/retailers?page=1&limit=20" \
  -H "Authorization: Bearer $SR_TOKEN"

# ─── Search my assigned retailers ──────────────────────────────
curl "http://localhost:3000/api/retailers?search=Khan&sort_by=points&sort_order=DESC" \
  -H "Authorization: Bearer $SR_TOKEN"

# ─── Filter by region + area ───────────────────────────────────
curl "http://localhost:3000/api/retailers?region_id=REGION_UUID&area_id=AREA_UUID&page=1&limit=50" \
  -H "Authorization: Bearer $SR_TOKEN"

# ─── Get assigned retailer by UID ──────────────────────────────
curl http://localhost:3000/api/retailers/RET-0009485 \
  -H "Authorization: Bearer $SR_TOKEN"

# ─── Update assigned retailer (points) ─────────────────────────
curl -X PATCH http://localhost:3000/api/retailers/RET-0009485 \
  -H "Authorization: Bearer $SR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"points": 1500}'

# ─── Update assigned retailer (routes + notes) ─────────────────
curl -X PATCH http://localhost:3000/api/retailers/RET-0009485 \
  -H "Authorization: Bearer $SR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "points": 2000,
    "routes": "Route-15, Route-22",
    "notes": "VIP customer — top performer in Q1"
  }'
```

### 🔗 Assignments — Admin (Bulk Operations)

```bash
# ─── List all assignments (paginated) ──────────────────────────
curl "http://localhost:3000/api/assignments?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# ─── Search assignments ────────────────────────────────────────
curl "http://localhost:3000/api/assignments?search=Khan&sort_by=retailer_name&sort_order=ASC" \
  -H "Authorization: Bearer $TOKEN"

# ─── List assignments for a specific Sales Rep ─────────────────
curl "http://localhost:3000/api/assignments/sales-rep/SR_USER_UUID?page=1&limit=50" \
  -H "Authorization: Bearer $TOKEN"

# ─── Bulk ASSIGN retailers to a Sales Rep ──────────────────────
curl -X POST http://localhost:3000/api/assignments/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_rep_id": "SR_USER_UUID",
    "retailer_ids": [
      "RETAILER_UUID_1",
      "RETAILER_UUID_2",
      "RETAILER_UUID_3",
      "RETAILER_UUID_4",
      "RETAILER_UUID_5"
    ]
  }'

# ─── Bulk UNASSIGN retailers from a Sales Rep ──────────────────
curl -X POST http://localhost:3000/api/assignments/unassign \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sales_rep_id": "SR_USER_UUID",
    "retailer_ids": [
      "RETAILER_UUID_1",
      "RETAILER_UUID_2"
    ]
  }'
```

### 📦 Sample Responses

**Bulk Assign — Success:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bulk assign complete: 5 assigned, 0 skipped (already assigned)",
  "data": {
    "sales_rep_id": "uuid",
    "requested": 5,
    "assigned": 5,
    "skipped": 0
  }
}
```

**Bulk Assign — Partial Skip (already assigned):**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bulk assign complete: 3 assigned, 2 skipped (already assigned)",
  "data": {
    "sales_rep_id": "uuid",
    "requested": 5,
    "assigned": 3,
    "skipped": 2
  }
}
```

**Bulk Unassign — Success:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Bulk unassign complete: 2 removed, 0 were not assigned",
  "data": {
    "sales_rep_id": "uuid",
    "requested": 2,
    "unassigned": 2,
    "not_found": 0
  }
}
```

**List Assignments — Paginated:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Assignments fetched successfully",
  "data": [
    {
      "id": "uuid",
      "assigned_at": "2026-03-12T00:30:00.000Z",
      "salesRep": {
        "id": "uuid",
        "first_name": "Rahim",
        "last_name": "Uddin",
        "email": "rahim@salesrep.com"
      },
      "retailer": {
        "id": "uuid",
        "uid": "RET-0009485",
        "name": "Khan Dokan",
        "phone": "01353572874",
        "points": 869,
        "routes": "Route-20",
        "region": { "id": "uuid", "name": "Khulna" },
        "area": { "id": "uuid", "name": "Khalishpur" },
        "distributor": { "id": "uuid", "name": "Mega Trade BD" },
        "territory": { "id": "uuid", "name": "Khalishpur - Zone 1" }
      }
    }
  ],
  "meta": {
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

**CSV Import — Success with Errors:**

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Import complete: 3 inserted, 1 updated, 2 failed",
  "data": {
    "total": 6,
    "inserted": 3,
    "updated": 1,
    "failed": 2,
    "errors": [
      {
        "row": 5,
        "uid": "RET-0100005",
        "errors": ["Region \"Unknown\" not found"]
      },
      {
        "row": 6,
        "uid": "N/A",
        "errors": ["uid is required", "Invalid phone: \"123\""]
      }
    ]
  }
}
```

**Retailer Detail:**

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Retailer found",
  "data": {
    "id": "70d860b4-101b-4289-ba93-3c98b50f620c",
    "uid": "RET-0009485",
    "name": "Khan Dokan",
    "phone": "01353572874",
    "points": 869,
    "routes": "Route-20",
    "notes": "Regular customer",
    "created_at": "2026-03-11T18:00:00.000Z",
    "updated_at": "2026-03-12T00:30:00.000Z",
    "region": { "id": "uuid", "name": "Khulna" },
    "area": { "id": "uuid", "name": "Khalishpur" },
    "distributor": { "id": "uuid", "name": "Mega Trade BD" },
    "territory": { "id": "uuid", "name": "Khalishpur - Zone 1" }
  }
}
```

**Validation Error:**

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Bad Request",
  "error": [
    "sales_rep_id must be a UUID",
    "retailer_ids must contain at least 1 elements",
    "each value in retailer_ids must be a UUID"
  ]
}
```

**Unauthorized:**

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid or expired token"
}
```

**Forbidden (Wrong Role):**

```json
{
  "success": false,
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "You do not have permission to access this resource"
}
```

// ...existing code...

---

## 📤 CSV Bulk Import

### CSV File Format

| Column             | Required | Description                          |
| ------------------ | -------- | ------------------------------------ |
| `uid`              | ✅       | Unique retailer code (e.g., `RET-0100001`) |
| `name`             | ✅       | Retailer shop name                   |
| `phone`            | ✅       | 11-digit BD phone (`01XXXXXXXXX`)    |
| `region_name`      | ✅       | Must match an existing region name   |
| `area_name`        | ✅       | Must match an existing area name     |
| `distributor_name` | ✅       | Must match an existing distributor   |
| `territory_name`   | ✅       | Must match an existing territory     |
| `points`           | ❌       | Integer (default: `0`)               |
| `routes`           | ❌       | Route string                         |
| `notes`            | ❌       | Free text notes                      |

### Sample CSV

```csv
uid,name,phone,region_name,area_name,distributor_name,territory_name,points,routes,notes
RET-0100001,New Retail Shop,01712345678,Dhaka,Gulshan,AB Trading,Gulshan - Zone 1,100,Route-5,First import
RET-0100002,Khan Super Store,01898765432,Chattogram,Agrabad,Delta Suppliers,Agrabad - Zone 2,200,Route-12,
RET-0100003,Rahim Grocery,01567891234,Rajshahi,Boalia,Star Distribution Co.,Boalia - Zone 1,50,Route-3,New outlet
```

> 💡 **Tip:** You can find a comprehensive test file for bulk upload in the root directory named **[retailers_import_sample.csv](./retailers_import_sample.csv)**.

### Import via cURL

```bash
curl -X POST http://localhost:3000/api/retailers/import \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@./retailers_import_sample.csv"
```

### Import Response (Success)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Import complete: 3 inserted, 0 updated, 0 failed",
  "data": {
    "total": 3,
    "inserted": 3,
    "updated": 0,
    "failed": 0,
    "errors": []
  }
}
```

### Import Response (Partial Failures)

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Import complete: 1 inserted, 0 updated, 2 failed",
  "data": {
    "total": 3,
    "inserted": 1,
    "updated": 0,
    "failed": 2,
    "errors": [
      {
        "row": 3,
        "uid": "RET-0100002",
        "errors": ["Invalid phone: \"123\""]
      },
      {
        "row": 4,
        "uid": "RET-0100003",
        "errors": ["Region \"Unknown Region\" not found"]
      }
    ]
  }
}
```

> **Note:** If a UID already exists in the database, the row will **update** instead of insert.

---

## 🔄 Migration Commands

All migration commands can be run **inside Docker** or **locally**.

### Inside Docker (Recommended)

```bash
# Run all pending migrations
docker exec -it sales_rep_backend npm run migration:run

# Revert the last migration
docker exec -it sales_rep_backend npm run migration:revert

# Generate a new migration from entity changes
docker exec -it sales_rep_backend npm run migration:generate --name=AddNewField

# Create an empty migration file
docker exec -it sales_rep_backend npm run migration:create --name=CustomMigration
```

### Local (Outside Docker)

```bash
# Run all pending migrations
npm run migration:run

# Revert the last migration
npm run migration:revert

# Generate migration from entity changes
npm run migration:generate --name=AddNewField

# Create empty migration
npm run migration:create --name=CustomMigration
```

> ⚠️ When running locally, ensure `.env` has `DATABASE_HOST=localhost` and `DATABASE_PORT=5431`.

---

## 📜 All CLI Commands

### Docker Commands

```bash
# Start all services
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove all volumes (fresh start)
docker-compose down -v

# View logs (all services)
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# Check running containers
docker-compose ps

# Enter backend container bash
docker exec -it sales_rep_backend bash

# Run migrations inside container
docker exec -it sales_rep_backend npm run migration:run

# Run seed inside container
docker exec -it sales_rep_backend npm run seed

# Revert migration inside container
docker exec -it sales_rep_backend npm run migration:revert
```

### NPM Scripts (Local Development)

```bash
# ─── Development ─────────────────────────────────
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger
npm run start:prod         # Start production build

# ─── Build ───────────────────────────────────────
npm run build              # Compile TypeScript → dist/

# ─── Database ────────────────────────────────────
npm run migration:run      # Execute pending migrations
npm run migration:revert   # Rollback last migration
npm run migration:generate --name=Name  # Auto-generate migration
npm run migration:create --name=Name    # Create empty migration
npm run seed               # Seed database with test data

# ─── Code Quality ────────────────────────────────
npm run lint               # ESLint check & auto-fix
npm run format             # Prettier formatting

# ─── Testing ─────────────────────────────────────
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Generate coverage report
npm run test:e2e           # Run end-to-end tests
```

---

## 🔑 Default Credentials

After running the seed:

| Role       | Email                  | Password       |
| ---------- | ---------------------- | -------------- |
| **Admin**  | `admin@salesrep.com`   | `Password@123` |
| Sales Rep  | `rahim@salesrep.com`   | `Password@123` |
| Sales Rep  | `karim@salesrep.com`   | `Password@123` |
| Sales Rep  | `fatima@salesrep.com`  | `Password@123` |
| Sales Rep  | `hasan@salesrep.com`   | `Password@123` |
| Sales Rep  | `nusrat@salesrep.com`  | `Password@123` |
| Sales Rep  | `tanvir@salesrep.com`  | `Password@123` |
| Sales Rep  | `anika@salesrep.com`   | `Password@123` |
| Sales Rep  | `imran@salesrep.com`   | `Password@123` |
| Sales Rep  | `saima@salesrep.com`   | `Password@123` |
| Sales Rep  | `arif@salesrep.com`    | `Password@123` |

> Each Sales Rep is assigned **~1,000 retailers** from the seeded data.

---

## 🌐 API Response Format

All endpoints return a consistent JSON structure.

### ✅ Success Response (with pagination)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Assigned retailers fetched successfully",
  "data": [
    {
      "id": "70d860b4-101b-4289-ba93-3c98b50f620c",
      "uid": "RET-0009485",
      "name": "Khan Dokan",
      "phone": "01353572874",
      "points": 869,
      "routes": "Route-20",
      "region": { "id": "uuid", "name": "Khulna" },
      "area": { "id": "uuid", "name": "Khalishpur" },
      "distributor": { "id": "uuid", "name": "Mega Trade BD" },
      "territory": { "id": "uuid", "name": "Khalishpur - Zone 1" }
    }
  ],
  "meta": {
    "total": 1000,
    "page": 1,
    "limit": 20,
    "totalPages": 50
  },
  "error": null,
  "path": "/api/retailers",
  "method": "GET",
  "timestamp": "2026-03-12T00:30:00.000Z"
}
```

### ❌ Error Response

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Unauthorized",
  "data": null,
  "error": "Invalid credentials",
  "path": "/api/auth/local/login",
  "method": "POST",
  "timestamp": "2026-03-12T00:30:00.000Z"
}
```

### ❌ Validation Error

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "data": null,
  "error": [
    "email must be an email",
    "password should not be empty"
  ],
  "path": "/api/auth/local/login",
  "method": "POST",
  "timestamp": "2026-03-12T00:30:00.000Z"
}
```

---

## 📁 Project Structure

```
Sales Representative/
├── docker-compose.yaml          # PostgreSQL + Redis + Adminer + Backend
├── Dockerfile                   # NestJS container build
├── package.json                 # Dependencies & scripts
├── .env                         # Environment variables (create this)
├── README.md                    # This file
│
├── src/
│   ├── main.ts                  # Bootstrap, Swagger, global pipes/filters
│   ├── app.module.ts            # Root module — imports all feature modules
│   │
│   ├── common/                  # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts        # @Roles() decorator
│   │   │   └── public.decorator.ts       # @Public() skip auth
│   │   ├── enums/
│   │   │   └── user-role.enum.ts         # ADMIN | SALES_REP
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts  # Global error handler
│   │   ├── guard/
│   │   │   ├── jwt-auth.guard.ts         # JWT authentication guard
│   │   │   └── roles.guard.ts            # Role-based access guard
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts   # Unified response wrapper
│   │   ├── repositories/
│   │   │   └── base.repository.ts        # Generic CRUD + pagination
│   │   └── utils/
│   │       └── csv-parser.util.ts        # CSV file parser
│   │
│   ├── config/                  # Environment configs
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── redis.config.ts
│   │
│   ├── core/                    # Domain layer
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── retailer.entity.ts
│   │   │   ├── region.entity.ts
│   │   │   ├── area.entity.ts
│   │   │   ├── distributor.entity.ts
│   │   │   ├── territory.entity.ts
│   │   │   └── sales-rep-retailer.entity.ts
│   │   └── repositories/
│   │       ├── retailer.repository.ts
│   │       ├── regions.repository.ts
│   │       ├── area.repository.ts
│   │       ├── territories.repository.ts
│   │       ├── distributors.repository.ts
│   │       ├── users.repository.ts
│   │       └── assignment.repository.ts
│   │
│   ├── database/                # Database config & migrations
│   │   ├── data-source.ts       # TypeORM DataSource config
│   │   ├── database.module.ts
│   │   ├── seed.ts              # Database seeder script
│   │   └── migrations/          # Auto-generated migrations
│   │
│   └── modules/                 # Feature modules
│       ├── auth/                # JWT login, register, refresh, logout
│       ├── users/               # User profile management
│       ├── geography/           # Region, Area, Distributor, Territory CRUD
│       ├── retailer/            # Retailer listing, search, filter, CSV import
│       ├── assignment/          # Bulk assign/unassign retailers to SRs
│       └── redis/               # Redis caching service
```

---

## 🔐 Environment Variables

### For Docker (set in `docker-compose.yaml` → `backend.environment`)

Already configured in `docker-compose.yaml`. No `.env` file needed for Docker.

### For Local Development (create `.env` in project root)

```env
# ─── Application ─────────────────────────────────
NODE_ENV=development
PORT=3000

# ─── Database (use localhost:5431 when running outside Docker) ────
DATABASE_HOST=localhost
DATABASE_PORT=5431
DATABASE_USER=admin
DATABASE_PASSWORD=admin
DATABASE_NAME=sales_rep

# ─── JWT ─────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-refresh-secret-key-change-this
JWT_REFRESH_EXPIRES_IN=7d

# ─── Redis ───────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=60
REDIS_MAX_MEMORY=256mb
```

> ⚠️ **Docker vs Local:**
> - Docker: `DATABASE_HOST=db`, `DATABASE_PORT=5432`, `REDIS_HOST=redis`
> - Local: `DATABASE_HOST=localhost`, `DATABASE_PORT=5431`, `REDIS_HOST=localhost`

---

## 🔧 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs -f backend

# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### Migration fails

```bash
# Ensure database is running
docker-compose ps

# Wait for PostgreSQL to be ready, then retry
sleep 5
docker exec -it sales_rep_backend npm run migration:run
```

### "Relation not found" error

```bash
# Run migrations first!
docker exec -it sales_rep_backend npm run migration:run
```

### Port already in use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :5431
lsof -i :6379

# Kill the process
kill -9 <PID>
```

### Redis connection refused

```bash
# Verify Redis is running
docker exec -it redis_cache redis-cli ping
# Expected: PONG
```

### Reset everything (fresh start)

```bash
docker-compose down -v
docker-compose up -d --build
sleep 10
docker exec -it sales_rep_backend npm run migration:run
docker exec -it sales_rep_backend npm run seed
```



---

**Built with using NestJS, TypeORM, PostgreSQL, Redis & Docker**