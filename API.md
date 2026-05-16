# Authentication API Documentation

Complete authentication system with JWT, email verification, password reset, and login/register endpoints.

## Features

- **User Registration** - Create new accounts with email verification
- **Email Verification** - Verify email addresses before enabling login
- **Login** - JWT-based authentication
- **Forgot Password** - Send password reset link via email
- **Reset Password** - Update password with secure token
- **Password Security** - bcrypt hashing, single-use tokens, time-limited links

## Setup

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 2. Required Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@yourapp.com

# API
API_URL=http://localhost:3000
API_URI_PREFIX=api/v1
NODE_ENV=development
```

### 3. Database Setup

```bash
# Run migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate
```

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Start Development Server

```bash
pnpm dev
```

Server runs at `http://localhost:3000/api/v1`

## API Endpoints

### Register User

**POST** `/api/v1/auth/register`

Register a new user and send verification email.

**Request Body:**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "confirmPassword": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Response (201):**

```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "user": {
      "id": 1,
      "email": "john@example.com",
      "username": "johndoe",
      "full_name": "John Doe"
    }
  }
}
```

**Error (409):**

```json
{
  "message": "User with this email already exists"
}
```

---

### Verify Email

**POST** `/api/v1/auth/verify-email`

Verify user email using token from verification email.

**Request Body:**

```json
{
  "token": "verification-token-from-email"
}
```

**Response (200):**

```json
{
  "message": "Email verified successfully"
}
```

**Error (410):**

```json
{
  "message": "Verification token has expired"
}
```

---

### Login

**POST** `/api/v1/auth/login`

Login user and receive JWT access token. Email must be verified first.

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**

```json
{
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "john@example.com",
      "username": "johndoe",
      "full_name": "John Doe"
    }
  }
}
```

**Error (401):**

```json
{
  "message": "Invalid email or password"
}
```

**Error (403):**

```json
{
  "message": "Please verify your email before logging in"
}
```

---

### Forgot Password

**POST** `/api/v1/auth/forgot-password`

Request password reset link. Email will be sent with reset link.

**Request Body:**

```json
{
  "email": "john@example.com"
}
```

**Response (200):**

```json
{
  "message": "Password reset link has been sent to your email"
}
```

**Note:** Returns success even if email doesn't exist (security best practice).

---

### Reset Password

**POST** `/api/v1/auth/reset-password`

Reset password using token from reset email. Token expires in 15 minutes.

**Request Body:**

```json
{
  "token": "reset-token-from-email",
  "password": "NewSecurePassword456!",
  "confirmPassword": "NewSecurePassword456!"
}
```

**Response (200):**

```json
{
  "message": "Password reset successfully"
}
```

**Error (410):**

```json
{
  "message": "Reset token has expired"
}
```

**Error (410):**

```json
{
  "message": "Reset token has already been used"
}
```

---

## Using JWT Tokens

Include the token in request headers for authenticated endpoints:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Project Structure

```
src/
├── config/
│   ├── env.ts              # Environment variables
│   ├── database.ts         # Prisma client
│   └── serialization.ts    # BigInt serialization middleware
├── controllers/
│   └── auth.controller.ts  # Request handlers
├── services/
│   ├── auth.service.ts     # Business logic
│   ├── email.service.ts    # Email sending (Nodemailer)
│   └── token.service.ts    # JWT token generation
├── routes/
│   ├── auth.routes.ts      # Auth endpoints
│   └── index.ts            # Main router
├── middlewares/
│   ├── auth.middleware.ts  # JWT verification
│   └── error.middleware.ts # Error handling
├── utils/
│   ├── validation.ts       # Input validation (Joi)
│   └── token.ts            # Token generation utilities
├── types/
│   └── index.ts            # TypeScript interfaces
└── app.ts                  # Express app setup
```

## Database Schema

### users table

- `id` - Primary key (BigInt)
- `username` - Unique username (VARCHAR 50)
- `email` - Unique email (VARCHAR 100)
- `password_hash` - Bcrypt hashed password (VARCHAR 255)
- `full_name` - User's full name (VARCHAR 100, nullable)
- `email_verified` - Email verification status (Boolean, default: false)
- `role` - User role (Enum: user, admin; default: user)
- `status` - Account status (Enum: active, banned; default: active)
- `created_at` - Account creation timestamp
- `updated_at` - Last update timestamp
- `last_password_changed_at` - Password change audit trail

### email_verification_tokens table

- `id` - Primary key
- `user_id` - Foreign key to users
- `token` - Unique verification token
- `expires_at` - Token expiry timestamp (24 hours)

### password_reset_tokens table

- `id` - Primary key
- `user_id` - Foreign key to users
- `token` - Unique reset token
- `expires_at` - Token expiry timestamp (15 minutes)
- `used_at` - Single-use tracking timestamp

## Security Features

✅ **Password Hashing** - bcrypt with 10 salt rounds
✅ **JWT Tokens** - Secure token-based authentication
✅ **Email Verification** - Verify emails before login access
✅ **Single-Use Tokens** - Password reset tokens can only be used once
✅ **Time-Limited Links** - Tokens expire after configured duration
✅ **Input Validation** - Joi schema validation on all endpoints
✅ **Error Handling** - Safe error messages (no info leakage)
✅ **Account Lockout** - Banned status support

## Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- Alphanumeric + special characters supported

## Error Codes

| Status | Error            | Meaning                                                 |
| ------ | ---------------- | ------------------------------------------------------- |
| 400    | Validation error | Input validation failed                                 |
| 401    | Unauthorized     | Invalid credentials or missing token                    |
| 403    | Forbidden        | Email not verified / Account banned / Permission denied |
| 404    | Not found        | User/Token not found                                    |
| 409    | Conflict         | User/Email already exists                               |
| 410    | Gone             | Token expired or already used                           |
| 500    | Server error     | Internal server error                                   |

## Testing the API

### Example cURL Commands

**Register:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPass123!",
    "confirmPassword": "TestPass123!",
    "full_name": "Test User"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

**Forgot Password:**

```bash
curl -X POST http://localhost:3000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

## Development

### Available Scripts

```bash
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production build
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
```

### Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Authentication**: JWT + bcrypt
- **Email**: Nodemailer (SMTP)
- **Validation**: Joi
- **Language**: TypeScript

## License

ISC
