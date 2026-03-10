# NestJS Backend Starter

A robust starter template for building modern, scalable backend services built with **NestJS (v11)**. This template features a pre-configured architecture including a PostgreSQL database, TypeORM for entity management, JWT authentication (local login & registration), global data validation, and Docker Compose for easy environment setup.

## 🚀 Features

- **NestJS v11**: Leverage the latest progressive Node.js framework.
- **PostgreSQL & TypeORM**: Robust, relational database management with complete migration support.
- **Authentication**: Pre-configured JWT flow using Passport.js, storing passwords safely via `bcryptjs`.
- **Data Validation**: Enforced globally using `class-validator` and `class-transformer` pipes.
- **Docker Compose**: Pre-packaged PostgreSQL database and Adminer interface for instant local development.
- **Strict Environment Validations**: Protects the app from booting with missing environment variables.
- **Global Error Handling**: Centralized global HTTP exception filters standardizing API responses.

## 📋 Prerequisites

Ensure you have the following installed on your local machine:
- **Node.js**: (v18 or higher recommended)
- **npm** or **yarn**
- **Docker & Docker Compose**: Essential for running the local database container stack.

## 🛠️ Getting Started

### 1. Install Dependencies

```bash
npm install
```


### 2. Environment Setup

Create a `.env` file in the root of your project. The application validates these variables upon startup using `@nestjs/config`.

```env
# Application Context
NODE_ENV=development
PORT=3000

# Database Configuration (Make sure this matches your local setup)
# When running locally (outside Docker), use 'localhost' and port '5431'
# due to the port mapping defined in docker-compose.yaml.
DATABASE_HOST=localhost
DATABASE_PORT=5431
DATABASE_USER=admin
DATABASE_PASSWORD=admin
DATABASE_NAME=starter

# Authentication Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-refresh-secret-jwt-key
JWT_REFRESH_EXPIRES_IN=7d
```

### 3. Spin Up the Database (`Docker Compose`)

This project includes a `docker-compose.yaml` file that spins up a PostgreSQL instance and an Adminer UI.

```bash
docker-compose up -d
```
*Note: The database maps to your local port `5431`. Adminer is available on `8080`.*

### 4. Run Database Migrations

Before you interact with the APIs, make sure all base tables (like `users` and `refresh_tokens`) are created from your migrations:

```bash
npm run migration:run
```

### 5. Start the Application

Start up your local Nest application. All endpoints are automatically prefixed with `/api`.

```bash
# development mode (with watchers)
npm run start:dev

# production mode
npm run start:prod
```

Your server will now be live at `http://localhost:3000/api`.

---

## 📚 API Endpoints Overview

Here are the main endpoints provided natively in this starter:

### Authentication Endpoints (Public)
#### `POST /api/auth/local/register`
Create a new user.
**Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "strongPassword123"
}
```

#### `POST /api/auth/local/login`
Authenticate to receive a JWT Bearer Token.
**Body:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123"
}
```

### Users Endpoints (Protected)
#### `GET /api/users/user`
**Headers:** `Authorization: Bearer <your-jwt-token>`  
Fetches the profile of the currently authenticated user.

---

## 🗄️ Database Management via Adminer

You can easily interact with your database using Adminer (included in docker-compose).
- **URL**: `http://localhost:8080/`
- **System**: PostgreSQL
- **Server**: `db`
- **Username**: `admin`
- **Password**: `admin`
- **Database**: `starter`

---

## 🏃‍♂️ Available CLI Scripts

Check out `package.json` for a variety of useful commands:

- `npm run build`: Compile the application targeting the `dist` output.
- `npm run format`: Standardize code formatting using Prettier.
- `npm run lint`: Find and automatically fix ESLint issues.
- `npm run test`: Run Jest unit tests.
- `npm run typeorm`: Execute TypeORM CLI base tools.
- `npm run migration:run`: Execute all pending database migrations against your running database.
- `npm run migration:generate --name=MigrationName`: Generates a SQL migration file automatically based on schema changes.
- `npm run migration:create --name=MigrationName`: Creates an empty TypeORM migration file.
- `npm run migration:revert`: Reverts the last executed TypeORM migration.

## 📁 Project Structure

```text
src/
├── common/        # Shared components (decorators, filters, guards)
├── config/        # Environment configurations (app, database, jwt validation)
├── database/      # Database module, TypeORM setup, and Migrations
├── modules/       # Domain-driven features (auth, users, etc.)
│   ├── auth/      # Authentication logic & Passport strategies
│   └── users/     # Users controller, service, entity, and repository
├── app.module.ts  # Root application module
└── main.ts        # App entry point (bootstrap, pipes, filters)
```
